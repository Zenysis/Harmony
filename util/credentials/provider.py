import os
from contextlib import contextmanager

CREDENTIALS = {
    "SQLALCHEMY_DATABASE_URI": os.getenv("DATABASE_URL", "postgresql:///zenysis"),
    "MAILGUN_API_KEY": "",
}


@contextmanager
def CredentialProvider(instance_configuration):
    print(f"going to yield {CREDENTIALS}")
    print(f'os.getenv("DATABASE_URL") = {os.getenv("DATABASE_URL")}')
    yield CREDENTIALS
