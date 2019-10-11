# Wrapper around ethiopian_date python library to fix its bugs.
from builtins import object
from ethiopian_date import ethiopian_date

# The original ethiopian_date library attempts to output python datetime
# objects for all methods it provides. This is a problem, since the Ethiopian
# calendar has 13 months while the python datetime library will only allow 12
# months. Additionally, February will have 30 days in the Ethiopian calendar
# which is not allowed in the python datetime library.
class DummyDatetime(object):
    # When datetime.date is called, just return the arguments tuple instead of
    # converting to a python datetime object.
    @staticmethod
    def date(*args):
        return args


# Replace the datetime module used in ethiopian_date with our patched version.
ethiopian_date.datetime = DummyDatetime

# Expose the original library's EthiopianDateConverter
EthiopianDateConverter = ethiopian_date.EthiopianDateConverter
