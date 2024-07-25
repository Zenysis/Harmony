from enum import Enum
import sqlalchemy as sa
from sqlalchemy.ext.declarative import declarative_base

from log import LOG
from . import get_session
from web.server.data.data_access import Transaction

Base = declarative_base()


class PendingUser(Base):
    __tablename__ = 'pending_user'

    id = sa.Column(sa.Integer, primary_key=True)
    username = sa.Column(sa.String(50), nullable=False, unique=True)
    first_name = sa.Column(sa.String(100), nullable=False, server_default='')
    last_name = sa.Column(sa.String(100), nullable=False, server_default='')
    invite_token = sa.Column(sa.String(100), nullable=False, server_default='')


class User(Base):
    __tablename__ = 'user'

    id = sa.Column(sa.Integer, primary_key=True)
    username = sa.Column(sa.String(50), nullable=False, unique=True)
    password = sa.Column(sa.String(255), nullable=False, server_default='')
    reset_password_token = sa.Column(sa.String(100), nullable=False, server_default='')
    first_name = sa.Column(sa.String(100), nullable=False, server_default='')
    last_name = sa.Column(sa.String(100), nullable=False, server_default='')
    active = sa.Column('is_active', sa.Boolean(), nullable=False, server_default='0')
    status_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('user_status.id', ondelete='RESTRICT', name='valid_status'),
        nullable=False,
    )


class UserStatus(Base):
    __tablename__ = 'user_status'

    id = sa.Column(sa.Integer, primary_key=True)
    status = sa.Column(sa.String(50), nullable=False, unique=True)


class UserStatusEnum(Enum):
    ACTIVE = 1
    INACTIVE = 2
    PENDING = 3


def upvert_data(alembic_operation):
    with Transaction(get_session=lambda: get_session(alembic_operation)) as transaction:
        populate_user_status(transaction)
        convert_current_users(transaction)
        convert_pending_users(transaction)


def downvert_data(alembic_operation):
    with Transaction(get_session=lambda: get_session(alembic_operation)) as transaction:
        revert_current_users(transaction)
        revert_pending_users(transaction)


def populate_user_status(transaction):
    LOG.info('Prepopulating database with user statuses')
    for user_status in UserStatusEnum:
        entity = UserStatus(id=user_status.value, status=user_status.name)
        transaction.add_or_update(entity)
    LOG.info('Successfully populated user statuses.')


def convert_pending_users(transaction):
    LOG.info('Migrating pending users.')
    for pending_user in transaction.find_all_by_fields(PendingUser, {}):
        user = User(
            first_name=pending_user.first_name,
            last_name=pending_user.last_name,
            reset_password_token=pending_user.invite_token,
            username=pending_user.username,
            status_id=UserStatusEnum.PENDING.value,
        )
        transaction.add_or_update(user)
    LOG.info('Successfully migrated pending users.')


def convert_current_users(transaction):
    LOG.info('Migrating current users.')
    for user in transaction.find_all_by_fields(User, {}):
        user.status_id = (
            UserStatusEnum.ACTIVE.value
            if user.active
            else UserStatusEnum.INACTIVE.value
        )
        transaction.add_or_update(user)
    LOG.info('Successfully migrated current users.')


def revert_pending_users(transaction):
    LOG.info('Reverting pending users.')
    for user in transaction.find_all_by_fields(
        User, {'status_id': UserStatusEnum.PENDING.value}
    ):
        pending_user = PendingUser(
            first_name=user.first_name,
            last_name=user.last_name,
            invite_token=user.reset_password_token,
            username=user.username,
        )
        transaction.add_or_update(pending_user)
        transaction.delete(user)
    LOG.info('Successfully reverted pending users.')


def revert_current_users(transaction):
    LOG.info('Migrating current users.')
    for user in transaction.find_all_by_fields(User, {}):
        user.active = True if user.status_id == UserStatusEnum.ACTIVE.value else False
        transaction.add_or_update(user)
    LOG.info('Successfully migrated current users.')
