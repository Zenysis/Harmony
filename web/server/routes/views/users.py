from collections import defaultdict, namedtuple
from typing import Any, Dict, List, Optional, Tuple, TYPE_CHECKING, TypedDict, Union

from flask import g
from flask_user import current_user

from models.alchemy.alerts import AlertDefinition
from models.alchemy.dashboard import Dashboard
from models.alchemy.security_group import Group
from models.alchemy.permission import Role, Resource
from models.alchemy.user import UserRoles, User, UserAcl, UserStatusEnum
from web.server.data.data_access import (
    get_db_adapter,
    add_entity,
    delete_entity,
    find_one_by_fields,
    find_all_by_fields,
    Transaction,
)
from web.server.errors import UserAlreadyInvited
from web.server.routes.views.core import try_get_role_and_resource
from web.server.routes.views.invite import send_invite_emails
from web.server.util.util import get_user_string, Success
from web.server.potion.access import get_id_from_uri
from web.server.potion.signals import after_user_role_change, before_user_role_change

if TYPE_CHECKING:
    from sqlalchemy.orm.session import Session

UNREGISTERED_USER_USERNAME = 'anonymous_user_tracking@zenysis.com'
UNREGISTERED_USER_FIRST = 'Anonymous'
UNREGISTERED_USER_LAST = 'User'

SUCCESS_USER_ROLE_ADDED = 'USER_ROLE_ADDED'
SUCCESS_USER_ROLE_DELETED = 'USER_ROLE_DELETED'

Invitee = namedtuple('Invitee', ['name', 'email'])


class RollResourceType(TypedDict):
    sitewideRoles: List[str]
    resources: Dict[str, List[str]]


class ResourceType(TypedDict):
    label: str
    name: str
    resourceType: str


class ResourceRoleType(TypedDict):
    name: str
    resourceType: str


class AclType(TypedDict):
    resource: ResourceType
    resourceRole: ResourceRoleType


class UserObject(TypedDict):
    username: str
    first_name: str
    last_name: str
    phone_number: str
    status_id: str
    acls: List[AclType]
    roles: List[str]
    groups: List[str]


def try_get_user(username: str, session: 'Optional[Session]' = None) -> Optional[User]:
    return find_one_by_fields(
        User,
        case_sensitive=False,
        search_fields={'username': username},
        session=session,
    )


def try_get_user_acl(
    user_id: int,
    resource_role_id: int,
    resource_id: Optional[int] = None,
    session: 'Optional[Session]' = None,
) -> Optional[UserAcl]:
    '''Attempt to find a user role association for a given user, resource_role
    and resource.
    '''
    return find_one_by_fields(
        UserAcl,
        case_sensitive=True,
        search_fields={
            'user_id': user_id,
            'resource_role_id': resource_role_id,
            'resource_id': resource_id,
        },
        session=session,
    )


def list_roles_for_resource(
    user: User, resource: Resource, session: 'Optional[Session]' = None
) -> List[UserAcl]:
    '''Returns an enumeration of `UserAcl` instances matching the given user and resource.'''
    return find_all_by_fields(
        UserAcl,
        search_fields={'user_id': user.id, 'resource_id': resource.id},
        session=session,
    )


def list_user_roles_for_resource_api(
    resource: Resource, session: 'Optional[Session]' = None
) -> Dict[str, List[str]]:
    '''Returns an enumeration of the users and the roles that they hold (if any) for a given
    resource. Users that do not hold any roles specific to the resource will not
    be listed.
    '''
    matching_acls = find_all_by_fields(
        UserAcl, search_fields={'resource_id': resource.id}, session=session
    )
    username_to_role_list = defaultdict(lambda: [])
    for acl in matching_acls:
        username_to_role_list[acl.user.username].append(acl.resource_role.name)

    return username_to_role_list


def force_delete_user(
    user: User,
    session: 'Optional[Session]' = None,
    flush: bool = True,
    commit: bool = True,
) -> None:
    '''Force deletes a user by deleting all of the alerts and dashboards
    associated with them along with the user entity.
    '''

    session = session or get_db_adapter().session

    # NOTE(isabel): type suppression is necessary here because SQL Alchemy model attributes
    # do not contain __iter__ attributes so mypy will complain that `roles` is not iterable
    for dashboard in user.dashboards:  # type: ignore
        delete_entity(session, dashboard)

    alerts = find_all_by_fields(
        AlertDefinition, search_fields={'user_id': user.id}, session=session
    )
    for alert in alerts:
        delete_entity(session, alert, commit=True)

    session.delete(user)

    if flush:
        session.flush()

    if commit:
        session.commit()


# TODO(toshi): We need to deprecate this function. find all functions to deprecate.
def add_user_role(
    user: User,
    role_name: str,
    resource_type: str,
    resource_name: Optional[str],
    session: 'Optional[Session]' = None,
    flush: bool = True,
    commit: bool = True,
) -> Tuple[Union[UserRoles, Optional[UserAcl]], bool]:
    session = session or get_db_adapter().session
    (role, resource_type, resource) = try_get_role_and_resource(
        role_name, resource_type, resource_name, session
    )
    resource_id = resource.id if resource else None
    entity = try_get_user_acl(user.id, role.id, resource_id, session)
    exists = False

    if not entity:
        exists = True
        entity = UserRoles(
            user_id=user.id, role_id=role.id, resource_id=resource_id
        )  # type: ignore
        before_user_role_change.send(user, role=role)
        add_entity(session, entity, flush, commit)
        after_user_role_change.send(user, role=role)

    return (entity, exists)


def add_user_acl(
    user: User,
    resource_role_name: str,
    resource_type: str,
    resource_name: Optional[str],
    session: 'Optional[Session]' = None,
    flush: bool = True,
    commit: bool = True,
) -> Tuple[UserAcl, bool]:
    session = session or get_db_adapter().session
    (resource_role, resource_type, resource) = try_get_role_and_resource(
        resource_role_name, resource_type, resource_name, session
    )
    resource_id = resource.id if resource else None
    entity = try_get_user_acl(user.id, resource_role.id, resource_id, session)
    exists = False

    if not entity:
        exists = True
        entity = UserAcl(
            user_id=user.id, resource_role_id=resource_role.id, resource_id=resource_id
        )
        before_user_role_change.send(user, role=resource_role)
        add_entity(session, entity, flush, commit)
        after_user_role_change.send(user, role=resource_role)

    return (entity, exists)


def delete_user_role(
    user: User,
    role_name: str,
    resource_type: str,
    resource_name: Optional[str],
    session: 'Optional[Session]' = None,
    flush: bool = True,
    commit: bool = True,
) -> Tuple[Optional[UserAcl], bool]:
    session = session or get_db_adapter().session
    (role, resource_type, resource) = try_get_role_and_resource(
        role_name, resource_type, resource_name, session
    )
    resource_id = resource.id if resource else None
    entity = try_get_user_acl(user.id, role.id, resource_id)
    exists = False

    if entity:
        exists = True
        before_user_role_change.send(user, role=role)
        delete_entity(session, entity, flush, commit)
        after_user_role_change.send(user, role=role)

    return (entity, exists)


# NOTE(all): Will have to deprecate / modify this with new roles
def update_user_roles_from_map(
    user: User,
    role_mapping: Dict[str, RollResourceType],
    session: 'Optional[Session]' = None,
    flush: bool = True,
    commit: bool = True,
) -> List[Union[UserRoles, UserAcl, None]]:
    session = session or get_db_adapter().session
    new_role_entities = []
    roles = user.roles

    # NOTE(isabel): type suppression is necessary here because SQL Alchemy model attributes
    # do not contain __iter__ attributes so mypy will complain that `roles` is not iterable
    for role in roles:  # type: ignore
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


def list_resource_roles_for_user(user_id: int) -> List[UserAcl]:
    return find_all_by_fields(UserAcl, search_fields={'user_id': user_id})


def list_resource_roles_for_user_and_resource(
    resource_id: int, user_id: int
) -> List[UserAcl]:
    return find_all_by_fields(
        UserAcl, search_fields={'resource_id': resource_id, 'user_id': user_id}
    )


def update_user_resource_roles(
    user: User,
    new_resource_roles: List[Dict[str, Any]],
    resource: Optional[Resource] = None,
    session: 'Optional[Session]' = None,
    flush: bool = True,
    commit: bool = True,
) -> List[UserAcl]:
    session = session or get_db_adapter().session
    new_role_entities = []
    # List only resource roles acls for user and resource ids when resource
    # exists.
    if resource:
        resource_roles = list_resource_roles_for_user_and_resource(resource.id, user.id)
    else:
        resource_roles = list_resource_roles_for_user(user.id)

    # TODO(toshi): Refactor this to take advantage of SQLAlchemy rather than
    # manually deleting and re-adding resource roles
    for role in resource_roles:
        session.delete(role)

    for new_role in new_resource_roles:
        role_name = new_role['role_name']
        resource_type = new_role['resource_type']
        resource_name = resource.name if resource else new_role.get('resource_name')

        # Do not flush or commit these changes. We want to perform the update in a transacted
        # fashion.
        (result, _) = add_user_acl(
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


def update_user_acls(user: User, acls: List[AclType]) -> None:
    resource_roles_map = []
    for acl in acls:
        resource = acl['resource']
        resource_roles_map.append(
            {
                'role_name': acl['resourceRole']['name'],
                'resource_type': resource.get('resourceType'),
                'resource_name': resource.get('name'),
            }
        )
    update_user_resource_roles(user, resource_roles_map)


def update_user_groups(user: User, new_groups: List[str]) -> None:
    with Transaction() as transaction:
        groups = []
        for group_uri in new_groups:
            group = transaction.find_by_id(Group, get_id_from_uri(group_uri))
            if group:
                groups.append(group)
        # TODO(isabel): fix type error
        user.groups = groups  # type: ignore


def build_user_updates(user_obj: UserObject) -> Dict[str, Any]:
    '''Gather necessary components that need to be updated in a user'''
    roles = []
    with Transaction() as transaction:
        for role_uri in user_obj['roles']:
            role = transaction.find_by_id(Role, get_id_from_uri(role_uri))
            if role:
                roles.append(role)

    user_updates = {
        'username': user_obj['username'],
        'first_name': user_obj['first_name'],
        'last_name': user_obj['last_name'],
        'phone_number': user_obj['phone_number'],
        'status_id': user_obj['status_id'],
        'roles': roles,
    }

    # NOTE(toshi): This is the only action and attribute that a non-admin can
    # affect. Corner case where a user is invited by an admin and activates
    # their account, and without refreshing the page, the admin assigns
    # something to the user and status gets overwritten. Since a status cannot
    # revert back to pending, we'll remove this from the updates
    if user_obj['status_id'] == UserStatusEnum.PENDING.value:
        user_updates.pop('status_id')
    return user_updates


# NOTE(all): Will need to modify this later
def add_user_role_api(
    user: User,
    role_name: str,
    resource_type: str,
    resource_name: Optional[str] = None,
    session: 'Optional[Session]' = None,
    flush: bool = True,
    commit: bool = True,
) -> Success:
    '''Add a user role association for a given user, role and resource.'''
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
    user: User,
    role_name: str,
    resource_type: str,
    resource_name: Optional[str] = None,
    session: 'Optional[Session]' = None,
    flush: bool = True,
    commit: bool = True,
) -> Success:
    '''Delete a user role association for a given user, role and resource.'''
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


def invite_users(invitees: List[Invitee]) -> List[User]:
    with Transaction() as transaction:
        # First make sure that all invitees are not already registered users
        emails = [user.email.lower() for user in invitees]
        pending_users = []
        # pylint:disable=E1101
        existing_users = User.query.filter(
            User.username.in_(emails), User.status_id != UserStatusEnum.PENDING.value
        ).all()
        # pylint:disable=E1101
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


def get_anonymous_user() -> User:
    '''Fetch anonymous user. Create if it doesn't already exist.'''
    with Transaction() as transaction:
        maybe_anon_user = transaction.find_one_by_fields(
            User, False, {'username': UNREGISTERED_USER_USERNAME}
        )
        if maybe_anon_user:
            return maybe_anon_user

        # HACK(toshi): Only to be used for placeholder user objects that track
        # unregistered user activity
        return transaction.add_or_update(
            User(
                username=UNREGISTERED_USER_USERNAME,
                first_name=UNREGISTERED_USER_FIRST,
                last_name=UNREGISTERED_USER_LAST,
                status_id=UserStatusEnum.ACTIVE.value,
            ),
            flush=True,
        )


def get_current_user() -> User:
    '''Safely fetches the current user object, taking into account unregistered
    users. Use this instead of flask_user.current_user if ever code path is used
    with unregistered users.
    '''
    return get_anonymous_user() if current_user.is_anonymous else current_user


def get_user_owned_resources(user: User) -> List[Resource]:
    '''Get the resources owned by a given user.'''
    with Transaction() as transaction:
        user_id = user.id
        owned_dashboards = transaction.find_all_by_fields(
            Dashboard, {'author_id': user_id}
        )
        owned_alerts = transaction.find_all_by_fields(
            AlertDefinition, {'user_id': user_id}
        )
        resource_ids = [dashboard.resource_id for dashboard in owned_dashboards] + [
            alert.authorization_resource_id for alert in owned_alerts
        ]
        return (
            transaction.run_raw()
            .query(Resource)
            .filter(Resource.id.in_(resource_ids))
            .all()
        )
