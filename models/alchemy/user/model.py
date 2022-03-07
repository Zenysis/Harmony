from typing import TYPE_CHECKING
from builtins import str
from builtins import object
from enum import Enum

import sqlalchemy as sa
from sqlalchemy.orm import relationship, backref
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.mutable import MutableDict

from models.alchemy.base import Base
from models.alchemy.permission import Role


if TYPE_CHECKING:
    from models.alchemy.dashboard import Dashboard
    from models.alchemy.permission import Resource, ResourceRole
    from models.alchemy.security_group import Group


class UserStatusEnum(Enum):
    '''An enumeration of possible statuses that a user can be associated with.'''

    # Indicates that the user has registered for an account on the site and is able to sign in.
    ACTIVE = 1

    # Indicates that the user has registered for an account on the site but has been prevented
    # from signing in.
    INACTIVE = 2

    # Indicates that a user has been invited to register for an account on the site but has not
    # signed in.
    PENDING = 3


# HACK(stephen): This is the default implementation of flask_user.UserMixin. It
# is being included directly here so that the user models do not have a direct
# dependency to flask_user and require the package to be installed. Right now,
# models can be used in the pipeline because there are no APIs to manage this
# data through.
class UserMixin(object):
    '''
    This provides default implementations for the methods that Flask-Login
    expects user objects to have.
    '''

    # NOTE(stephen): This method is overriden from the default.
    @property
    def is_active(self):
        if hasattr(self, 'active'):
            return self.active
        elif hasattr(self, 'status_id'):
            is_active = self.status_id == UserStatusEnum.ACTIVE.value
            return is_active
        else:
            return self.is_enabled

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False

    def get_id(self):
        try:
            # NOTE(stephen): Originally a `text_type` reference that supports
            # python 2/3 compatibility.
            return str(self.id)
        except AttributeError:
            raise NotImplementedError('No `id` attribute - override `get_id`')

    def __eq__(self, other):
        '''
        Checks the equality of two `UserMixin` objects using `get_id`.
        '''
        if isinstance(other, UserMixin):
            return self.get_id() == other.get_id()
        return NotImplemented

    def __ne__(self, other):
        '''
        Checks the inequality of two `UserMixin` objects using `get_id`.
        '''
        equal = self.__eq__(other)
        if equal is NotImplemented:
            return NotImplemented
        return not equal


# Disable this rule because we actually want to use the id
# column to represent a unique way of identifying a database
# model.
# pylint:disable=C0103

# Pylint fails to pick up the Integer/Column/ForeignKey/relationship
# attributes that denote columns in a SQLAlchemy field.
# pylint:disable=E1101
class User(Base, UserMixin):
    '''A class that represents an individual user on the site.'''

    __tablename__ = 'user'

    id = sa.Column(sa.Integer, primary_key=True)

    # User authentication information
    username = sa.Column(sa.String(50), nullable=False, unique=True)
    password = sa.Column(sa.String(255), nullable=False, server_default='')
    reset_password_token = sa.Column(sa.String(100), nullable=False, server_default='')

    # User information
    first_name = sa.Column(sa.String(100), nullable=False, server_default='')
    last_name = sa.Column(sa.String(100), nullable=False, server_default='')
    phone_number = sa.Column(sa.String(50), nullable=False, server_default='')
    status_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('user_status.id', ondelete='RESTRICT', name='valid_status'),
        nullable=False,
    )

    # Relationships
    dashboards = relationship('Dashboard', viewonly=True)
    roles = relationship(
        'Role',
        secondary='user_roles',
        backref=backref('users', lazy='dynamic'),
        viewonly=False,
    )
    acls = relationship('UserAcl', cascade="delete", viewonly=True)
    groups = relationship(
        'Group',
        secondary='security_group_users',
        backref=backref('users', lazy='dynamic'),
        viewonly=False,
    )
    status = relationship('UserStatus', viewonly=True)
    created = sa.Column(
        sa.DateTime(), nullable=True, default=sa.func.current_timestamp()
    )

    def is_superuser(self):
        admin_role = Role.query.filter(Role.name == 'admin').first()
        if admin_role:
            return any(r.id == admin_role.id for r in self.get_all_roles())
        return False

    def get_all_roles(self):
        group_roles = [role for group in self.groups for role in group.roles]
        return self.roles + group_roles

    # pylint: disable=E0309
    def __hash__(self) -> int:
        return self.id


class UserRoles(Base):
    '''A class that represents a mapping between a `User` and a `Role`.'''

    __tablename__ = 'user_roles'

    id = sa.Column(sa.Integer(), primary_key=True)
    user_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('user.id', ondelete='CASCADE', name='valid_user'),
        nullable=False,
    )
    role_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('role.id', ondelete='CASCADE', name='valid_role'),
        nullable=False,
    )
    role = relationship('Role', viewonly=False)
    user = relationship('User', viewonly=False)


class UserAcl(Base):
    '''A class that represents a mapping between a `User`, `Resource`, and
    `ResourceRole`
    '''

    __tablename__ = 'user_acl'

    id = sa.Column(sa.Integer(), primary_key=True)
    user_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('user.id', ondelete='CASCADE', name='valid_user'),
        nullable=False,
    )
    resource_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('resource.id', ondelete='CASCADE', name='valid_resource'),
        nullable=False,
    )
    resource_role_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            'resource_role.id', ondelete='CASCADE', name='valid_resource_role'
        ),
        nullable=False,
    )

    resource = relationship('Resource', viewonly=True)
    resource_role = relationship('ResourceRole', viewonly=True)
    user = relationship('User', viewonly=True)


class UserStatus(Base):
    __tablename__ = 'user_status'

    id = sa.Column(sa.Integer, primary_key=True)
    status = sa.Column(
        sa.Enum(UserStatusEnum, name='user_status_enum'), nullable=False, unique=True
    )


class UserPreferences(Base):
    __tablename__ = 'user_preferences'

    id = sa.Column(sa.Integer, primary_key=True)

    user_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('user.id', ondelete='CASCADE', name='valid_user'),
        nullable=False,
    )

    preferences = sa.Column(MutableDict.as_mutable(JSONB()), nullable=False)


USER_STATUSES = [e.name.lower() for e in UserStatusEnum]
