#!/usr/bin/env python

import re
import sys

from passlib.context import CryptContext
from sqlalchemy import create_engine
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm.session import sessionmaker
from pylib.base.flags import Flags

# TODO: Verify this import after, because crashing when we try the create user.
# from data.alerts.credentials import get_credentials
from log import LOG
from models.alchemy.user import User, UserRoles, UserStatusEnum

# I have to import this model since it is referenced by the `User` model
# pylint:disable=W0611
from models.alchemy.security_group import GroupUsers
from models.alchemy.permission import Role
from models.alchemy.dashboard import Dashboard
from util.credentials.generate import generate_secure_password
from util.credentials.provider import CredentialProvider
from web.server.data.data_access import Transaction
from web.server.configuration.instance import load_instance_configuration_from_file

PASSWORD_ENCRYPTION_SCHEME = ['bcrypt']
PERMISSIVE_EMAIL_REGEX = re.compile(r'[^@]+@[^@]+\.[^@]+')
AUTOMATION_USERNAME = 'automation@zenysis.com'
AUTOMATION_FIRST_NAME = 'Automation'
AUTOMATION_LAST_NAME = 'Account'


def get_user_string(user):
    return ('%s - (%s, %s)') % (user.username, user.first_name, user.last_name)


def is_email_address(username):
    return PERMISSIVE_EMAIL_REGEX.match(username) != None


def hash_password(password):
    # BCrypt has a built-in salt
    # https://stackoverflow.com/questions/6832445/how-can-bcrypt-have-built-in-salts
    crypt_context = CryptContext(schemes=PASSWORD_ENCRYPTION_SCHEME)
    return crypt_context.encrypt(password)


def create_user(
    transaction,
    username,
    first_name,
    last_name,
    plaintext_password=None,
    is_site_admin=False,
    overwrite_user=False,
    status=UserStatusEnum.ACTIVE,
):
    if not plaintext_password:
        plaintext_password = generate_secure_password()

    hashed_password = hash_password(plaintext_password)

    existing_user = transaction.find_one_by_fields(User, False, {'username': username})

    if existing_user and overwrite_user:
        LOG.info('User \'%s\' already exists but will be overwritten.', username)
    elif existing_user:
        message = (
            'User with username \'%s\' already exists. Specify \'-o\' to ovewrite.'
            % username
        )
        LOG.error(message)
        raise ValueError(message)

    if existing_user:
        if first_name:
            existing_user.first_name = first_name

        if last_name:
            existing_user.last_name = last_name

        existing_user.username = username
        existing_user.password = hashed_password
        existing_user.status_id = status.value
    else:
        existing_user = User(
            first_name=first_name,
            last_name=last_name,
            username=username,
            password=hashed_password,
            status_id=status.value,
        )

    new_user = transaction.add_or_update(existing_user, flush=True)

    if is_site_admin:
        site_admin_role = transaction.find_one_by_fields(Role, False, {'name': 'admin'})

        if not site_admin_role:
            message = (
                'Unable to find the site administrator role. It may have been deleted. '
                'Contact an Engineer for assistance. '
            )
            LOG.info(message)
            raise ValueError(message)

        user_role = transaction.find_one_by_fields(
            UserRoles, True, {'user_id': new_user.id, 'role_id': site_admin_role.id}
        )

        if user_role:
            LOG.info(
                '\'%s\' is already a site-administrator. ', get_user_string(new_user)
            )
        else:
            site_admin_user_role = UserRoles(
                user_id=new_user.id, role_id=site_admin_role.id
            )
            transaction.add_or_update(site_admin_user_role, flush=True)
            LOG.info(
                'Marked \'%s\' as a site-administrator. ', get_user_string(new_user)
            )
    return (new_user, plaintext_password)


def main():
    Flags.PARSER.add_argument(
        '-d',
        '--sql_connection_string',
        type=str,
        required=False,
        help='The SQL Connection String to use to connect to the SQL '
        'Database. Can also be specified via the \'DATABASE_URL\' '
        'environment variable. The inline parameter takes priority'
        'over the environment variable.',
    )
    Flags.PARSER.add_argument(
        '-u',
        '--username',
        type=str,
        required=False,
        help='The username of the user. MUST be a Zenysis e-mail address.',
    )
    Flags.PARSER.add_argument(
        '-f', '--first_name', type=str, required=False, help='The user\'s first name.'
    )
    Flags.PARSER.add_argument(
        '-l', '--last_name', type=str, required=False, help='The user\'s last name. '
    )
    Flags.PARSER.add_argument(
        '-p',
        '--password',
        type=str,
        required=False,
        help='The user\'s password. If none specified, this will be '
        'auto-generated. ',
    )
    Flags.PARSER.add_argument(
        '-s',
        '--status',
        type=str,
        action='store',
        required=False,
        choices=[e.name for e in UserStatusEnum],
        default=UserStatusEnum.ACTIVE.name,
        help=(
            'The type of SSL configuration to use. '
            '1. ACTIVE - The will be able to login immediately. '
            '2. INACTIVE - The user will not be able to login unless an '
            'Administrator logs in and marks the user as active. '
            '3. PENDING - The user will not be able to login unless an '
            'Administrator logs in and sends the user an invite email. '
        ),
    )
    Flags.PARSER.add_argument(
        '-a',
        '--site_admin',
        action='store_true',
        required=False,
        default=False,
        help='If specified, make user an admin.',
    )
    Flags.PARSER.add_argument(
        '-o',
        '--overwrite',
        action='store_true',
        required=False,
        default=False,
        help='Overwrite the user if the specified username already exists.',
    )
    Flags.PARSER.add_argument(
        '-A',
        '--automation_user',
        action='store_true',
        required=False,
        default=False,
        help='Make a new automation user.',
    )
    Flags.InitArgs()
    sql_connection_string = Flags.ARGS.sql_connection_string
    if not sql_connection_string:
        instance_configuration = load_instance_configuration_from_file()
        with CredentialProvider(instance_configuration) as credential_provider:
            sql_connection_string = credential_provider.get('SQLALCHEMY_DATABASE_URI')
    username = Flags.ARGS.username
    first_name = Flags.ARGS.first_name or None
    last_name = Flags.ARGS.last_name or None
    plaintext_password = Flags.ARGS.password
    is_site_admin = Flags.ARGS.site_admin
    # pylint: disable=E1136
    # The types defined in Flags match exactly those defined in the Enum
    # there will not be a key error
    status = UserStatusEnum[Flags.ARGS.status]
    overwrite_user = Flags.ARGS.overwrite
    automation_user = Flags.ARGS.automation_user

    if automation_user:
        username = AUTOMATION_USERNAME
        first_name = AUTOMATION_FIRST_NAME
        last_name = AUTOMATION_LAST_NAME
        _, plaintext_password = get_credentials()
        is_site_admin = True

    if not username:
        LOG.error(
            'You must provide a username if you are not creating a automation user.'
        )
        return 5

    if not overwrite_user and (not first_name or not last_name):
        LOG.error(
            'You must provide a first and last name if you are creating a new user.'
        )
        return 2

    username = username.strip()
    first_name = first_name.strip() if first_name else None
    last_name = last_name.strip() if last_name else None

    if not is_email_address(username):
        LOG.error(
            'Username \'%s\' is not valid. It must be an e-mail address.', username
        )
        return 3

    Session = sessionmaker()
    engine = create_engine(sql_connection_string)
    Session.configure(bind=engine)
    session = Session()

    with Transaction(should_commit=None, get_session=lambda: session) as transaction:
        (new_user, plaintext_password) = create_user(
            transaction,
            username,
            first_name,
            last_name,
            plaintext_password,
            is_site_admin,
            overwrite_user,
            status,
        )
        LOG.info(
            'Successfully created/updated User \'%s\' with status \'%s\' and password \'%s\'.',
            get_user_string(new_user),
            status.name,
            plaintext_password,
        )

    return 0


if __name__ == '__main__':
    sys.exit(main())
