from typing import TYPE_CHECKING
import sqlalchemy as sa
from sqlalchemy.orm import relationship, backref

from models.alchemy.base import Base


if TYPE_CHECKING:
    from models.alchemy.permission import Role, Resource, ResourceRole
    from models.alchemy.user import User

# Disable this rule because we actually want to use the id
# column to represent a unique way of identifying a database
# model.
# pylint:disable=C0103

# Pylint fails to pick up the Integer/Column/ForeignKey/relationship
# attributes that denote columns in a SQLAlchemy field.
# pylint:disable=E1101


class Group(Base):
    '''A class that contains multiple `User`s and multiple `Role`s.
    '''

    __tablename__ = 'security_group'

    id = sa.Column(sa.Integer, primary_key=True)

    # User authentication information
    name = sa.Column(sa.String(50), nullable=False, unique=True)

    # Relationships
    roles = relationship(
        'Role',
        secondary='security_group_roles',
        backref=backref('groups', lazy='dynamic'),
        viewonly=False,
    )
    acls = relationship('GroupAcl', cascade="delete", viewonly=False)


class GroupRoles(Base):
    '''A class that represents a mapping between a `Role`, `Group` and `Resource`.
    '''

    __tablename__ = 'security_group_roles'

    id = sa.Column(sa.Integer(), primary_key=True)
    group_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            'security_group.id', ondelete='CASCADE', name='valid_security_group'
        ),
        nullable=False,
    )
    role_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('role.id', ondelete='CASCADE', name='valid_role'),
        nullable=False,
    )
    group = relationship('Group', viewonly=True)
    role = relationship('Role', viewonly=True)


class GroupAcl(Base):
    '''A class that represents a mapping between a `Group`, `Permission`, and
    `Resource`
    '''

    __tablename__ = 'security_group_acl'

    id = sa.Column(sa.Integer(), primary_key=True)
    group_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            'security_group.id', ondelete='CASCADE', name='valid_security_group'
        ),
        nullable=False,
    )
    resource_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('resource.id', ondelete='CASCADE', name='valid_resource'),
        nullable=True,
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
    group = relationship('Group', viewonly=True)


class GroupUsers(Base):
    '''A class that represents a mapping between a `User` and a `Group`.
    '''

    __tablename__ = 'security_group_users'

    id = sa.Column(sa.Integer(), primary_key=True)
    group_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            'security_group.id', ondelete='CASCADE', name='valid_security_group'
        ),
        nullable=False,
    )
    user_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('user.id', ondelete='CASCADE', name='valid_user'),
        nullable=False,
    )

    group = relationship('Group', viewonly=False)
    user = relationship('User', viewonly=False)
