# pylint: disable=C0103

from datetime import datetime, timedelta

import pytest

from data.dimension.common.age_range import AgeRange
from data.dimension.common.fuzzy_age import FuzzyAge

ZERO_YEARS = FuzzyAge(years=0)
FIVE_YEARS = FuzzyAge(years=5)
FOUR_YEARS = FuzzyAge(years=4)
ONE_YEAR = FuzzyAge(years=1)
ONE_DAY = FuzzyAge(days=1)
ONE_HOUR = FuzzyAge(hours=1)
ONE_DAY_ONE_HOUR = FuzzyAge(days=1, hours=1)
ONE_THOUSAND_FOUR_HUNDRED_SIXTY_DAYS = FuzzyAge(days=1460)
ONE_THOUSAND_FOUR_HUNDRED_SIXTY_ONE_DAYS = FuzzyAge(days=1461)
THREE_SIXTY_FIVE_DAYS = FuzzyAge(days=365)
THREE_SIXTY_SIX_DAYS = FuzzyAge(days=366)
UNIX_EPOCH = datetime(year=1970, month=1, day=1, hour=0, minute=0, second=0)
ZERO_DELTA = timedelta(0)


def test_age_range_constructor_validation():
    with pytest.raises(ValueError):
        AgeRange(upper_bound=0, lower_bound=FIVE_YEARS)

    with pytest.raises(ValueError):
        AgeRange(upper_bound=ZERO_YEARS, lower_bound=5)

    with pytest.raises(ValueError):
        AgeRange(upper_bound=ZERO_YEARS, lower_bound=FIVE_YEARS)

    with pytest.raises(ValueError):
        AgeRange(upper_bound=FIVE_YEARS, lower_bound=FIVE_YEARS)


def test_age_range_get_dimension_value():
    zero_to_five = AgeRange(lower_bound=ZERO_YEARS, upper_bound=FIVE_YEARS)
    assert zero_to_five.get_dimension_value() == [
        ZERO_YEARS.get_dimension_value(),
        FIVE_YEARS.get_dimension_value(),
    ]


def test_fuzzy_age_constructor_validation():
    with pytest.raises(ValueError):
        FuzzyAge(years=-1)

    with pytest.raises(ValueError):
        FuzzyAge(months=-1)

    with pytest.raises(ValueError):
        FuzzyAge(days=-1)

    with pytest.raises(ValueError):
        FuzzyAge(hours=-1)


def test_fuzzy_age_no_precision_loss():
    assert ONE_DAY.compute_precision_loss() == ZERO_DELTA
    assert ONE_HOUR.compute_precision_loss() == ZERO_DELTA
    assert ONE_DAY_ONE_HOUR.compute_precision_loss() == ZERO_DELTA

    assert ONE_DAY.compute_precision_loss(reference_date=UNIX_EPOCH) == ZERO_DELTA
    assert ONE_HOUR.compute_precision_loss(reference_date=UNIX_EPOCH) == ZERO_DELTA
    assert (
        ONE_DAY_ONE_HOUR.compute_precision_loss(reference_date=UNIX_EPOCH) == ZERO_DELTA
    )

    assert (
        ONE_THOUSAND_FOUR_HUNDRED_SIXTY_ONE_DAYS.compute_precision_loss(UNIX_EPOCH)
        == ZERO_DELTA
    )
    assert (
        ONE_THOUSAND_FOUR_HUNDRED_SIXTY_DAYS.compute_precision_loss(UNIX_EPOCH)
        == ZERO_DELTA
    )


def test_fuzzy_age_with_precision_loss():
    assert FIVE_YEARS.compute_precision_loss(reference_date=UNIX_EPOCH) == timedelta(
        hours=5, minutes=6
    )

    assert FOUR_YEARS.compute_precision_loss(reference_date=UNIX_EPOCH) == timedelta(
        days=-1, hours=23, minutes=16, seconds=48
    )

    assert ONE_YEAR.compute_precision_loss(reference_date=UNIX_EPOCH) == timedelta(
        hours=5, minutes=49, seconds=12
    )


def test_fuzzy_age_comparison():
    assert FIVE_YEARS > ZERO_YEARS
    assert FIVE_YEARS >= ZERO_YEARS

    assert ZERO_YEARS < FIVE_YEARS
    assert ZERO_YEARS <= FIVE_YEARS

    assert ZERO_YEARS <= ZERO_YEARS
    assert ZERO_YEARS == FuzzyAge(years=0)
    assert ZERO_YEARS >= ZERO_YEARS
