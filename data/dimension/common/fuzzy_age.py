from builtins import str
from past.utils import old_div
from datetime import datetime
from dateutil.relativedelta import relativedelta

from data.dimension.base_dimension import BaseDimension

_HOURS_IN_DAY_ = 24.0
_MONTHS_IN_YEAR_ = 12.0
_AVERAGE_DAYS_IN_YEAR_ = 365.2425
_AVERAGE_DAYS_IN_MONTH_ = old_div(_AVERAGE_DAYS_IN_YEAR_, _MONTHS_IN_YEAR_)

# pylint: disable=R0902
class FuzzyAge(BaseDimension):
    '''
    Represents a 'fuzzy' age that allows one to define an absolute time interval
    using years and months but also results in a precision loss owing to the fact
    that time representation using years and months no longer represents an absolute
    point in time unless a reference date is provided.

    e.g.
    4 years, 2 months from '2016-10-24 00:00:00' represents an absolute point in time
    4 years, 2 months without a reference date does not represent an absolute point in time

    This is owing to the existence of leap years and the divergent lengths of time that one
    month represents.

    If years and months are not specified and time is only represented in hours and days,
    there will be virtually no precision loss due to the effectively non-variant nature
    of the length of a day/hour.

    Attributes
    ----------

    years : int
        The number of years represented by this age value.

    months : int
        The number of months represented by this age value.

    days : int
        The number of days represented by this age value.

    hours : int
        The number of hours represented by this age value.

    total_hours : float
        The amalgamate years, months, days and hours represented by this age value in hours.
    '''

    def __init__(self, years=0, months=0, days=0, hours=0):

        if years < 0 or not isinstance(years, int):
            raise ValueError('years must be a non-negative integer.')

        if months < 0 or not isinstance(months, int):
            raise ValueError('months must be a non-negative integer.')

        if days < 0 or not isinstance(days, int):
            raise ValueError('days must be a non-negative integer.')

        if hours < 0 or not isinstance(hours, int):
            raise ValueError('hours must be a non-negative integer.')

        self.years = years
        self.months = months
        self.days = days
        self.hours = hours
        self._source_years = years
        self._source_months = months
        self._source_days = days
        self._source_hours = hours

        # Silencing pylints since redefinition of types is only in the scope of the constructor
        # and the types match the values defined in the docstring at the end of the method.
        if self.hours >= _HOURS_IN_DAY_:
            self.days += int(old_div(self.hours, _HOURS_IN_DAY_))
            self.hours = self.hours % _HOURS_IN_DAY_  # pylint: disable=R0204

        if self.days >= _AVERAGE_DAYS_IN_MONTH_:
            # We are performing a modulo operation where the divisor is not an
            # guaranteed to be an integer. As such, the resultant remainder may not
            # be an integer. To that effect, we need to convert any trailing
            # decimal points to a value that represents time in hours that can
            # be added to 'self.hours'
            self.months += int(old_div(self.days, _AVERAGE_DAYS_IN_MONTH_))
            remainder_days = self.days % _AVERAGE_DAYS_IN_MONTH_
            rounded_days = round(remainder_days, 0)
            difference = abs(remainder_days - rounded_days)
            self.hours += difference * _HOURS_IN_DAY_
            self.days = int(rounded_days)

        if self.months >= _MONTHS_IN_YEAR_:
            self.years += int(old_div(self.months, _MONTHS_IN_YEAR_))
            self.months = self.months % _MONTHS_IN_YEAR_  # pylint: disable=R0204

        self.total_hours = self.years * _AVERAGE_DAYS_IN_YEAR_ * _HOURS_IN_DAY_
        self.total_hours += self.months * (_AVERAGE_DAYS_IN_MONTH_ * _HOURS_IN_DAY_)
        self.total_hours += self.days * _HOURS_IN_DAY_
        self.total_hours += self.hours
        self.total_hours_rounded = int(round(self.total_hours, 0))

        # It is possible that hours may represent a floating point value
        self.hours = int(self.hours)

    def __gt__(self, other_age):
        return self.total_hours > other_age.total_hours

    def __ge__(self, other_age):
        return self.total_hours >= other_age.total_hours

    def __le__(self, other_age):
        return self.total_hours <= other_age.total_hours

    def __lt__(self, other_age):
        return self.total_hours < other_age.total_hours

    def __eq__(self, other_age):
        return self.total_hours == other_age.total_hours

    def __ne__(self, other_age):
        return not (self == other_age)

    # TODO(ian, stephen, vedant) This is okay for now but we should be able to
    # represent the pretty printed value in a localized format
    # (e.g. English, Amharic, etc.)
    def pretty_print(self):
        output = ''

        if self.years > 0:
            output += '{0} year(s), '.format(self.years)

        if self.months > 0:
            output += '{0} month(s), '.format(self.months)

        if self.days > 0:
            output += ' {0} day(s), '.format(self.days)

        if self.hours > 0:
            output += ' {0} hour(s)'.format(self.hours)

        if output.endswith(', '):
            output = output[:-2]

        return output

    def compute_precision_loss(self, reference_date=None):
        '''
        Given a reference point in time, attempts to compute the loss of precision incurred from
        using a 'fuzzy' point in time.

        Parameters
        ----------
        reference_date : datetime
            The absolute point in time that will be used as the reference point from which to
            compute the precision loss. If not specified, this will default to the current
            UTC time.

        Returns
        -------
        timedelta
            The difference in time between the 'fuzzy' figure represented by the current instance
            and the actual intended point in time.
        '''

        if reference_date is None:
            reference_date = datetime.utcnow()

        # Determine the actual point in time represented by the source data and the reference date
        actual_date = reference_date - relativedelta(
            years=self._source_years,
            months=self._source_months,
            days=self._source_days,
            hours=self._source_hours,
        )

        # Determine the point in time represented by the computed date and the reference date
        computed_date = reference_date - relativedelta(hours=self.total_hours)

        # Return the difference between these two figures
        return actual_date - computed_date

    def get_dimension_value(self):
        return str(self.total_hours_rounded)


# TODO(vedant,stephen,ian): Determine if we need to redefine this in terms of days
MAX_AGE = FuzzyAge(years=150)
