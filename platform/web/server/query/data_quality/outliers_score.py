# mypy: disallow_untyped_defs=True
from pandas import Series

from web.server.query.data_quality.data_quality_score import SCORE_WEIGHTS

EXTREME_OUTLIERS_WEIGHT = 20
MODERATE_OUTLIERS_WEIGHT = 2


# The expected proportion of each type of outlier if we have a normal
# distribution. We want to give a maximum score if we have that number (or
# fewer) outliers.
# https://en.wikipedia.org/wiki/68%E2%80%9395%E2%80%9399.7_rule
EXPECTED_FRACTION_MODERATE = 0.043
EXPECTED_FRACTION_EXTREME = 0.003


def calculate_score(fraction_extreme: float, fraction_moderate: float) -> int:
    unexpected_fraction_moderate = max(
        fraction_moderate - EXPECTED_FRACTION_MODERATE, 0
    )
    unexpected_fraction_extreme = max(fraction_extreme - EXPECTED_FRACTION_EXTREME, 0)

    return max(
        round(
            calculate_raw_score(
                unexpected_fraction_extreme, unexpected_fraction_moderate
            )
        ),
        0,
    )


def calculate_score_series(
    fraction_extreme_series: Series, fraction_moderate_series: Series
) -> Series:
    unexpected_fraction_moderate = (
        fraction_moderate_series - EXPECTED_FRACTION_MODERATE
    ).clip(lower=0)

    unexpected_fraction_extreme = (
        fraction_extreme_series - EXPECTED_FRACTION_EXTREME
    ).clip(lower=0)

    return (
        calculate_raw_score(unexpected_fraction_extreme, unexpected_fraction_moderate)
        .round()
        .clip(lower=0)
    )


def calculate_raw_score(
    unexpected_fraction_extreme: Series, unexpected_fraction_moderate: Series
) -> Series:
    normalized_score = (
        1
        - (EXTREME_OUTLIERS_WEIGHT * unexpected_fraction_extreme)
        - (MODERATE_OUTLIERS_WEIGHT * unexpected_fraction_moderate)
    )
    return normalized_score * SCORE_WEIGHTS['OUTLIERS']
