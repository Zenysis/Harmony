from enum import Enum


class ResourceTypeEnum(Enum):
    '''An internal representation of the various resource types. Although they
    are defined in the database, they are also defined here for convenience.
    '''

    # A resource type that represents a website of the deployment (e.g. moh.ehdap.com)
    SITE = 1

    # A resource type that represents an individual dashboard (e.g. 'JSC Dashboard')
    DASHBOARD = 2

    # A resource type that represents an individual user on the site
    USER = 3

    # A resource type that represents a security group on the site
    GROUP = 4

    # A resource type that represents a query policy controlling how users can query the system
    # for data
    QUERY_POLICY = 5


RESOURCE_TYPES = [e.name for e in ResourceTypeEnum]


class UserRoleMap(dict):
    def __init__(self, *args, **kwargs):
        super(UserRoleMap, self).__init__(*args, **kwargs)

        for resource_type in RESOURCE_TYPES:
            _resource_type = resource_type
            resource_role_map = self.get(_resource_type)

            if resource_role_map:
                self[_resource_type] = _ResourceTypeRoleMap(resource_role_map)
            else:
                self[_resource_type] = _ResourceTypeRoleMap()

    @classmethod
    def _assert_resource_type(cls, resource_type):
        assert resource_type in ResourceTypeEnum

    def has_role(self, resource_type, role_name, resource_name=None):
        role_name = role_name.lower()
        resource_name = resource_name.lower() if resource_name else None
        UserRoleMap._assert_resource_type(resource_type)
        resource_type = resource_type.name

        resource_role_map = self[resource_type]
        return resource_role_map.has_role(role_name, resource_name)

    def add_role(self, resource_type, role_name, resource_name=None):
        role_name = role_name.lower()
        resource_name = resource_name.lower() if resource_name else None
        UserRoleMap._assert_resource_type(resource_type)
        resource_type = resource_type.name

        resource_role_map = self[resource_type]
        return resource_role_map.add_role(role_name, resource_name)

    def delete_role(self, resource_type, role_name, resource_name=None):
        role_name = role_name.lower()
        resource_name = resource_name.lower() if resource_name else None
        UserRoleMap._assert_resource_type(resource_type)
        resource_type = resource_type.name

        resource_role_map = self[resource_type]
        return resource_role_map.delete_role(role_name, resource_name)

    def serialize(self):
        result = dict(self)

        for resource_type, role_map in list(result.items()):
            result[resource_type] = role_map.serialize()

        return result


class _ResourceTypeRoleMap(dict):
    @property
    def _resource_specific_roles(self):
        roles_object = self.get('resources')

        if not roles_object:
            self['resources'] = dict()
        else:
            for resource_name, roles in list(roles_object.items()):
                roles_object[resource_name] = set(roles)

        return self['resources']

    @property
    def _sitewide_roles(self):
        roles_object = self.get('sitewideRoles')

        if not roles_object:
            self['sitewideRoles'] = set()
        elif not isinstance(roles_object, set):
            self['sitewideRoles'] = set(roles_object)

        return self['sitewideRoles']

    def has_role(self, role_name, resource_name=None):
        role_name = role_name.lower()
        resource_name = resource_name.lower() if resource_name else None
        is_sitewide_role = resource_name is None

        if is_sitewide_role:
            return role_name in self._sitewide_roles
        else:
            return role_name in self._resource_specific_roles.get(resource_name, set())

    def add_role(self, role_name, resource_name=None):
        role_name = role_name.lower()
        resource_name = resource_name.lower() if resource_name else None
        is_sitewide_role = resource_name is None

        if is_sitewide_role:
            self._sitewide_roles.add(role_name)
        else:
            resource_roles = self._resource_specific_roles.get(resource_name, set())
            resource_roles.add(role_name)
            self._resource_specific_roles[resource_name] = resource_roles

    def delete_role(self, role_name, resource_name=None):
        role_name = role_name.lower()
        resource_name = resource_name.lower() if resource_name else None
        is_sitewide_role = resource_name is None

        if is_sitewide_role and role_name in self._sitewide_roles:
            self._sitewide_roles.remove(role_name)

        elif not is_sitewide_role and resource_name in self._resource_specific_roles:
            roles = self._resource_specific_roles[resource_name]
            if role_name in roles:
                roles.remove(role_name)

    def serialize(self):
        result = {}
        result['sitewideRoles'] = (
            list(self._sitewide_roles) if self._sitewide_roles else []
        )

        resource_specific_roles = {}
        result['resources'] = resource_specific_roles

        for resource_name, roles in list(self._resource_specific_roles.items()):
            resource_specific_roles[resource_name] = list(roles)

        return result


class QueryPolicy(dict):
    def __init__(self, *args, **kwargs):
        super(QueryPolicy, self).__init__(*args, **kwargs)

        policy_filters = self.get('policyFilters', {})

        for dimension, policy_filter in list(policy_filters.items()):
            policy_filters[dimension] = PolicyFilter(policy_filter)

        self['policyFilters'] = policy_filters

    @property
    def uri(self):
        return self.get('$uri')

    @property
    def description(self):
        return self.get('description')

    @property
    def name(self):
        return self.get('name')

    @property
    def policy_filters(self):
        return self.get('policyFilters')

    @property
    def resource(self):
        return self.get('resource')

    @property
    def query_policy_type_id(self):
        return self.get('queryPolicyTypeId')

    def serialize(self):
        result = dict(self)

        if '$uri' in result:
            result.pop('$uri')

        if 'resource' in result:
            result.pop('resource')

        return result


class PolicyFilter(dict):
    '''An object representation of the metadata object returned by the 'dashboard' API
    '''

    @property
    def all_values(self):
        return self.get('allValues')

    @property
    def exclude_values(self):
        return self.get('excludeValues')

    @property
    def include_values(self):
        return self.get('includeValues')
