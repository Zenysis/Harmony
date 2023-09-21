# Simple currency converter that uses fixer.io for free conversion. This API
# requires that the minimum conversion date is 2000, since it uses the EU feed
# to provide conversion rates
import datetime

import requests

from retry import retry

# Use fixer.io for free currency conversion
_BASE_URL = 'http://api.fixer.io'

# Create a shared request session that provides connection pooling
_SESSION = requests.Session()

# Configure the connection pool settings for connections made to the
# currency conversion query endpoint
_ADAPTER = requests.adapters.HTTPAdapter(pool_connections=100, pool_maxsize=100)
_SESSION.mount(_BASE_URL, _ADAPTER)


class CurrencyConverter:
    MIN_DATE = datetime.date(2000, 1, 1)

    # Date format needed by the conversion API
    _DATE_FORMAT = '%Y-%m-%d'

    # Mapping from conversion URL to rate
    _MEMOIZED_CONVERSION_RATES = {}

    # TODO: Be smarter about rate limiting within this utility or find
    # a better way to perform currency conversion for historical dates.
    @classmethod
    @retry(
        exceptions=(requests.ConnectionError), delay=1, backoff=2, max_delay=3, tries=3
    )
    def convert(cls, value, input_currency, output_currency, historical_date=None):
        # TODO: Validate that the currency arguments are in the right
        # format and are valid
        if input_currency == output_currency or not value:
            return value

        dt = historical_date or datetime.date.today()
        if dt < cls.MIN_DATE:
            raise ValueError(
                f'Request date must be after {cls.MIN_DATE}. Date requested: {dt}'
            )

        date_str = dt.strftime(cls._DATE_FORMAT)
        url = f'{_BASE_URL}/{date_str}?base={input_currency}&symbols={output_currency}'

        # If the conversion factor has not been fetched before, issue a new
        # request and store the conversion factor for this currency pair + date
        if url not in cls._MEMOIZED_CONVERSION_RATES:
            r = _SESSION.get(url)
            result = r.json()
            if result.get('error') == 'Rate limit exceeded':
                raise requests.ConnectionError('Rate limit exceeded')
            cls._MEMOIZED_CONVERSION_RATES[url] = result['rates'][output_currency]

        conversion_factor = cls._MEMOIZED_CONVERSION_RATES[url]
        return value * conversion_factor
