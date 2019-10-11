from builtins import str
from past.builtins import basestring
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session

import sqlalchemy as sa

from log import LOG

Base = declarative_base()


class Role(Base):
    __tablename__ = 'role'

    id = sa.Column(sa.Integer(), primary_key=True)
    name = sa.Column(sa.String(50), nullable=False, server_default=u'', unique=True)
    label = sa.Column(sa.Unicode(255), server_default=u'')  # for display purposes
    resource_type_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            'resource_type.id', ondelete='CASCADE', name='valid_resource_type'
        ),
    )


# NOTE(vedant): This class was renamed from `Permission`.
# The rationale for this change was to ensure that we have consistent naming
# and to follow the pattern defined in `User`, `Role` and `UserRoles`.
# `RolePerimssions` reprsents a mapping between `Role` and `Permission`
class RolePermissions(Base):
    '''Represents a mapping between a `Role` and a `Permission`.
    '''

    __tablename__ = 'role_permissions'

    id = sa.Column(sa.Integer(), primary_key=True)
    role_id = sa.Column(
        sa.Integer(), sa.ForeignKey('role.id', ondelete='CASCADE'), nullable=False
    )
    permission_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            'permission.id', ondelete='CASCADE', name='valid_permission_definition'
        ),
        nullable=False,
    )


# NOTE(vedant): This class was renamed from `PermissionDefinition`.
# The word `Definition` seemed unnecessarily verbose and was only included
# because we had a `Permission` class that has since been renamed.
class Permission(Base):
    '''Defines a permission for a given resource type
    '''

    __tablename__ = 'permission'

    id = sa.Column(sa.Integer(), primary_key=True)

    resource_type_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('resource_type.id', name='valid_resource_type'),
        nullable=False,
    )
    permission = sa.Column(sa.String(100), nullable=False)


class ResourceType(Base):
    '''A classification for discrete resources on the site
    '''

    __tablename__ = 'resource_type'

    id = sa.Column(sa.Integer(), primary_key=True)
    name = sa.Column(sa.String(100), nullable=False)


SITE_ADMIN_ROLE_ID = 1
DASHBOARD_VIEWER_ROLE_ID = 2
DASHBOARD_EDITOR_ROLE_ID = 3
DASHBOARD_ADMIN_ROLE_ID = 4
DIRECTORY_READER_ROLE_ID = 5
QUERY_RUNNER_ROLE_ID = 6

SITE_TYPE_ID = 1
DASHBOARD_TYPE_ID = 2
USER_TYPE_ID = 3
ROLE_TYPE_ID = 4

SITE_RESOURCE_ID = 1

VIEW_USERS_SITE_PERM_ID = 1
INVITE_USERS_SITE_PERM_ID = 2
EDIT_USERS_SITE_PERM_ID = 3
DELETE_USERS_SITE_PERM_ID = 4
RESET_PASSWORD_PERM_ID = 5
LIST_USERS_SITE_PERM_ID = 6
LIST_ROLES_SITE_PERM_ID = 7
LIST_RESOURCES_SITE_PERM_ID = 8
VIEW_ADMIN_PAGE_SITE_PERM_ID = 9
RUN_QUERY_SITE_PERM_ID = 15

VIEW_DASHBOARD_PERM_ID = 10
EDIT_DASHBOARD_PERM_ID = 11
UPDATE_DASHBOARD_USERS_PERM_ID = 12
DELETE_DASHBOARD_PERM_ID = 13
CREATE_DASHBOARD_PERM_ID = 14

DEFAULT_ROLES = [
    {
        'id': SITE_ADMIN_ROLE_ID,
        'label': 'Site Administrator',
        'name': 'admin',
        'resource_type_id': SITE_TYPE_ID,
    },
    {
        'id': DASHBOARD_VIEWER_ROLE_ID,
        'label': 'Dashboard Viewer',
        'name': 'dashboard_viewer',
        'resource_type_id': DASHBOARD_TYPE_ID,
    },
    {
        'id': DASHBOARD_EDITOR_ROLE_ID,
        'label': 'Dashboard Editor',
        'name': 'dashboard_editor',
        'resource_type_id': DASHBOARD_TYPE_ID,
    },
    {
        'id': DASHBOARD_ADMIN_ROLE_ID,
        'label': 'Dashboard Administrator',
        'name': 'dashboard_admin',
        'resource_type_id': DASHBOARD_TYPE_ID,
    },
    {
        'id': DIRECTORY_READER_ROLE_ID,
        'label': 'Directory Reader',
        'name': 'directory_reader',
        'resource_type_id': SITE_TYPE_ID,
    },
    {
        'id': QUERY_RUNNER_ROLE_ID,
        'label': 'Query Runner',
        'name': 'query_runner',
        'resource_type_id': SITE_TYPE_ID,
    },
]

DEFAULT_RESOURCE_TYPES = [
    {'id': SITE_TYPE_ID, 'name': 'site'},
    {'id': DASHBOARD_TYPE_ID, 'name': 'dashboard'},
    {'id': USER_TYPE_ID, 'name': 'user'},
    {'id': ROLE_TYPE_ID, 'name': 'role'},
]

DEFAULT_RESOURCES = [
    {
        'id': SITE_RESOURCE_ID,
        'resource_type_id': SITE_TYPE_ID,
        'name': '/',
        'label': 'Website',
    }
]

DEFAULT_PERMISSIONS = [
    # Site Permissions
    # pylint:disable=C0301
    {
        'id': VIEW_USERS_SITE_PERM_ID,
        'resource_type_id': SITE_TYPE_ID,
        'permission': 'view_user',
    },
    {
        'id': EDIT_USERS_SITE_PERM_ID,
        'resource_type_id': SITE_TYPE_ID,
        'permission': 'edit_user',
    },
    {
        'id': INVITE_USERS_SITE_PERM_ID,
        'resource_type_id': SITE_TYPE_ID,
        'permission': 'invite_user',
    },
    {
        'id': DELETE_USERS_SITE_PERM_ID,
        'resource_type_id': SITE_TYPE_ID,
        'permission': 'delete_user',
    },
    {
        'id': LIST_USERS_SITE_PERM_ID,
        'resource_type_id': SITE_TYPE_ID,
        'permission': 'list_users',
    },
    {
        'id': LIST_ROLES_SITE_PERM_ID,
        'resource_type_id': SITE_TYPE_ID,
        'permission': 'list_roles',
    },
    {
        'id': LIST_RESOURCES_SITE_PERM_ID,
        'resource_type_id': SITE_TYPE_ID,
        'permission': 'list_resources',
    },
    {
        'id': VIEW_ADMIN_PAGE_SITE_PERM_ID,
        'resource_type_id': SITE_TYPE_ID,
        'permission': 'view_admin_page',
    },
    {
        'id': RESET_PASSWORD_PERM_ID,
        'resource_type_id': SITE_TYPE_ID,
        'permission': 'reset_password',
    },
    {
        'id': RUN_QUERY_SITE_PERM_ID,
        'resource_type_id': SITE_TYPE_ID,
        'permission': 'run_query',
    },
    # Dashboard Permissions
    {
        'id': VIEW_DASHBOARD_PERM_ID,
        'resource_type_id': DASHBOARD_TYPE_ID,
        'permission': 'view_resource',
    },
    {
        'id': EDIT_DASHBOARD_PERM_ID,
        'resource_type_id': DASHBOARD_TYPE_ID,
        'permission': 'edit_resource',
    },
    {
        'id': UPDATE_DASHBOARD_USERS_PERM_ID,
        'resource_type_id': DASHBOARD_TYPE_ID,
        'permission': 'update_users',
    },
    {
        'id': DELETE_DASHBOARD_PERM_ID,
        'resource_type_id': DASHBOARD_TYPE_ID,
        'permission': 'delete_resource',
    },
    {
        'id': CREATE_DASHBOARD_PERM_ID,
        'resource_type_id': DASHBOARD_TYPE_ID,
        'permission': 'create_resource',
    },
]

DEFAULT_ROLE_PERMISSIONS = [
    # Dashboard Administrator
    {
        'id': 1,
        'role_id': DASHBOARD_ADMIN_ROLE_ID,
        'permission_id': VIEW_DASHBOARD_PERM_ID,
    },
    {
        'id': 2,
        'role_id': DASHBOARD_ADMIN_ROLE_ID,
        'permission_id': EDIT_DASHBOARD_PERM_ID,
    },
    {
        'id': 3,
        'role_id': DASHBOARD_ADMIN_ROLE_ID,
        'permission_id': UPDATE_DASHBOARD_USERS_PERM_ID,
    },
    {
        'id': 4,
        'role_id': DASHBOARD_ADMIN_ROLE_ID,
        'permission_id': DELETE_DASHBOARD_PERM_ID,
    },
    {
        'id': 5,
        'role_id': DASHBOARD_ADMIN_ROLE_ID,
        'permission_id': CREATE_DASHBOARD_PERM_ID,
    },
    # Dashboard Editor
    {
        'id': 6,
        'role_id': DASHBOARD_EDITOR_ROLE_ID,
        'permission_id': VIEW_DASHBOARD_PERM_ID,
    },
    {
        'id': 7,
        'role_id': DASHBOARD_EDITOR_ROLE_ID,
        'permission_id': EDIT_DASHBOARD_PERM_ID,
    },
    # Dashboard Viewer
    {
        'id': 8,
        'role_id': DASHBOARD_VIEWER_ROLE_ID,
        'permission_id': VIEW_DASHBOARD_PERM_ID,
    },
    # Directory Reader
    {
        'id': 9,
        'role_id': DIRECTORY_READER_ROLE_ID,
        'permission_id': LIST_USERS_SITE_PERM_ID,
    },
    {
        'id': 10,
        'role_id': DIRECTORY_READER_ROLE_ID,
        'permission_id': LIST_RESOURCES_SITE_PERM_ID,
    },
    {
        'id': 11,
        'role_id': DIRECTORY_READER_ROLE_ID,
        'permission_id': LIST_ROLES_SITE_PERM_ID,
    },
    # Query Runner
    {
        'id': 12,
        'role_id': QUERY_RUNNER_ROLE_ID,
        'permission_id': RUN_QUERY_SITE_PERM_ID,
    },
]


def add_or_update(session, model_class, entities):

    for entity in entities:
        unicode_entity = convert_strings_to_unicode(entity)
        entity = session.query(model_class).filter_by(id=unicode_entity['id']).first()
        if entity:
            for key, value in list(unicode_entity.items()):
                if hasattr(entity, key):
                    setattr(entity, key, value)
        else:
            entity = model_class(**unicode_entity)
        session.add(entity)


def convert_strings_to_unicode(entity):
    new_entity = dict(entity)
    for key in list(new_entity.keys()):
        if isinstance(new_entity[key], basestring):
            new_entity[key] = str(new_entity[key])
    return new_entity


def add_default_roles(session):
    LOG.debug('Prepopulating default roles')
    add_or_update(session, Role, DEFAULT_ROLES)


def add_default_resource_types(session):
    LOG.debug('Prepopulating default resource types')
    add_or_update(session, ResourceType, DEFAULT_RESOURCE_TYPES)


def add_default_permission_types(session):
    LOG.debug('Prepopulating default permission definitions')
    add_or_update(session, Permission, DEFAULT_PERMISSIONS)


def add_default_role_permissions(session):
    LOG.debug('Prepopulating default role permissions')
    add_or_update(session, RolePermissions, DEFAULT_ROLE_PERMISSIONS)


def prepopulate_data(alembic_operation):
    bind = alembic_operation.get_bind()
    session = Session(bind=bind)

    LOG.info('Prepopulating database with default information')
    add_default_resource_types(session)
    add_default_permission_types(session)
    add_default_roles(session)
    add_default_role_permissions(session)
    session.commit()
    LOG.info('Successfully prepopulated data.')
