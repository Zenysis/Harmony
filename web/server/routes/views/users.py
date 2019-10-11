from collections import namedtuple
from flask import g

from models.alchemy.alerts import AlertDefinition
from models.alchemy.permission import Role, Resource, ResourceType
from models.alchemy.user import UserRoles, User, UserStatusEnum
from web.server.data.data_access import (
    get_db_adapter,
    add_entity,
    delete_entity,
    find_by_id,
    find_one_by_fields,
    find_all_by_fields,
    Transaction,
)
from web.server.errors import UserAlreadyInvited
from web.server.routes.views.core import try_get_role_and_resource
from web.server.routes.views.invite import send_invite_emails
from web.server.util.util import get_user_string, as_dictionary, Success
from web.server.potion.signals import after_user_role_change, before_user_role_change

SUCCESS_USER_ROLE_ADDED = 'USER_ROLE_ADDED'
SUCCESS_USER_ROLE_DELETED = 'USER_ROLE_DELETED'

Invitee = namedtuple('Invitee', ['name', 'email'])


def try_get_user(username, session=None):
    return find_one_by_fields(
        User,
        case_sensitive=False,
        search_fields={'username': username},
        session=session,
    )


def try_get_user_role(user_id, role_id, resource_id=None, session=None):
    '''Attempt to find a user role association for a given user, role and resource.
    '''
    return find_one_by_fields(
        UserRoles,
        case_sensitive=True,
        search_fields={
            'user_id': user_id,
            'role_id': role_id,
            'resource_id': resource_id,
        },
        session=session,
    )


def list_roles_for_resource(user, resource, session=None):
    '''Returns an enumeration of `UserRoles` instances matching the given user and resource.
    '''
    return find_all_by_fields(
        UserRoles,
        search_fields={'user_id': user.id, 'resource_id': resource.id},
        session=session,
    )


def list_user_roles_for_resource_api(resource, session=None):
    '''Returns an enumeration of the users and the roles that they hold (if any) for a given
    resource. Users that do not hold any roles specific to the resource will not
    be listed.
    '''
    matching_rows = find_all_by_fields(
        UserRoles, search_fields={'resource_id': resource.id}, session=session
    )
    output = {}

    for row in matching_rows:
        user = find_by_id(User, row.user_id)
        user_roles = list_roles_for_resource(user, resource)
        role_names = [user_role.role.name for user_role in user_roles]
        output[user.username] = role_names
    return output


def force_delete_user(user, session=None, flush=True, commit=True):
    '''Force deletes a user by deleting all of the alerts and dashboards
    associated with them along with the user entity.
    '''

    session = session or get_db_adapter().session

    for dashboard in user.dashboards:
        delete_entity(session, dashboard)

    alerts = find_all_by_fields(
        AlertDefinition, search_fields={'user_id': user.id}, session=session)
    for alert in alerts:
        delete_entity(session, alert, commit=True)

    session.delete(user)

    if flush:
        session.flush()

    if commit:
        session.commit()


def add_user_role(
    user, role_name, resource_type, resource_name, session=None, flush=True, commit=True
):
    session = session or get_db_adapter().session
    (role, resource_type, resource) = try_get_role_and_resource(
        role_name, resource_type, resource_name, session
    )
    resource_id = resource.id if resource else None
    entity = try_get_user_role(user.id, role.id, resource_id, session)
    exists = False

    if not entity:
        exists = True
        entity = UserRoles(user_id=user.id, role_id=role.id, resource_id=resource_id)
        before_user_role_change.send(user, role=role)
        add_entity(session, entity, flush, commit)
        after_user_role_change.send(user, role=role)

    return (entity, exists)


def delete_user_role(
    user, role_name, resource_type, resource_name, session=None, flush=True, commit=True
):
    session = session or get_db_adapter().session
    (role, resource_type, resource) = try_get_role_and_resource(
        role_name, resource_type, resource_name, session
    )
    resource_id = resource.id if resource else None
    entity = try_get_user_role(user.id, role.id, resource_id)
    exists = False

    if entity:
        exists = True
        before_user_role_change.send(user, role=role)
        delete_entity(session, entity, flush, commit)
        after_user_role_change.send(user, role=role)

    return (entity, exists)


def update_user_roles_from_map(
    user, role_mapping, session=None, flush=True, commit=True
):
    session = session or get_db_adapter().session
    new_role_entities = []
    roles = user.roles

    for role in roles:
        before_user_role_change.send(user, role=role)
        session.delete(role)
        after_user_role_change.send(user, role=role)

    for resource_type in list(role_mapping.keys()):
        resource_to_roles = role_mapping[resource_type]['resources']
        sitewide_roles = role_mapping[resource_type]['sitewideRoles']

        # Add all sitewide roles for the current resource type
        for role_name in sitewide_roles:
            (result, _) = add_user_role(
                user, role_name, resource_type, None, session, flush=False, commit=False
            )
            new_role_entities.append(result)

        # Add all resource specific roles for the current resource type
        for resource_name, role_names in list(resource_to_roles.items()):
            for role_name in role_names:
                (result, _) = add_user_role(
                    user,
                    role_name,
                    resource_type,
                    resource_name,
                    session,
                    flush=False,
                    commit=False,
                )
                new_role_entities.append(result)

    if flush:
        session.flush()

    if commit:
        session.commit()

    return new_role_entities


def update_user_roles(
    user, new_roles, resource=None, session=None, flush=True, commit=True
):
    session = session or get_db_adapter().session
    new_role_entities = []
    roles = list_roles_for_resource(user, resource) if resource else user.roles

    for role in roles:
        session.delete(role)

    for role in new_roles:
        role_name = role['role_name']
        resource_type = role['resource_type']
        resource_name = resource.name if resource else role.get('resource_name')

        # Do not flush or commit these changes. We want to perform the update in a transacted
        # fashion.
        (result, _) = add_user_role(
            user,
            role_name,
            resource_type,
            resource_name,
            session,
            flush=False,
            commit=False,
        )
        new_role_entities.append(result)

    if flush:
        session.flush()

    if commit:
        session.commit()

    return new_role_entities


def add_user_role_api(
    user,
    role_name,
    resource_type,
    resource_name=None,
    session=None,
    flush=True,
    commit=True,
):
    '''Add a user role association for a given user, role and resource.
    '''
    add_user_role(user, role_name, resource_type, resource_name, session, flush, commit)

    resource_string = (
        'Resource \'%s\' of type \'%s\'' % (resource_name, resource_type)
        if resource_name
        else 'all resources of type \'%s\'' % resource_type
    )
    message = '%s Role \'%s\' for User \'%s\' on %s' % (
        'Added' if commit else 'Commit pending for addition of',
        role_name,
        get_user_string(user),
        resource_string,
    )

    g.request_logger.info(message)
    return Success({'code': SUCCESS_USER_ROLE_ADDED, 'message': message})


def delete_user_role_api(
    user,
    role_name,
    resource_type,
    resource_name=None,
    session=None,
    flush=True,
    commit=True,
):
    '''Delete a user role association for a given user, role and resource.
    '''
    delete_user_role(
        user, role_name, resource_type, resource_name, session, flush, commit
    )

    resource_string = (
        'Resource \'%s\' of type \'%s\'' % (resource_name, resource_type)
        if resource_name
        else 'all resources of type \'%s\'' % resource_type
    )
    message = '%s Role \'%s\' on %s for User \'%s\'' % (
        'Revoked' if commit else 'Commit pending for revocation of',
        role_name,
        resource_string,
        get_user_string(user),
    )

    g.request_logger.info(message)
    return Success({'code': SUCCESS_USER_ROLE_DELETED, 'message': message})


def invite_users(invitees):
    with Transaction() as transaction:
        # First make sure that all invitees are not already registered users
        emails = [user.email.lower() for user in invitees]
        pending_users = []
        existing_users = User.query.filter(
            User.username.in_(emails), User.status_id != UserStatusEnum.PENDING.value
        ).all()
        existing_pending_users = User.query.filter(
            User.username.in_(emails), User.status_id == UserStatusEnum.PENDING.value
        ).all()

        existing_username_to_user = {}
        for user in existing_pending_users:
            existing_username_to_user[user.username.lower()] = user

        if existing_users != []:
            # ERROR: some users have already registered
            existing_emails = [user.username for user in existing_users]
            raise UserAlreadyInvited(existing_emails)

        # Add all invitees to the database as Pending Users
        for invitee in invitees:
            email = invitee.email.lower()
            existing_user = existing_username_to_user.get(email)
            if not existing_user:
                pending_user = User(
                    username=email,
                    first_name=invitee.name,
                    last_name='',
                    status_id=UserStatusEnum.PENDING.value,
                )
                pending_users.append(
                    transaction.add_or_update(pending_user, flush=True)
                )
            else:
                pending_users.append(existing_user)

        # Now send emails to all of them
        send_invite_emails(pending_users)

    return pending_users
