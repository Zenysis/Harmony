from datetime import datetime, timezone
from typing import Dict

from pydruid.query import Query as PydruidQuery, QueryBuilder as DruidQueryBuilder
from pydruid.utils.dimensions import DimensionSpec
from pydruid.utils.filters import Dimension, Filter

from db.druid.aggregations.query_dependent_aggregation import QueryDependentAggregation
from db.druid.aggregations.query_modifying_aggregation import QueryModifyingAggregation
from db.druid.calculations.base_calculation import BaseCalculation
from db.druid.query_builder_util.optimization import apply_optimizations
from db.druid.util import (
    build_query_filter_from_aggregations,
    EmptyFilter,
    unpack_time_interval,
)
from log import LOG

NAN = float('NaN')
POS_INFINITY = float('Infinity')
NEG_INFINITY = -POS_INFINITY


# NOTE(stephen): Parsing and formatting dates is a very slow operation in python. We
# want to cache any date values seen so we can quickly return the date string. The
# range of possible timestamps we will see is low, so this cache should not grow too
# large.
_DATE_CACHE: Dict[float, str] = {}


def _timestamp_to_date_str(timestamp_ms):
    if timestamp_ms not in _DATE_CACHE:
        utc_timestamp = int(timestamp_ms / 1000)
        date_str = datetime.utcfromtimestamp(utc_timestamp).strftime(
            '%Y-%m-%dT00:00:00.000Z'
        )
        _DATE_CACHE[timestamp_ms] = date_str
    return _DATE_CACHE[timestamp_ms]


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
        filter_non_aggregated_rows=True,
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
        # NOTE(stephen): If the user has chosen *not* to filter non-aggregated rows,
        # then we will only apply the dimension filter. This will have serious
        # performance implications and may lead to both enormous query result size
        # and/or slow query speed. The default behavior is to filter for rows that match
        # any of the calculations being computed. This significantly improves
        # performance since rows that would not contribute to the query result values
        # (and would always result in `null`) are not processed by Druid.
        self.query_filter = (
            self.aggregation_filter & self.dimension_filter
            if filter_non_aggregated_rows
            else self.dimension_filter
        )

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
        self.having = None
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

    @property
    def having(self):
        return self['having']

    @having.setter
    def having(self, having):
        self['having'] = having

    def prepare(self):
        if self.query_modifier:
            self.query_modifier.modify_query(self)

        # Automatically optimize certain queries when we are confident the
        # optimizations will improve performance and produce the same results
        elif self.optimize:
            apply_optimizations(self)

            # If we don't have any dimensions to group by, we can use a
            # timeseries query. Timeseries queries do not support `having` clauses,
            # though.
            if not self.dimensions and not self.having:
                # Note: not calling query_builder.timeseries because
                # we don't need to perform their validation step which
                # only allows specific fields in the query (I just don't
                # want to modify this object and delete certain keys when
                # I don't need to).
                # NOTE(stephen): Marking `skipEmptyBuckets` as True so that the
                # timeseries query behaves the same as the groupby query. If the
                # user has explicitly marked to not skip the empty buckets, do
                # not override this choice.
                if not self.context or 'skipEmptyBuckets' not in self.context:
                    # Initialize context if it is currently missing.
                    if not self.context:
                        self.context = {}
                    self.context['skipEmptyBuckets'] = True
                return PydruidQueryWrapper(
                    self._druid_query_builder.build_query('timeseries', self)
                )

        # HACK(stephen): For deployments that are on Druid 0.16.0, we need to use the
        # array based result format to fix backwards compatibility. See comment in
        # parse code below.
        if not self.context:
            self.context = {}
        self.context['resultAsArray'] = True

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

        # HACK(stephen): GIANT HACK. Druid 0.16.0 has CHANGED the groupby response
        # format. Previously, dimension values that were null would be included in the
        # response. Now, they are omitted:
        # https://github.com/apache/incubator-druid/issues/8631
        # To work around this and provide a consistent interface, we have switched the
        # response format to array based rows. These rows will receive the full list
        # of values and nothing will be omitted.
        # TODO(stephen): Eventually use this array result to improve performance of
        # exporting to pandas.
        array_based_result = isinstance(result[0], list)
        header = []
        first_timestamp_ms = None
        if array_based_result:
            key = 'event'

            # When the granularity is "all", there will be no timestamp returned in the
            # Druid rows. For backwards compatibility reasons, we need to still populate
            # a timestamp. Use the first date of the query intervals as the
            # representative timestamp.
            first_date = unpack_time_interval(self.intervals[0])[0]
            first_timestamp_ms = (
                datetime(
                    first_date.year,
                    first_date.month,
                    first_date.day,
                    tzinfo=timezone.utc,
                ).timestamp()
                * 1000
            )
            if self.granularity != 'all':
                header.append('timestamp')

            for dimension in self.dimensions:
                if isinstance(dimension, DimensionSpec):
                    header.append(dimension._output_name)
                else:
                    header.append(dimension)

            header.extend(list(self.aggregations.keys()))
            header.extend(list(self.post_aggregations.keys()))

        # Create a copy of the result data with our modifications applied.
        output = []
        for row in result:
            if array_based_result:
                # TODO(stephen): It would be a lot faster to just leave results in an
                # array format. Refactor call sites to either explicitly ask for a dict
                # representation, migrate to just using pandas, or call a different
                # method. Also handle timeseries differences.
                event = dict(zip(header, row))
                # The timestamp returned in the array based result is in milliseconds
                # since epoch.
                timestamp_ms = event.pop('timestamp', first_timestamp_ms)
                # Parse and convert the timestamp into the date format we expect from
                # the non-array based results.
                parsed_timestamp = _timestamp_to_date_str(timestamp_ms)
            else:
                event = row[key]
                parsed_timestamp = row['timestamp']

            # Store timestamp directly on event to make pandas dataframe parsing simpler
            # later.
            event['timestamp'] = parsed_timestamp

            # Build the non-array based druid result format since pydruid wants it.
            output_row = {
                'event': event,
                'timestamp': parsed_timestamp,
                'version': 'v1',
            }

            # If subtotals are computed, we need to attach special information
            # to the event so the user knows the result was a subtotal
            # computation.
            if self.subtotals:
                subtotal_dimension = self.subtotals.get_subtotal_dimension(
                    output_row, output[-1] if output else None
                )
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
        self.subtotal_spec = self._parse_requested_subtotals(requested_subtotals)
        self.subtotal_result_label = subtotal_result_label
        self.current_subtotal_level = None

    # Parse a list of requested subtotal dimensions.
    # NOTE(stephen): At this time, we don't allow the user to specify the groups
    # themselves, they can only choose the dimension they want subtotals
    # computed for.
    # TODO(stephen): Better understand subtotals that are not consecutive with
    # the query dimensions (like dimensions: [A, B, C] and subtotal: [A, C]) and
    # add that functionality if it is useful.
    def _parse_requested_subtotals(self, requested_subtotals):
        subtotal_spec = []

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

        # Always include the requested dimensions as a subtotal group, otherwise
        # druid will not return events for that groupin. The subtotal groups
        # take priority over the dimensions list.
        subtotal_spec.append(self.dimensions)

        # Reverse the subtotal_spec dimensions before returning so we have the full
        # grouping result first, then subtotal, subtotal, subtotal ...This allows us
        # to parse the result and detect subtotals more cleanly.
        # Example: [ [R, Z, W], [R, Z], [R], []]
        return subtotal_spec[::-1]

    def get_subtotal_dimension(self, row, prev_row):
        '''Determine which subtotal dimension this row represents. If the row is not
        a subtotal row, the subtotal dimension returned will be None.

        Druid does not provide an easy way to determine which rows are subtotal rows
        and which are regular rows. We rely on the ordering of the query result rows to
        deduce if the row is part of the subtotal section or not. The query result rows
        will follow this order:
            - self.subtotalspec[0] - Non subtotal rows representing the full grouping
                result
            - self.subtotalspec[1] - Subtotal rows representing the first subtotal
                level requested.
            - ...
            - self.subtotalspec[n - 1] - The final subtotal grouping.

        The rows in each block are sorted in ascending order by dimension values (with
        the dimension ordering following the order of dimensions queried). We use this
        sorting guarantee to reliably detect when one block ends and the next block
        begins.

        NOTE(stephen): Previously (Druid < 0.16.0) the result row format Druid produced
        would *omit* the dimension key completely for each subtotal row. We could use
        this to detect more easily if the row was a subtotal row or not. Starting with
        Druid 0.16.0, the row format changed and the events we receive now contain an
        entry for all dimensions even if the row is a subtotal row. I hope Druid adds
        a more reliable way to detect subtotals in the future.
        '''
        # Subtotals will always come after the normal groupby result in the full
        # result list.
        if not prev_row:
            return None

        event = row['event']
        prev_event = prev_row['event']

        # Quick test to see if we are at the start of the subtotal section. The subtotal
        # section will start with the final dimension value being None.
        # NOTE(stephen): This check is not exhaustive but works for a majority of
        # queries. It is useful to avoid the slightly slower path of parsing each
        # dimension value and then making a decision.
        if (
            self.current_subtotal_level is None
            and event.get(self.dimensions[-1]) is not None
        ):
            return None

        # From the outside in, determine if this event is alphabetically sorted
        # after the previous event or before. If the event is alphabetically sorted
        # before the previous event, then we have entered a new subtotal section.
        section_start = False
        all_equal = True
        for dimension in self.dimensions:
            # NOTE(stephen): Using `or ''` to convert None values to strings for
            # easier comparison.
            dimension_value = event.get(dimension) or ''
            prev_dimension_value = prev_event.get(dimension) or ''
            if dimension_value == prev_dimension_value:
                continue

            all_equal = False
            section_start = (
                dimension_value < prev_dimension_value
                and row['timestamp'] <= prev_row['timestamp']
            )
            break

        # Handle edge case where all the dimension values are the same between the
        # current and previous rows. This can happen if a query filter produces only
        # one unique grouping of dimension values AND the most granular dimension is
        # null. In the raw query result, there will be two identical rows back to back.
        # If this happens, we can assume that we are entering a new subtotal group since
        # otherwise druid would not have returned identical rows. Need to include a
        # timestamp comparison as well since grouping by a non-all time granularity can
        # produce rows with the same dimension values but not the same timestamp.
        if all_equal and row['timestamp'] <= prev_row['timestamp']:
            section_start = True

        # If we are starting a new section, update the current subtotal level. By
        # storing the current subtotal level, we can correctly return the
        if section_start:
            if self.current_subtotal_level is None:
                self.current_subtotal_level = len(self.dimensions)
            self.current_subtotal_level -= 1

        # If the current subtotal level is not initialized, then we have not yet entered
        # the subtotal section of the query response.
        if self.current_subtotal_level is None:
            return None

        return self.dimensions[self.current_subtotal_level]


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
        # NOTE(stephen): Deferring pandas import since this is library code that might
        # not get called by all users.
        import pandas as pd

        # NOTE(stephen): Pydruid's default pandas parsing behavior makes a ton of
        # unnecesesary copies of data elements. It can really slow down with large
        # queries. Only use it if we are using an unsupported query type here.
        if self.query_type not in ('timeseries', 'groupBy'):
            return super().export_pandas()

        # NOTE(stephen): The event format is slightly tweaked from Druid's normal format
        # since the timestamp is stored directly on the event (during the `parse` method
        # of GroupByQueryBuilder).
        df = pd.DataFrame(row['event'] for row in self.result)
        granularity = self.query_dict.get('granularity')

        # Don't try to fill in missing dates if we don't need to. Grouping by the
        # `all` granularity means there are no intermediary timestamps to fill.
        if df.empty or not fill_intermediate_dates or granularity == 'all':
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
            # NOTE(stephen): We can handle a limited set of period granularities right
            # now. Currently week is the only one supported.
            # TODO(stephen): It would be cool to have a generalized version of this one
            # day. Right now it is not needed.
            if granularity['type'] == 'period':
                if granularity['period'] != 'P1W':
                    return []

                # Determine which day of the week the week starts on.
                # HACK(stephen): Defining the lookup inline here as a tuple. This should
                # ideally be defined as a constant somewhere else, however this file is
                # growing way too large. It needs to be refactored!
                # NOTE(stephen): These are the *anchored offsets* defined by Pandas for
                # the week granularity. They represent the day that the week *ends*, not
                # the day that the week *starts*. It's less intuitive.
                # NOTE(stephen): Introspecting the dataframe first timestamp instead of
                # parsing the granularity period's origin since it might not exist.
                # https://pandas.pydata.org/pandas-docs/stable/user_guide/timeseries.html#anchored-offsets
                first_date = datetime.strptime(first_timestamp[:10], '%Y-%m-%d')
                freq = ('W-SUN', 'W-MON', 'W-TUE', 'W-WED', 'W-THU', 'W-FRI', 'W-SAT')[
                    first_date.weekday()
                ]
                return self._build_date_range(first_timestamp, last_timestamp, freq)

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
        if granularity not in ('day', 'week', 'month', 'quarter'):
            return []

        # Convenience mapping to pandas frequency string.
        # day -> d, week -> w, month -> m, quarter -> q
        # NOTE(stephen): Week starts on Monday for both pandas and druid, so we are safe
        # here.
        return self._build_date_range(first_timestamp, last_timestamp, granularity[0])

    def _build_date_range(self, first_timestamp, last_timestamp, freq):
        # NOTE(stephen): Deferring pandas import since this is library code that might
        # not get called by all users.
        # pylint: disable=import-outside-toplevel
        import pandas as pd

        return [
            d.start_time.strftime('%Y-%m-%dT00:00:00.000Z')
            for d in pd.period_range(first_timestamp, last_timestamp, freq=freq)
        ]
