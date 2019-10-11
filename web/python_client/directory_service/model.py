from enum import Enum

from web.python_client.authorization_service.model import UserRoleMap


class UserStatusEnum(Enum):
    '''An enumeration of possible statuses that a user can be associated with.
    '''

    # Indicates that the user has registered for an account on the site and is able to sign in.
    ACTIVE = 1

    # Indicates that the user has registered for an account on the site but has been prevented
    # from signing in.
    INACTIVE = 2

    # Indicates that a user has been invited to register for an account on the site but has not
    # signed in.
    PENDING = 3


class User(dict):
    '''An object representation of a User returned by the 'user' API.
    '''

    @property
    def uri(self):
        return self.get('$uri')

    @property
    def username(self):
        return self.get('username')

    @username.setter
    def username(self, value):
        self['username'] = value

    @property
    def first_name(self):
        return self.get('firstName')

    @first_name.setter
    def first_name(self, value):
        self['firstName'] = value

    @property
    def last_name(self):
        return self.get('lastName')

    @last_name.setter
    def last_name(self, value):
        self['lastName'] = value

    @property
    def phone_number(self):
        return self.get('phoneNumber')

    @phone_number.setter
    def phone_number(self, value):
        self['phoneNumber'] = value

    @property
    def roles(self):
        roles_object = self.get('roles')
        if not (roles_object is None and isinstance(roles_object, UserRoleMap)):
            self['roles'] = UserRoleMap(roles_object)
        return self.get('roles')

    @roles.setter
    def roles(self, value):
        self['roles'] = UserRoleMap(value)

    @property
    def status(self):
        status = self.get('status')
        # The value of this type is enforced on both client and server
        # pylint:disable=E1136
        if status and not isinstance(status, UserStatusEnum):
            self['status'] = UserStatusEnum[status.upper()]
        return self.get('status')

    @status.setter
    def status(self, value):
        if not isinstance(value, UserStatusEnum):
            raise TypeError('\'value\' must be an instance of \'UserStatusEnum\'')

        self['status'] = value

    def serialize(self):
        result = dict(self)

        # Don't access the property in case this value was never set
        if 'roles' in self:
            result.pop('roles')

        if self.uri:
            result.pop('$uri')

        if self.status:
            result['status'] = self.status.name.lower()

        return result


class SecurityGroup(dict):
    '''An object representation of a User returned by the 'user' API.
    '''

    @property
    def uri(self):
        return self.get('$uri')

    @property
    def name(self):
        return self.get('name')

    @name.setter
    def name(self, value):
        self['name'] = value

    @property
    def users(self):
        users = self.get('users')

        if users != None and not isinstance(users, set):
            self['users'] = set()
            for user in users:
                self['users'].add(user['username'])

        return self.get('users')

    @users.setter
    def users(self, value):
        self['users'] = set(value)

    @property
    def roles(self):
        roles_object = self.get('roles')
        if not (roles_object is None and isinstance(roles_object, UserRoleMap)):
            self['roles'] = UserRoleMap(roles_object)

        return self.get('roles')

    @roles.setter
    def roles(self, value):
        if not isinstance(value, UserRoleMap):
            self['roles'] = UserRoleMap(value)
        else:
            self['roles'] = value

    def add_user(self, username):
        if self.users is None:
            self.users = set()
        self.users.add(username)

    def remove_user(self, username):
        if not self.users is None:
            self.users = set()

        if username in self.users:
            self.users.remove(username)

    def serialize(self):
        result = dict(self)
        # Don't access the property in case this value was never set
        if 'roles' in self:
            result.pop('roles')

        # Don't access the property in case this value was never set
        if 'users' in self:
            result.pop('users')

        if self.uri:
            result.pop('$uri')

        return result
