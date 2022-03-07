from typing import List

import related

from pydruid.utils.dimensions import DimensionSpec, JavascriptExtraction

from data.query.models.granularity.granularity import Granularity
from db.druid.js_formulas.week_extraction import WHO_EPI_WEEK_EXTRACTION_FORMULA
from db.druid.util import GranularityTimeFormatExtraction


@related.immutable
class GranularityExtraction(Granularity):
    '''The GranularityExtraction model represents a transformation of a row's
    timestamp into a specific format. This transformed value will then be
    grouped on when running a query. An example use case is "month of year".
    This extraction will convert a date (i.e. 2019-08-31) into its "month of
    year" value (i.e. 08). The query will then be grouped by this "month of
    year" value, along with any other selected dimensions.
    '''

    # Mapping of date extraction label to the format.
    # NOTE(vinh): The format of this ID is `${druid_granularity}_of_year`.
    # NOTE(vinh): The date format provided must be a valid ISO date format. The year
    # chosen is 3000 to make the values look very wrong if someone is trying to debug
    # the query directly in Druid.
    EXTRACTION_MAP = {
        'day_of_year': GranularityTimeFormatExtraction('3000-MM-dd', 'day'),
        'week_of_year': GranularityTimeFormatExtraction('3000-MM-dd', 'week'),
        'month_of_year': GranularityTimeFormatExtraction('3000-MM-01', 'month'),
        'quarter_of_year': GranularityTimeFormatExtraction('3000-MM-01', 'quarter'),
        'epi_week_of_year': JavascriptExtraction(WHO_EPI_WEEK_EXTRACTION_FORMULA),
    }

    def to_druid(self, query_intervals: List[str]) -> DimensionSpec:
        extraction = self.EXTRACTION_MAP.get(self.id)

        # If a prebuilt extraction cannot be found for this type, assume that we should
        # build an Extraction that matches the stored granularity exactly (like month,
        # year, etc.).
        if not extraction:
            druid_granularity = super().to_druid(query_intervals)
            if isinstance(druid_granularity, DimensionSpec):
                return druid_granularity

            extraction = GranularityTimeFormatExtraction(
                'YYYY-MM-dd', druid_granularity
            )

        return DimensionSpec('__time', self.id, extraction)

    @staticmethod
    def from_granularity(granularity: Granularity) -> 'GranularityExtraction':
        # mypy-related-issue
        return GranularityExtraction(  # type: ignore[call-arg]
            granularity.id,
            granularity.name,
            granularity.category,
            granularity.description,
        )
