# -*- coding: utf-8 -*-
from urllib.parse import urljoin

from web.python_client.core import ApiService, LOCALHOST_URI
from web.python_client.directory_service.model import (
    User,
    SecurityGroup,
    UserStatusEnum,
)


class DirectoryService(ApiService):
    def __init__(self, session, host=LOCALHOST_URI):
        super(DirectoryService, self).__init__(session, host)
        self._user_uri = urljoin(self.base_uri, 'api2/user')
        self._group_uri = urljoin(self.base_uri, 'api2/group')

    def list_all_users(self):
        return [User(user_dict) for user_dict in self.get(self._user_uri).json()]

    def get_user(self, username):
        filter_string = '?where={{"username":"{username}"}}'.format(username=username)
        full_uri = self._user_uri + filter_string
        users = self.get(full_uri).json()

        if len(users) > 0:
            return User(users[0])
        else:
            raise ValueError('No user with username \'%s\' exists.' % username)

    def create_user(self, username, first_name, last_name, phone_number):
        user = User()
        user.first_name = first_name
        user.last_name = last_name
        user.username = username
        user.status = UserStatusEnum.ACTIVE
        user.phone_number = phone_number
        return User(self.post(self._user_uri, json=user.serialize()).json())

    def invite_user(self, username, first_name, last_name):
        name = '{first_name} {last_name}'.format(
            first_name=first_name, last_name=last_name
        )
        request_object = [{'email': username, 'name': name}]

        destination_uri = self.get_destination_uri('/api2/user/invite')
        invited_users = self.post(destination_uri, json=request_object).json()
        return [User(user) for user in invited_users]

    def update_user(self, user):
        if not isinstance(user, User):
            raise TypeError('\'user\' must be of type User.')
        destination_uri = self.get_destination_uri(user.uri)

        self._update_user_roles(user)

        return User(self.patch(destination_uri, json=user.serialize()).json())

    def _update_user_roles(self, user):
        if user.roles is None:
            return

        destination_uri = self.get_destination_uri(
            '{user_uri}/roles'.format(user_uri=user.uri)
        )

        return self.patch(destination_uri, json=user.roles.serialize())

    def change_user_password(self, user, new_password):
        data = {'newPassword': new_password}
        destination_uri = self.get_destination_uri(
            '{user_uri}/password'.format(user_uri=user.uri)
        )
        return self.post(destination_uri, json=data)

    def reset_user_password(self, user):
        destination_uri = self.get_destination_uri(
            '{user_uri}/reset_password'.format(user_uri=user.uri)
        )
        return self.post(destination_uri)

    def delete_user(self, user):
        destination_uri = self.get_destination_uri(user.uri)
        return self.delete(destination_uri)

    def delete_group(self, group):
        destination_uri = self.get_destination_uri(group.uri)
        return self.delete(destination_uri)

    def list_all_groups(self):
        return [
            SecurityGroup(raw_group) for raw_group in self.get(self._group_uri).json()
        ]

    def get_group(self, group_name):
        filter_string = '?where={{"name":"{group_name}"}}'.format(group_name=group_name)
        full_uri = self._group_uri + filter_string
        groups = self.get(full_uri).json()

        if len(groups) > 0:
            return SecurityGroup(groups[0])
        else:
            raise ValueError('No group with username \'%s\' exists.' % group_name)

    def create_group(self, group_name, users=None, roles=None):
        users = users or []
        roles = roles or {}
        group = SecurityGroup(name=group_name, users=users, roles=roles)
        group.name = group_name
        group = SecurityGroup(self.post(self._group_uri, json=group.serialize()).json())

        group['users'] = users
        group['roles'] = roles
        return self.update_group(group)

    def update_group(self, group):
        if not isinstance(group, SecurityGroup):
            raise TypeError('\'group\' must be of type SecurityGroup.')

        self._update_group_roles(group)
        self._update_group_users(group)
        destination_uri = self.get_destination_uri(group.uri)

        return SecurityGroup(self.patch(destination_uri, json=group.serialize()).json())

    def _update_group_roles(self, group):
        if group.roles is None:
            return

        destination_uri = self.get_destination_uri(
            '{group_uri}/roles'.format(group_uri=group.uri)
        )

        return self.patch(destination_uri, json=group.roles.serialize())

    def _update_group_users(self, group):
        if group.users is None:
            return

        destination_uri = self.get_destination_uri(
            '{group_uri}/users'.format(group_uri=group.uri)
        )
        return self.patch(destination_uri, json=list(group.users))
