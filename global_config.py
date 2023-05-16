import os

# Flask
# We use Flask as our main Python back end that serves up everything. The secret key
# is needed to keep the client-side sessions secure. You can generate
# a random key and set it here.
DEFAULT_SECRET_KEY = 'abc123'

# Mailgun settings
# Mailgun is the email API we use. You can sign up here: https://signup.mailgun.com/new/signup
# Other mail APIs can work as well, such as Twilio
MAILGUN_API_KEY = 'key-xxx'
MAILGUN_NAME = 'mg.hostname.com'
MAILGUN_SENDER = 'noreply@mg.hostname.com'

# URL of your Druid instance
# Druid is a real time analytics data base. We use it to store all of our
# analytical data (i.e. data that can be queried in AQT).
DRUID_HOST = os.getenv('DRUID_HOST')

# Phabricator settings
# We use Passphrase to store credentials. Any other credential manager can
# be used instead by substituting all Passphrase usages with another service.
PASSPHRASE_ENDPOINT = 'https://phab.hostname.com/api/passphrase.query'

# Mail
# These are the emails for newly generated alert notifications for a list of recipients
NOREPLY_EMAIL = 'noreply@mg.hostname.com'
SUPPORT_EMAIL = 'support@hostname.com'
RENDERBOT_EMAIL = 'render_bot@hostname.com'

DATA_UPLOAD_DEFAULT_NOTIFY = ['foo@hostname.com', 'bar@hostname.com']

# In order to read and write from google sheet you will need proper authorization.
# https://developers.google.com/identity/protocols/oauth2
GOOGLE_SERVICE_SECRET_CREDENTIAL = ''

# Postgres stores all users, dashboards, etc.
POSTGRES_DB_URI = os.getenv('DATABASE_URL')

# in-memory key-value store (used by web to persist things like
# access keys across worker threads)
REDIS_HOST = 'redis'

# Hasura host
HASURA_HOST = 'http://hasura:8080'
