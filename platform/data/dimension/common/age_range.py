from data.dimension.base_dimension import BaseDimension
from data.dimension.common.fuzzy_age import FuzzyAge, MAX_AGE


class AgeRange(BaseDimension):
    '''
    A class that represents an age range with the upper and lower bounds.

    Attributes
    ----------

    lower_bound : FuzzyAge
        The lower bound of the age range

    upper_bound : FuzzyAge
        The upper bound of the age range
    '''

    def __init__(self, lower_bound, upper_bound):
        if not isinstance(lower_bound, FuzzyAge):
            raise ValueError(
                'Lower bound must be of type FuzzyAge. '
                'Supplied type: %s' % type(lower_bound)
            )

        if not isinstance(upper_bound, FuzzyAge):
            raise ValueError(
                'Upper bound must be of type FuzzyAge. '
                'Supplied type: %s' % type(lower_bound)
            )

        if lower_bound >= upper_bound:
            raise ValueError(
                'Lower bound must be less than upper bound. '
                'Test: %s >= %s' % (lower_bound, upper_bound)
            )

        self.lower_bound = lower_bound
        self.upper_bound = upper_bound
        self._dimension_value = [
            self.lower_bound.get_dimension_value(),
            self.upper_bound.get_dimension_value(),
        ]

    def __gt__(self, other_range):
        return (
            self.lower_bound < other_range.lower_bound
            and self.upper_bound > other_range.upper_bound
        )

    def __ge__(self, other_range):
        return (
            self.lower_bound <= other_range.lower_bound
            and self.upper_bound >= other_range.upper_bound
        )

    def __lt__(self, other_range):
        return (
            self.lower_bound > other_range.lower_bound
            and self.upper_bound < other_range.upper_bound
        )

    def __le__(self, other_range):
        return (
            self.lower_bound >= other_range.lower_bound
            and self.upper_bound <= other_range.upper_bound
        )

    def __eq__(self, other_range):
        return (
            self.lower_bound == other_range.lower_bound
            and self.upper_bound == other_range.upper_bound
        )

    def __ne__(self, other_range):
        return not (self == other_range)

    def pretty_print(self):
        return 'Age {0} - {1}'.format(
            self.lower_bound.pretty_print(), self.upper_bound.pretty_print()
        )

    def get_dimension_value(self):
        return self._dimension_value


AgeRange.UNKNOWN = AgeRange(MAX_AGE, FuzzyAge(years=(MAX_AGE.years + 1)))
