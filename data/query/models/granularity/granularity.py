from typing import List, Union

import related

from pydruid.utils.dimensions import DimensionSpec

from data.query.models.category import Category
from db.druid.util import GranularityTimeFormatExtraction, unpack_time_interval


@related.immutable
class Granularity:
    '''The Granularity model represents the time granularity a query will be grouped by.
    '''

    id = related.StringField()
    name = related.StringField()
    category = related.ChildField(Category)
    description = related.StringField('', required=False)

    def to_druid(self, query_intervals: List[str]) -> Union[str, dict]:
        '''Use the provided query intervals to build a grouping granularity
        to pass to druid.

        Args:
            query_intervals: A list of sorted query intervals that are being
                used for the current query. This should match the signature of
                FilterTree.to_druid_intervals.
        '''

        # $ConfigImportHack
        # pylint: disable=import-outside-toplevel
        from flask import current_app

        get_granularity_for_interval = (
            current_app.zen_config.aggregation_rules.get_granularity_for_interval
        )

        # Grab the start and end dates for this query.
        (start_date, end_date) = unpack_time_interval(query_intervals[0])
        # If the query is run over multiple time intervals, use the smallest
        # start date and the largest end date to produce the granularity. We can
        # safely look at the last element since FilterTree.to_druid_intervals is
        # guaranteed to produce a sorted time interval list.
        if len(query_intervals) > 1:
            (_, end_date) = unpack_time_interval(query_intervals[-1])
        output = get_granularity_for_interval(self.id, start_date, end_date)

        # HACK(stephen): Preliminary epi week support forced in. Uses Druid's builtin
        # week granularity to group by ISO week (starting on Monday) which will then
        # be formatted into the correct epi week value on the frontend. Currently
        # only supports WHO epi week format which starts on Mondays.
        if output == 'epi_week':
            output = 'week'

        # Otherwise, return the string or dict version of the granularity that can be
        # used in the query's `granularity` section.
        return output


@related.immutable
class GroupingGranularity:
    '''
    The GroupingGranularity model wraps a Granularity instance and provides
    additional query-specific features.
    `include_total` means a total value should be calculated at query time for
    the wrapped granularity and included in the results.
    '''

    # Dimension id
    granularity = related.ChildField(Granularity)
    include_total = related.BooleanField(False, key='includeTotal')

    def to_druid(self, query_intervals: List[str]) -> Union[str, dict, DimensionSpec]:
        output = self.granularity.to_druid(query_intervals)

        # If we are including a total value for this granularity, we must produce an
        # extraction-style DimensionSpec since the `granularity` part of a query cannot
        # be included in the subtotals section of a Druid query.
        if self.include_total and not isinstance(output, DimensionSpec):
            extraction = GranularityTimeFormatExtraction('YYYY-MM-dd', output)
            return DimensionSpec('__time', self.granularity.id, extraction)

        return output
