from builtins import object
from collections import defaultdict

from pydruid.utils.aggregators import count
from pydruid.utils.filters import Dimension

from db.druid.calculations.base_calculation import BaseCalculation
from db.druid.query_builder import GroupByQueryBuilder
from log import LOG
from web.server.data.status import INTERVAL
from web.server.routes.views.query_policy import enumerate_query_needs
from web.server.security.permissions import SuperUserPermission

# Key for the display name. Prefixed with __ to distinguish between actual
# dimensions.
DISPLAY_FIELD = '_display'

COUNT_AGGREGATION_NAME = 'count'
COUNT_CALCULATION = BaseCalculation(
    aggregations={COUNT_AGGREGATION_NAME: count('count')}
)


class DimensionValuesLookup(object):
    def __init__(
        self,
        query_client,
        datasource,
        filter_dimensions,
        dimension_slices,
        authorizable_dimensions,
        geo_field_ordering,
    ):
        self.query_client = query_client
        # Map from dimension to a list of dimension values.
        self.dimension_map = defaultdict(list)
        self.datasource = datasource
        self.dimension_slices = dimension_slices
        self.authorizable_dimensions = authorizable_dimensions
        self.geo_field_ordering = geo_field_ordering

        # TODO(abby): $ConfigRefactor remove once all config filter dimensions are converted.
        if isinstance(filter_dimensions, list):
            self.filter_dimensions = filter_dimensions
        else:
            self.filter_dimensions = [
                dimension
                for dimension_list in filter_dimensions.values()
                for dimension in dimension_list
                if dimension != '_all'
            ]

    def load_dimensions_from_druid(self):
        base_query = GroupByQueryBuilder(
            datasource=self.datasource.name,
            granularity='all',
            grouping_fields=[],
            intervals=INTERVAL,
            calculation=COUNT_CALCULATION,
        )
        for dimension in self.filter_dimensions:
            dimensions = self.dimension_slices.get(dimension, [dimension])
            base_query.dimensions = dimensions
            # pylint: disable=singleton-comparison
            base_query.query_filter = Dimension(dimension) != None

            LOG.info('Querying distinct %s from Druid...', dimensions)
            query_result = self.query_client.run_query(base_query)

            output_rows = []
            for row in query_result.result:
                event = row['event']
                output_row = dict(event)
                del output_row[COUNT_AGGREGATION_NAME]

                # Create a display version of this dimension that includes
                # the parent dimensions to help disambiguate dimension
                # values that are the same with a different hierarchy
                dimension_display = event[dimension]
                num_dimensions = len(dimensions)
                if num_dimensions > 1:
                    # NOTE(ian): This logic matches logic used on the
                    # frontend in SelectFilter.jsx
                    start = num_dimensions - 1
                    disambiguation = [
                        event[d] for d in dimensions[start::-1] if event[d]
                    ]
                    dimension_display = '%s (%s)' % (
                        dimension_display,
                        ', '.join(disambiguation),
                    )

                output_row[DISPLAY_FIELD] = dimension_display
                output_rows.append(output_row)

            # HACK(david): In the pk deployment we have a BatchNumber
            # dimension where values are of the form "Batch X". We want to
            # sort these numerically rather than alphabetcially.
            if dimension == 'BatchNumber':
                self.dimension_map[dimension] = sorted(
                    output_rows,
                    key=lambda a: int(a[DISPLAY_FIELD].split('Batch')[1]),
                )
            else:
                self.dimension_map[dimension] = sorted(
                    output_rows, key=lambda a: a[DISPLAY_FIELD]
                )

            LOG.info('%s values loaded for dimension: %s', len(output_rows), dimension)

        LOG.info('Done preloading dimension values.')

    def get_dimension_value_map(self, filter_values_by_identity=True):
        # TODO(vedant) - This shouldn't be built on every request and should ideally be cached in a
        # service somewhere.
        value_map = self.dimension_map
        if not filter_values_by_identity or SuperUserPermission().can():
            return value_map

        dimension_value_to_filter = {}
        updated_value_map = {}
        transient_dimension_values = {}
        query_needs = enumerate_query_needs()

        for (dimension, values) in list(value_map.items()):
            # TODO(vedant) - This will also incur significant performance penalties if built FOR EVERY request
            if dimension in self.authorizable_dimensions:
                updated_value_map[dimension] = []
                transient_dimension_values[dimension] = set()
                dimension_value_to_filter[dimension] = {}
                for value in values:
                    dimension_value = value[dimension]
                    dimension_value_to_filter[dimension_value] = value
            else:
                updated_value_map[dimension] = values

        if query_needs:
            for need in query_needs:
                # Filter with what the user can actually see
                for (dimension, dimension_filter) in list(
                    need.dimension_to_filter_mapping.items()
                ):
                    # NOTE(toshi): Check to see if this is a dimension filter
                    if dimension not in self.authorizable_dimensions:
                        continue

                    all_dimension_values = [
                        dimension_value[dimension]
                        for dimension_value in value_map[dimension]
                    ]
                    new_dimension_values = set()

                    if dimension_filter.all_values and dimension_filter.exclude_values:
                        for value in all_dimension_values:
                            if value not in dimension_filter.exclude_values:
                                new_dimension_values.add(value[dimension])
                    elif dimension_filter.all_values:
                        # If there are no exclude values, we don't need to strip out any values
                        # from the dimension value map.
                        new_dimension_values = set(all_dimension_values)
                    else:
                        for value in all_dimension_values:
                            if value in dimension_filter.include_values:
                                new_dimension_values.add(value)

                    filtered_dimension_values = transient_dimension_values[dimension]
                    transient_dimension_values[
                        dimension
                    ] = filtered_dimension_values.union(new_dimension_values)

        # Convert the set to a list
        for dimension, values in list(transient_dimension_values.items()):
            filters = [dimension_value_to_filter[value] for value in values]
            updated_value_map[dimension] = filters
        return updated_value_map

    def generate_alternate_dimension_value_map(self, dimension_value_map):
        # HACK(vedant) - For AlertNotification filtering...
        converted_dimension_map = defaultdict(set)
        ordering_levels = self.geo_field_ordering

        for level in ordering_levels:
            nodes_at_level = dimension_value_map[level]
            for node in nodes_at_level:
                is_excluded = False
                for _level in ordering_levels:
                    # HACK(vedant) - 'PostoName' is part of the aggregation rules
                    # but not populated in the Dimension Values Map. It will break
                    # the generation of this map
                    if _level == 'PostoName':
                        continue

                    if _level == level or is_excluded:
                        break

                    # If the parent level of the node is not in the dimension
                    # value map, we should _NOT_ add any of its children.
                    if node[_level] not in converted_dimension_map[_level]:
                        is_excluded = True

                if not is_excluded:
                    converted_dimension_map[level].add(node[level])

        return converted_dimension_map
