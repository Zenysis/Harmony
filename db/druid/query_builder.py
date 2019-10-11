import pandas as pd
from pydruid.query import Query as PydruidQuery, QueryBuilder as DruidQueryBuilder
from pydruid.utils.dimensions import DimensionSpec
from pydruid.utils.filters import Bound as BoundFilter, Dimension, Filter

from db.druid.aggregations.query_dependent_aggregation import QueryDependentAggregation
from db.druid.aggregations.query_modifying_aggregation import QueryModifyingAggregation
from db.druid.calculations.base_calculation import BaseCalculation
from db.druid.util import build_query_filter_from_aggregations, EmptyFilter
from log import LOG

NAN = float('NaN')
POS_INFINITY = float('Infinity')
NEG_INFINITY = -POS_INFINITY

# Simple base class storing the common fields for all druid queries
# we care about (GroupBy, TopN, Time Series, Select)
class BaseDruidQuery(dict):
    def __init__(
        self, datasource, granularity, intervals, query_filter=None, context=None
    ):
        super(BaseDruidQuery, self).__init__()
        self.datasource = datasource
        self.granularity = granularity
        self.query_filter = query_filter
        self.intervals = intervals
        self.context = context
        self._druid_query_builder = DruidQueryBuilder()

    @property
    def datasource(self):
        return self['datasource']

    @datasource.setter
    def datasource(self, datasource):
        self['datasource'] = datasource

    @property
    def query_filter(self):
        # Intentional mismatch with property name and key to avoid using
        # reserved keyword 'filter'
        return self['filter']

    @query_filter.setter
    def query_filter(self, query_filter):
        # TODO(stephen): add check for when query_filter is not None but
        # is also not of type Filter to alert the caller
        if isinstance(query_filter, Filter):
            self['filter'] = query_filter
        else:
            self['filter'] = None

    @property
    def granularity(self):
        return self['granularity']

    @granularity.setter
    def granularity(self, granularity):
        self['granularity'] = granularity

    @property
    def intervals(self):
        return self['intervals']

    @intervals.setter
    def intervals(self, intervals):
        self['intervals'] = intervals

    @property
    def context(self):
        return self['context']

    @context.setter
    def context(self, context):
        self['context'] = context

    # Implemented in derived classes. Returns a pydruid Query
    def prepare(self):
        pass

    # Parse and modify the raw druid response before it is attached to pydruid.
    def parse(self, result):  # pylint: disable=no-self-use
        return result


# Create GroupBy druid queries over single data dimension. Uses filtered
# aggregations to avoid grouping by the data dimension. This allows multiple
# different data fields to be flattened into a single group, enabling the
# use of post aggregations over different data fields (that are actually
# stored as a single dimension)
class GroupByQueryBuilder(BaseDruidQuery):
    def __init__(
        self,
        datasource,
        granularity,
        grouping_fields,
        intervals,
        calculation,
        dimension_filter=None,
        optimize=True,
        subtotal_dimensions=None,
        subtotal_result_label='TOTAL',
    ):
        super(GroupByQueryBuilder, self).__init__(datasource, granularity, intervals)
        self.dimensions = grouping_fields
        self.subtotals = (
            SubtotalConfig(self.dimensions, subtotal_dimensions, subtotal_result_label)
            if subtotal_dimensions
            else None
        )

        # Build a copy of the input calculation with the fully built
        # aggregations and post aggregations.
        self.calculation = BaseCalculation()

        # Copy the calculations aggregations into the query. Call the
        # handlers of any aggregations that require information about
        # the current query to be built.
        self.query_modifier = None
        for key, aggregation in calculation.aggregations.items():
            # NOTE(stephen): Very special case where an aggregation can
            # modify the query before it is issued.
            if isinstance(aggregation, QueryModifyingAggregation):
                if not self.query_modifier:
                    self.query_modifier = aggregation
                else:
                    # If a query modifier has already been set, we should merge
                    # this query modifier into that one so that both are called.
                    self.query_modifier = self.query_modifier.merge_compatible_aggregation(
                        aggregation
                    )
                continue

            new_aggregation = aggregation
            # QueryDependentAggregations rely on certain query-time information
            # to be able to build their full filter and value sets. For example,
            # some aggregations should only be computed during the final time
            # interval of a query and not for the entire query duration.
            if isinstance(aggregation, QueryDependentAggregation):
                new_aggregation = aggregation.build_full_aggregation(
                    dimensions=self.dimensions,
                    granularity=self.granularity,
                    intervals=self.intervals,
                )

            self.calculation.add_aggregation(key, new_aggregation)

        self.calculation.add_post_aggregations(calculation.post_aggregations)

        # Build query filter from the selected data fields and dimensions.
        # Store dimension filters separate from aggregation filters so that
        # QueryModifyingAggregation can easily distinguish the filter types.
        # NOTE(stephen): Doing this *before* count fields are added so that
        # we don't duplicate the aggregation filters. Duplicating the filters,
        # while seemingly not a big deal, caused certain simple queries to take
        # 8x longer to run.
        self.aggregation_filter = build_query_filter_from_aggregations(
            self.calculation.aggregations
        )
        self.dimension_filter = dimension_filter or EmptyFilter()

        # To workaround druid's default value of 0 for filtered aggregations,
        # we track the count of all fields that should have a null check
        # applied. If those fields have a count == 0, then in the parse step
        # after the query is run, their value will be replaced with None.
        strict_null_fields = calculation.strict_null_fields
        self.calculation.set_strict_null_fields(strict_null_fields)
        self.calculation.add_count_for_fields(strict_null_fields)

        # Store the aggregations/post aggregations at the top level of the query
        # dict since pydruid needs them in a specific place.
        # NOTE(stephen): This is kinda weird since we can become out of sync
        # with the calculation.
        self.aggregations = self.calculation.aggregations
        self.post_aggregations = self.calculation.post_aggregations

        # Combine the aggregation filters and the dimension filters in to the
        # full query filter to use.
        self.query_filter = self.aggregation_filter & self.dimension_filter

        # Remove RegionName = 'Nation' from national level query in the ET database.
        # When nation is selected and no dimension filters are set.
        # TODO(attila): We shouldn't have a region named 'Nation' in the first place ... ?
        # The national value could be computed as a post aggregation or in a dataframe.
        if (
            not self.dimensions
            and isinstance(self.dimension_filter, EmptyFilter)
            and datasource.startswith('et')
        ):
            self.query_filter &= Dimension('RegionName') != 'Nation'

        # HACK(stephen): There appears to be a bug in how Druid produces
        # subtotals. Events produced by the first GroupBy pass inside Druid
        # are *reevaluated* against the original query filter. If the events
        # do not pass the original filter (and most of the time they do not for
        # us because we use filtered aggregations), then the event is *dropped*
        # from the final result. This happens even if the subtotals being
        # computed match the input dimensions exactly. To overcome this, we add
        # an extra filter that will only be valid on the computed events and
        # won't include any extra rows in the intermediate result (inside
        # Druid). This provides a filter that all events will pass while
        # subtotals are computed and will also ensure the non-subtotal events
        # accurate.
        # NOTE(stephen): This is fixed (Druid issue #7820) and can be removed
        # when the release containing the fix is live.
        if self.subtotals:
            # Use the first aggregation as the dimension to filter on.
            extra_filter = BoundFilter(list(self.aggregations.keys())[0], 0, None)
            self.query_filter |= extra_filter
        self.optimize = optimize

    @property
    def dimensions(self):
        return self['dimensions']

    @dimensions.setter
    def dimensions(self, dimensions):
        self['dimensions'] = dimensions

    @property
    def aggregations(self):
        return self['aggregations']

    @aggregations.setter
    def aggregations(self, aggregations):
        self['aggregations'] = aggregations

    @property
    def post_aggregations(self):
        return self['post_aggregations']

    @post_aggregations.setter
    def post_aggregations(self, post_aggregations):
        if not post_aggregations:
            post_aggregations = {}
        self['post_aggregations'] = post_aggregations

    def prepare(self):
        if self.query_modifier:
            self.query_modifier.modify_query(self)

        # Automatically optimize certain queries when we are confident the
        # optimizations will improve performance and produce the same results
        elif self.optimize:
            # If this is an aribtrary granularity and there is only one
            # interval to bucket the query by, then we can convert the
            # granularity into an ALL granularity type and set the query
            # interval to match the granularity bucket.
            granularity = self.granularity
            if (
                isinstance(granularity, dict)
                and granularity['type'] == 'arbitrary'
                and len(granularity['intervals']) == 1
            ):
                self.intervals[0] = granularity['intervals'][0]
                self.granularity = 'all'

            # If we don't have any dimensions to group by, we can use a
            # timeseries query
            if not self.dimensions:
                # Note: not calling query_builder.timeseries because
                # we don't need to perform their validation step which
                # only allows specific fields in the query (I just don't
                # want to modify this object and delete certain keys when
                # I don't need to).
                # NOTE(stephen): Marking `skipEmptyBuckets` as True so that the
                # timeseries query behaves the same as the groupby query. If the
                # user has explicitly marked to not skip the empty buckets, do
                # not override this choice.
                # TODO(stephen): Need to figure out how to include intermediary date
                # buckets for both groupby and timeseries that are *between* data points
                # with data.
                if not self.context or 'skipEmptyBuckets' not in self.context:
                    # Initialize context if it is currently missing.
                    if not self.context:
                        self.context = {}
                    self.context['skipEmptyBuckets'] = True
                return PydruidQueryWrapper(
                    self._druid_query_builder.build_query('timeseries', self)
                )

        # Wrap the pydruid query with our own class so we can add enhancements.
        query = PydruidQueryWrapper(self._druid_query_builder.groupby(self))

        # NOTE(stephen): SubtotalsSpec is not supported directly by pydruid.
        # Attach the values here.
        if not self.subtotals:
            return query

        query.query_dict['subtotalsSpec'] = self.subtotals.subtotal_spec
        return query

    # Parse the raw druid response. Convert fields that should be null to None,
    # and handle quirks in the druid JSON encoding.
    def parse(self, result):
        if not result:
            return result

        # Mapping from field name to the count field that should be used to
        # detect if the field value should be null.
        strict_field_map = {
            field: self.calculation.count_field_name(field)
            for field in self.calculation.strict_null_fields
        }

        numeric_fields = set(self.aggregations.keys())
        numeric_fields.update(iter(self.post_aggregations.keys()))

        # HACK(stephen): Handle differences between groupby and timeseries
        # response format.
        key = 'event' if 'event' in result[0] else 'result'

        # Create a copy of the result data with our modifications applied.
        output = []
        for row in result:
            # Clone the row since we will be modifying it.
            event = dict(row[key])
            output_row = dict(row)
            output_row[key] = event

            # If subtotals are computed, we need to attach special information
            # to the event so the user knows the result was a subtotal
            # computation.
            if self.subtotals:
                subtotal_dimension = self.subtotals.get_subtotal_dimension(event)
                if subtotal_dimension:
                    event[subtotal_dimension] = self.subtotals.subtotal_result_label

            for field in numeric_fields:
                value = event[field]

                # Since we use filtered aggregations on Druid, we lose the
                # ability to differentiate null from 0. To overcome this, we
                # track a count variable alongside each calculated field that we
                # care about null values for. If a field has a zero count value,
                # change the result value to None to simulate null filling.
                # NOTE(stephen): Avoiding a dict.get call here for performance
                # reasons on large datasets.
                if field in strict_field_map and event[strict_field_map[field]] == 0:
                    event[field] = None
                    continue

                # HACK(stephen): Exploit known property of deserialized druid
                # json that the values will either be strings or numeric. To
                # avoid costly checking for the different types of numeric
                # values (like with `isinstance(value, Number)`), we can check
                # if the value is *not* a string. If so, then we deduce it is
                # numeric (or null) and move on. This is a significant
                # performance improvement over the more safe check and is very
                # evident with large datasets (like large interval timeseries).
                if not isinstance(value, str):
                    continue

                # Druid wraps Infinity, -Infinity, and NaN in quotes which makes
                # it difficult for the JSON parser to properly expand them into
                # their correct type.
                if value == 'NaN':
                    value = NAN
                elif value == 'Infinity':
                    value = POS_INFINITY
                elif value == '-Infinity':
                    value = NEG_INFINITY
                else:
                    LOG.error('Illegal value for a metric: %s', value)
                    value = None
                event[field] = value
            output.append(output_row)
        return output

    # Convenience method for building filters on hierarchical dimensions
    # like locations. Each dimension in the dict is ANDed with the other
    # dimensions in that dict. Each dimension dict is ORed with the other
    # dimension dicts. This allows filtering on different dimensions while
    # ensuring that the individual dimension hierarchy is satisfied
    # Input example:
    # [
    #     {
    #         'RegionName': 'Addis Ababa',
    #         'ZoneName': 'Addis Ababa',
    #         'WoredaName': 'Addis Ketema'
    #     },
    #     {
    #         'RegionName': 'Oromiya',
    #         'ZoneName': 'Borena',
    #         'WoredaName': 'Abaya'
    #     }
    # ]
    @staticmethod
    def build_dimension_filter(dimensions):
        output = EmptyFilter()
        if not dimensions:
            return output

        for dimension in dimensions:
            inner_filter = EmptyFilter()
            for dim, value in dimension.items():
                inner_filter &= Filter(dimension=dim, value=value)
            output |= inner_filter
        return output


class SubtotalConfig:
    def __init__(self, dimensions, requested_subtotals, subtotal_result_label):
        self.dimensions = [
            dimension._output_name
            if isinstance(dimension, DimensionSpec)
            else dimension
            for dimension in dimensions
        ]
        (self.subtotal_spec, self.subtotal_groups) = self._parse_requested_subtotals(
            requested_subtotals
        )
        self.subtotal_result_label = subtotal_result_label

    # Parse a list of requested subtotal dimensions.
    # NOTE(stephen): At this time, we don't allow the user to specify the groups
    # themselves, they can only choose the dimension they want subtotals
    # computed for.
    # TODO(stephen): Better understand subtotals that are not consecutive with
    # the query dimensions (like dimensions: [A, B, C] and subtotal: [A, C]) and
    # add that functionality if it is useful.
    def _parse_requested_subtotals(self, requested_subtotals):
        # Always include the requested dimensions as a subtotal group, otherwise
        # druid will not return events for that groupin. The subtotal groups
        # take priority over the dimensions list.
        subtotal_spec = [self.dimensions]
        subtotal_groups = {}
        for subtotal_dimension in requested_subtotals:
            if subtotal_dimension not in self.dimensions:
                LOG.error(
                    'Subtotals requested for dimension not in the query: '
                    'Subtotal dimension: %s\tQueried dimensions: %s',
                    subtotal_dimension,
                    self.dimensions,
                )
                continue

            idx = self.dimensions.index(subtotal_dimension)
            subtotal_dimensions = self.dimensions[:idx]
            subtotal_spec.append(subtotal_dimensions)
            subtotal_groups[tuple(subtotal_dimensions)] = subtotal_dimension
        return (subtotal_spec, subtotal_groups)

    # For an individual query result event, find the subtotal dimension that
    # this event is calculated for. Druid does not provide an easy way to
    # detect that an event is computed for a subtotal. It just *omits* the
    # dimensions that were not needed for that subtotal.
    def get_subtotal_dimension(self, event):
        subtotal_dimensions = []
        for dimension in self.dimensions:
            if dimension not in event:
                break
            subtotal_dimensions.append(dimension)

        if len(subtotal_dimensions) == len(self.dimensions):
            return None

        return self.subtotal_groups[tuple(subtotal_dimensions)]


class PydruidQueryWrapper(PydruidQuery):
    '''Wrapper around a pydruid query to provide useful enhancements over the builtin
    version.

    NOTE(stephen): This style of wrapper is necessary because of the horrible structure
    of pydruids classes. They are tightly coupled to use their own classes and it is
    difficult to extend. Right now, it is easier to wrap than to rewrite.
    '''

    def __init__(self, pydruid_query):
        super().__init__(pydruid_query.query_dict, pydruid_query.query_type)

    # pylint: disable=arguments-differ
    def export_pandas(self, fill_intermediate_dates=False):
        '''Export the query result as pandas. Optionally, add empty rows for the unique
        dimension groupings to ensure all groups have results for all timestamps that
        have values.
        '''

        df = super().export_pandas()
        granularity = self.query_dict.get('granularity')

        # Don't try to fill in missing dates if we don't need to. Grouping by the
        # `all` granularity means there are no intermediary timestamps to fill. Also,
        # if the query type is not a grouping style query, we don't need to fill.
        if (
            not fill_intermediate_dates
            or granularity == 'all'
            or self.query_type not in ('timeseries', 'groupBy', 'topN')
        ):
            return df

        # Build a list of dates between the first reported value and the last reported
        # value in the query result.
        required_dates = self._build_result_dates(df)

        # If there is only zero or one dates in the result, then we do not need to fill
        # intermediary values. This is because all rows returned have all possible
        # dates.
        if len(required_dates) < 2:
            return df

        # Get the list of grouping dimensions. Extract the dimension name from a
        # dimension spec if the dimension type is not a string.
        # NOTE(stephen): Does not support filtered dimension specs right now.
        dimensions = self.query_dict.get('dimensions') or []
        dimension_names = [
            d if isinstance(d, str) else d['outputName'] for d in dimensions
        ]

        # Extract the unique combination of dimension values returned.
        if dimension_names:
            unique_dimension_values = df[dimension_names].drop_duplicates()
            unique_dimension_values['merge_key'] = 1
        else:
            # If there are no dimensions being grouped on, we should only have a single
            # length dataframe to merge on.
            # NOTE(stephen): This dataframe must be constructed differently because
            # slicing a df on an empty list causes issues.
            unique_dimension_values = pd.DataFrame([1], columns=['merge_key'])

        # If we only have one result, we do not need to fill intermediate dates.
        if len(unique_dimension_values) < 2:
            return df

        # Quick check to see if the dataframe already has all possible timestamps for
        # all possible unique dimension values.
        if len(df) == (len(unique_dimension_values) * len(required_dates)):
            return df

        # Build a dataframe containing the required dates that each unique dimension
        # value should have a row for.
        required_dates_df = pd.DataFrame(required_dates, columns=['timestamp'])
        required_dates_df['merge_key'] = 1

        # Perform a cross product (outer join) between these two dataframes to produce
        # a dataframe containing a row for each unique dimension value combination and
        # each required timestamp.
        dimensions_by_timestamp_df = unique_dimension_values.merge(
            required_dates_df, how='outer', copy=False
        ).drop(columns=['merge_key'])

        # Join the two dataframes together so that every possible unique dimension value
        # set has every required timestamp.
        return df.merge(dimensions_by_timestamp_df, how='outer', sort=False, copy=False)

    def _build_result_dates(self, df):
        '''Build a list of dates this dataset covers. This can be different than the
        *queried* date range because the query filter might have excluded certain dates
        from being returned.'''

        # NOTE(stephen): Using the full timestamp format for date strings because that's
        # what Druid returns. We want to keep the final query result consistent.
        first_timestamp = df.timestamp.min()
        last_timestamp = df.timestamp.max()
        granularity = self.query_dict['granularity']
        if isinstance(granularity, dict):
            # Can only handle `arbitrary` complex granularity type.
            if granularity['type'] != 'arbitrary':
                return []

            dates = [
                '%sT00:00:00.000Z' % i.split('/')[0] for i in granularity['intervals']
            ]
            start_idx = dates.index(first_timestamp)
            last_idx = dates.index(last_timestamp)
            return dates[start_idx : last_idx + 1]

        # We can only build date ranges for certain granularities with pandas.
        if granularity not in ('day', 'month', 'quarter'):
            return []

        # Convenience mapping to pandas frequency string.
        # day -> d, month -> m, quarter -> q
        freq = granularity[0]
        return [
            d.start_time.strftime('%Y-%m-%dT00:00:00.000Z')
            for d in pd.period_range(first_timestamp, last_timestamp, freq=freq)
        ]
