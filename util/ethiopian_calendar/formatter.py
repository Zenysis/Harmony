from util.ethiopian_calendar.converter import EthiopianDateConverter

SHORT_MONTH = [
    'Mes',
    'Tik',
    'Hid',
    'Tah',
    'Tir',
    'Yek',
    'Meg',
    'Mia',
    'Gin',
    'Sen',
    'Ham',
    'Neh',
    'Pag',
]

FULL_MONTH = [
    'Meskerem',
    'Tikimt',
    'Hidar',
    'Tahisas',
    'Tire',
    'Yekatit',
    'Megabit',
    'Miyaziya',
    'Ginbot',
    'Sene',
    'Hamle',
    'Nehase',
    'Pagume',
]

# Convert an Ethiopian date into a user readable string
def format_et_date(et_year, et_month, et_day, short=False):
    month_list = SHORT_MONTH if short else FULL_MONTH
    month_str = month_list[et_month - 1]
    return '%s %s %s' % (et_day, month_str, et_year)


# Convert a gregorian date into an Ethiopian date string
def format_gregorian_date(year, month, day, short=False):
    (et_year, et_month, et_day) = EthiopianDateConverter.to_ethiopian(year, month, day)
    return format_et_date(et_year, et_month, et_day, short)


# Convert a python datetime object into an Ethiopian date string
def format_date(input_date, short=False):
    return format_gregorian_date(
        input_date.year, input_date.month, input_date.day, short
    )
