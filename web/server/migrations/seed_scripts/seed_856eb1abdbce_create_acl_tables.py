import sqlalchemy as sa
from sqlalchemy.ext.declarative import declarative_base

from web.server.data.data_access import Transaction

from . import get_session

# pylint:disable=C0103
Base = declarative_base()


class Role(Base):
    __tablename__ = 'role'
    # pylint:disable=C0103
    id = sa.Column(sa.Integer(), primary_key=True)
    name = sa.Column(sa.String(50), nullable=False, server_default=u'', unique=True)
    # for display purposes
    label = sa.Column(sa.Unicode(255), server_default=u'')


# HACK(toshi): Relationships were not defined since they aren't being used
class UserRoles(Base):
    '''Pre-migration UserRoles object; mapping user, role, and resource.
    '''

    __tablename__ = 'user_roles'
    # pylint:disable=C0103
    id = sa.Column(sa.Integer(), primary_key=True)
    user_id = sa.Column(sa.Integer(), nullable=False)
    role_id = sa.Column(sa.Integer(), nullable=False)
    resource_id = sa.Column(sa.Integer(), nullable=True)


class GroupRoles(Base):
    '''Pre-migration GroupRoles object; mapping group, role, and resource.
    '''

    __tablename__ = 'security_group_roles'
    # pylint:disable=C0103
    id = sa.Column(sa.Integer(), primary_key=True)
    group_id = sa.Column(sa.Integer(), nullable=False)
    role_id = sa.Column(sa.Integer(), nullable=False)
    resource_id = sa.Column(sa.Integer(), nullable=True)


class UserAcl(Base):
    '''A class that represents a mapping between a `User`, `Permission`, and
    `Resource`
    '''

    __tablename__ = 'user_acl'
    # pylint:disable=C0103
    id = sa.Column(sa.Integer(), primary_key=True)
    user_id = sa.Column(sa.Integer(), nullable=False)
    resource_id = sa.Column(sa.Integer(), nullable=False)
    resource_role_id = sa.Column(sa.Integer(), nullable=False)


class GroupAcl(Base):
    '''A class that represents a mapping between a `Group`, `Permission`, and
    `Resource`
    '''

    __tablename__ = 'security_group_acl'
    # pylint:disable=C0103
    id = sa.Column(sa.Integer(), primary_key=True)
    group_id = sa.Column(sa.Integer(), nullable=False)
    resource_id = sa.Column(sa.Integer(), nullable=True)
    resource_role_id = sa.Column(sa.Integer(), nullable=False)


class RolePermissions(Base):
    '''Represents a mapping between a `Role` and a `Permission`.
    '''

    __tablename__ = 'role_permissions'
    # pylint:disable=C0103
    id = sa.Column(sa.Integer(), primary_key=True)
    role_id = sa.Column(sa.Integer(), nullable=False)
    permission_id = sa.Column(sa.Integer(), nullable=False)


class ResourceRole(Base):
    '''Defines a role which applies to a resource that can be assigned to a
    UserAcl or GroupAcl. An example of this would be a dashboard_admin or
    dashboard_editor.
    '''

    __tablename__ = 'resource_role'
    # pylint:disable=C0103
    id = sa.Column(sa.Integer(), primary_key=True, autoincrement=True)
    name = sa.Column(sa.String(50), nullable=False, server_default=u'', unique=True)
    resource_type_id = sa.Column(sa.Integer(), nullable=False)


class ResourceRolePermission(Base):
    '''Mapping between ResourceRole and the Permissions it represents.
    '''

    __tablename__ = 'resource_role_permission'
    # pylint:disable=C0103
    id = sa.Column(sa.Integer(), primary_key=True, autoincrement=True)
    resource_role_id = sa.Column(sa.Integer())
    permission_id = sa.Column(sa.Integer())


# HACK(toshi): We've already removed resource_type_id from roles, adding here
# for convenience
ROLES = [
    ('dashboard_viewer', 2),
    ('dashboard_editor', 2),
    ('dashboard_admin', 2),
    ('alert_admin', 6),
    ('alert_creator', 6),
    ('alert_editor', 6),
    ('alert_viewer', 6),
]


def populate_resource_roles(transaction):
    role_id_to_resource_role_id_map = {}
    for (role_name, resource_role_id) in ROLES:
        # Find existing role
        role_obj = transaction.find_one_by_fields(Role, True, {'name': role_name})
        role_permissions = transaction.find_all_by_fields(
            RolePermissions, {'role_id': role_obj.id}
        )

        # Fill into ResourceRole and populate its permissions
        resource_role = transaction.add_or_update(
            ResourceRole(name=role_name, resource_type_id=resource_role_id), flush=True
        )
        role_id_to_resource_role_id_map[role_obj.id] = resource_role.id
        for role_permission in role_permissions:
            transaction.add_or_update(
                ResourceRolePermission(
                    resource_role_id=resource_role.id,
                    permission_id=role_permission.permission_id,
                )
            )

    return role_id_to_resource_role_id_map


def upgrade_user_roles(transaction, role_id_to_resource_role_id_map):
    all_user_roles = transaction.find_all_by_fields(UserRoles, {})
    for user_role in all_user_roles:
        if user_role.resource_id:
            resource_role_id = role_id_to_resource_role_id_map.get(user_role.role_id)
            if not resource_role_id:
                continue

            transaction.add_or_update(
                UserAcl(
                    user_id=user_role.user_id,
                    resource_id=user_role.resource_id,
                    resource_role_id=resource_role_id,
                )
            )
            transaction.delete(user_role)


def create_list_key(unsorted_list):
    return tuple(sorted(unsorted_list))


# pylint:disable=C0103
def build_resource_role_id_to_role_id_map(transaction):
    # Go through all resource_roles and find the corresponding name in the role
    # table
    resource_role_id_to_role_id_map = {}
    all_resource_roles = transaction.find_all_by_fields(ResourceRole, {})
    for resource_role in all_resource_roles:
        role = transaction.find_one_by_fields(Role, True, {'name': resource_role.name})
        resource_role_id_to_role_id_map[resource_role.id] = role.id
    return resource_role_id_to_role_id_map


def downgrade_user_acl(transaction, resource_role_id_to_role_id_map):
    all_user_acls = transaction.find_all_by_fields(UserAcl, {})
    for user_acl in all_user_acls:
        role_id = resource_role_id_to_role_id_map[user_acl.resource_role_id]
        transaction.add_or_update(
            UserRoles(
                user_id=user_acl.user_id,
                role_id=role_id,
                resource_id=user_acl.resource_id,
            )
        )


def upgrade_group_roles(transaction, role_id_to_resource_role_id_map):
    all_group_roles = transaction.find_all_by_fields(GroupRoles, {})
    for group_role in all_group_roles:
        if group_role.resource_id:
            if group_role.role_id not in role_id_to_resource_role_id_map:
                # We only want to move roles that have corresponding ResourceRoles
                continue
            resource_role_id = role_id_to_resource_role_id_map[group_role.role_id]
            transaction.add_or_update(
                GroupAcl(
                    group_id=group_role.group_id,
                    resource_id=group_role.resource_id,
                    resource_role_id=resource_role_id,
                )
            )

            transaction.delete(group_role)


def downgrade_group_acl(transaction, resource_role_id_to_role_id_map):
    all_group_acls = transaction.find_all_by_fields(GroupAcl, {})
    for group_acl in all_group_acls:
        role_id = resource_role_id_to_role_id_map[group_acl.resource_role_id]
        transaction.add_or_update(
            GroupRoles(
                group_id=group_acl.group_id,
                role_id=role_id,
                resource_id=group_acl.resource_id,
            )
        )


def upvert_data(alembic_operation):
    '''Populates ACL and ResourceRole tables
    1. Move relevant roles from Role to ResourceRoles.
    2. Go through UserRoles and GroupRoles and move rows with specific resources
        to corresponding ACL tables.
    '''
    with Transaction(get_session=lambda: get_session(alembic_operation)) as transaction:
        role_id_to_resource_role_id_map = populate_resource_roles(transaction)
        upgrade_user_roles(transaction, role_id_to_resource_role_id_map)
        upgrade_group_roles(transaction, role_id_to_resource_role_id_map)


def downvert_data(alembic_operation):
    '''High level steps
    1. Move rows in UserAcl and GroupAcl to UserRole and GroupRole tables
    '''
    with Transaction(get_session=lambda: get_session(alembic_operation)) as transaction:
        resource_role_id_to_role_id_map = build_resource_role_id_to_role_id_map(
            transaction
        )
        downgrade_user_acl(transaction, resource_role_id_to_role_id_map)
        downgrade_group_acl(transaction, resource_role_id_to_role_id_map)
