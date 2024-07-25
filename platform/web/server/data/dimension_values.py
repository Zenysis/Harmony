from collections import defaultdict

from pydruid.utils.filters import Dimension

from config.druid_base import DEFAULT_DRUID_INTERVAL
from db.druid.query_builder import GroupByQueryBuilder
from log import LOG
from web.server.environment import OFFLINE_MODE
from web.server.query.util import COUNT_AGGREGATION_NAME, COUNT_CALCULATION

# Key for the display name. Prefixed with __ to distinguish between actual
# dimensions.
DISPLAY_FIELD = '_display'


class DimensionValuesLookup:
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

        # TODO: $ConfigRefactor remove once all config filter dimensions are converted.
        if isinstance(filter_dimensions, set):
            self.filter_dimensions = filter_dimensions
        else:
            self.filter_dimensions = [
                dimension
                for dimension_list in filter_dimensions.values()
                for dimension in dimension_list
                if dimension != '_all'
            ]

    def load_dimensions_from_druid(self):
        if self.dimension_map:
            return

        base_query = GroupByQueryBuilder(
            datasource=self.datasource.name,
            granularity='all',
            grouping_fields=[],
            intervals=DEFAULT_DRUID_INTERVAL,
            calculation=COUNT_CALCULATION,
            optimize=False,
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
                    # NOTE: This logic matches logic used on the
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

            self.dimension_map[dimension] = sorted(
                output_rows, key=lambda a: a[DISPLAY_FIELD]
            )

            LOG.info('%s values loaded for dimension: %s', len(output_rows), dimension)

        LOG.info('Done preloading dimension values.')
