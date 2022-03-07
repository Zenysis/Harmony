''' The permissions module that defines the Authorization model for any requests to the platform
'''

from builtins import object
from flask import g
from flask_potion.contrib.principals import PrincipalMixin
from flask_potion.contrib.principals.needs import HybridItemNeed
from flask_potion.contrib.principals.permission import HybridPermission
from flask_potion.manager import RelationalManager
from flask_principal import AnonymousIdentity, ItemNeed, Permission, RoleNeed
from werkzeug.utils import cached_property

from web.server.configuration.settings import get_configuration, PUBLIC_ACCESS_KEY

# TODO(vedant): We have to nuke this. This is a terrible idea.
# The id of the root site as defined in the database
ROOT_SITE_RESOURCE_ID = 1

# The name of the superuser role as defined in the database
SUPERUSER_ROLENAME = 'admin'

# A need that requires the current user to be a superuser
SUPERUSER_NEED = RoleNeed(SUPERUSER_ROLENAME)

# The default needs that will be part of a whitelist for ANY authorization
# check unless explicitly overriden in the class constructor.
#
# WARNING: Please understand the security ramifications of whitelisting
# a need before making changes to this attribute. You will be whitelisting
# this need across ALL authorization checks. This should not be necessary
# for ANY role except for the Site Administrator (superuser) role as all other
# permisisons can be granted on an individual basis.
DEFAULT_WHITELIST = {SUPERUSER_NEED}

PERMISSION_DEFAULTS = (
    # These are the permissions modelled in our system.
    # Per the documentation in Flask-Potion, this evaluates
    # to HybridItemNeed(method='view_resource', value=object_id, type=object_type)
    ('view_resource', 'view_resource'),
    ('create_resource', 'create_resource'),
    ('edit_resource', 'edit_resource'),
    ('delete_resource', 'delete_resource'),
    # These are the native permissions that Flask-Potion understands
    #
    # Potion requires us to define these methods otherwise
    # CRUD operations against the Potion APIs will not work.
    # We have these methods use the same set of permissions
    # modelled in our system.
    #
    # For all authorization checks other than the read operation,
    # we use signal_handlers defined in web.server.security.signal_handlers
    # to ensure that users are authorized to perform the specified
    # operation. There are no signals that we can hook into for the
    # read operation and as such, we need to define the specific
    # permission here.
    #
    # WARNING: Please understand the security ramifications of making changes
    # to this attribute. You will be updating the default CRUD permissions for
    # all Flask-Potion API routes. If you want to override the permissions for
    # an individual resource, you can do so by defining a `permissions` attribute
    # for the `Meta` subclass of an individual API model.
    #
    # See this documentation for more information:
    # 'http://potion.readthedocs.io/en/latest/permissions.html#permissions'
    ('read', 'view_resource'),
    ('create', 'yes'),
    ('update', 'yes'),
    ('delete', 'yes'),
)


class SuperUserPermission(Permission):
    def __init__(self):
        super(SuperUserPermission, self).__init__(SUPERUSER_NEED)


class WhitelistedPermission(Permission):
    '''
    A permission that enforces authorization checks except for those needs which are
    in the authorization whitelist.
    '''

    def __init__(self, specific_needs, whitelisted_needs=None):
        specific_needs = set(specific_needs)
        needs = augment_needs(specific_needs, whitelisted_needs)
        super(WhitelistedPermission, self).__init__(*needs)


class WhitelistedHybridPermission(HybridPermission):
    '''
    A permission that enforces authorization checks except for those needs which are
    in the authorization whitelist.
    '''

    def __init__(self, specific_needs, whitelisted_needs=None):
        specific_needs = set(specific_needs)
        needs = augment_needs(specific_needs, whitelisted_needs)
        super(WhitelistedHybridPermission, self).__init__(*needs)


class QueryPermission(WhitelistedPermission):
    '''
    A permission that enforces authorization checks on queryable data. Access is
    automatically granted to holders of needs which are in the authorization
    whitelist.

    Unlike the basic `WhitelistedPermission` class, this class is responsible for
    governing authorization access when needs may not be equal in a strict sense
    but the loaded identity's needs represent the logical superset of the needs
    actually required to execute the query.
    '''

    def allows(self, identity):
        '''Determines whether or not the identity provided has the authorization to perform the
        operation that this permission is enforcing access to. This method will still return true
        even if the identity does not have the identical needs defined in this permission provided
        that the needs that the identity does possess represent the logical superset of the ones
        that are required.

        Parameters
        ----------
        identity: flask_principal.Identity
            The Flask-Principal identity whose permissions are being checked.

        Returns
        -------
        bool
            `True` if the identity is authorized and `False` otherwise.
        '''

        if super(QueryPermission, self).allows(identity):
            # First see if the identity is authorized based on the result of the
            # parent alert call.
            return True
        else:
            permission_excludes = set()

            if self.excludes:
                permission_excludes = [
                    need for need in self.excludes if isinstance(need, QueryNeed)
                ]

            # Get a list of all the permission needs of type `QueryNeed`
            permission_needs = [
                need for need in self.needs if isinstance(need, QueryNeed)
            ]

            # Get a list of all the identity needs of type `QueryNeed`
            identity_needs = [
                need for need in identity.provides if isinstance(need, QueryNeed)
            ]

            for permission_exclude in permission_excludes:
                # First check excludes before checking needs
                for identity_need in identity_needs:
                    if permission_exclude in identity_need:
                        return False

            for permission_need in permission_needs:
                for identity_need in identity_needs:

                    # Determine if `permission_need` is an explicit subset of `identity_need`.
                    # i.e. Does the need held by the identity (`identity_need`) represent a
                    # logical superset of the need that the permission requires the identity
                    # holder to possess?

                    # For example (`permission_need`):
                    # filters = {
                    #    subrecipient: [ "Oasis Health Foundation" ]
                    # }
                    #
                    # Identity Possesses (`identity_need`):
                    # filters = {
                    #    subrecipient: [ "Oasis Health Foundation", "Madibha Hospital" ]
                    # }
                    #
                    # This authorization check should return true since `identity_need`
                    # is a superset of `permission_need`
                    if permission_need in identity_need:
                        return True

        return False


class QueryNeed(object):
    '''A need that defines access to queryable data in Druid.'''

    def __init__(self, dimension_filters):
        '''Creates a new instance of QueryNeed.

        Parameters
        ----------
        dimension_filters: iter
            An enumeration of `DimensionFilter` instances that represent which Dimensions
            (and values) the current user must possess in order to run a given query.
        '''
        dimension_filters = set(dimension_filters) if dimension_filters else set()
        self.dimension_to_filter_mapping = {}

        # First map all filters to their appropriate dimension
        for dimension_filter in dimension_filters:
            dimension_name = dimension_filter.dimension_name
            super_filter = self.dimension_to_filter_mapping.get(
                dimension_name, dimension_filter
            )
            super_filter = super_filter | dimension_filter
            self.dimension_to_filter_mapping[dimension_name] = super_filter

        self.dimension_filters = list(self.dimension_to_filter_mapping.values())

    def __contains__(self, other):
        return self._is_filter_superset_of(other)

    def __invert__(self):
        new_filters = [~_filter for _filter in self.dimension_filters]
        return QueryNeed(new_filters)

    def _is_filter_superset_of(self, other):
        self_dimensions = set(self.dimension_to_filter_mapping.keys())
        other_dimensions = set(other.dimension_to_filter_mapping.keys())

        # First make sure that the dimensions between this need and the other
        # need match. Otherwise, we can instantly conclude that the answer is no.
        if not self_dimensions.issuperset(other_dimensions):
            return False

        for dimension in other_dimensions:
            self_filter = self.dimension_to_filter_mapping[dimension]
            other_filter = other.dimension_to_filter_mapping[dimension]

            # Make sure that the values encompassed by the other filter are a superset
            # of the values encompassed in our filter for the same dimension
            if other_filter not in self_filter:
                return False

        return True

    def __eq__(self, other):
        self_type = type(self)
        other_type = type(other)

        if not (self_type is other_type or issubclass(other_type, self_type)):
            return False

        return self.dimension_to_filter_mapping == other.dimension_to_filter_mapping

    def __repr__(self):
        return '<QueryNeed filters=\'{}\'>'.format(self.dimension_filters)

    def __hash__(self):
        _hash = 0
        for _filter in self.dimension_filters:
            _hash += hash(_filter)
        return _hash

    def __len__(self):
        # HACK(vedant): Needed because Flask-Potion assumes that all Need instances have this
        # method implemented.
        return len(self.dimension_filters)


class DimensionFilter(object):
    def __init__(
        self, dimension_name, include_values=None, exclude_values=None, all_values=False
    ):

        if not dimension_name:
            raise ValueError('\'dimension_name\' is a required parameter.')

        self._dimension_name = None
        self._include_values = set()
        self._exclude_values = set()
        self._hash = 0
        self._all_values = False

        self.dimension_name = dimension_name

        if include_values:
            self.include_values = include_values

        if exclude_values:
            self.exclude_values = exclude_values

        if all_values:
            self.all_values = all_values

    @property
    def dimension_name(self):
        return self._dimension_name if hasattr(self, '_dimension_name') else None

    @dimension_name.setter
    def dimension_name(self, value):
        self._dimension_name = value
        self._update_hash()

    @property
    def include_values(self):
        return self._include_values

    @include_values.setter
    def include_values(self, value):
        if self.exclude_values or self.all_values:
            raise ValueError(
                'If \'all_values\' or \'exclude_values\' is set, a value \'include_values\' may'
                ' not be set.'
            )

        self._include_values = set(value) if value else set()
        self._update_hash()

    @property
    def exclude_values(self):
        return self._exclude_values

    @exclude_values.setter
    def exclude_values(self, value):
        if self.include_values:
            raise ValueError(
                'If \'include_values\' is set, a value for \'exclude_values\' may not be '
                'set.'
            )

        self._exclude_values = set(value) if value else set()
        self._update_hash()

    @property
    def all_values(self):
        return self._all_values

    @all_values.setter
    def all_values(self, value):
        if self.include_values:
            raise ValueError(
                'If \'include_values\' is set, a value for \'all_values\' may not be '
                'set.'
            )

        self._all_values = bool(value)
        self._update_hash()

    def __eq__(self, other):
        self_type = type(self)
        other_type = type(other)

        if not (self_type is other_type or issubclass(other_type, self_type)):
            return False

        if self.dimension_name != other.dimension_name:
            return False
        elif self.all_values != other.all_values:
            return False
        elif (
            self.include_values != other.include_values
            or self.exclude_values != other.exclude_values
        ):
            return False

        return True

    def __invert__(self):
        return DimensionFilter(
            self.dimension_name,
            include_values=self.exclude_values,
            exclude_values=self.include_values,
            all_values=not self.all_values,
        )

    def __and__(self, other):
        if self == other:
            return self

        if self.dimension_name != other.dimension_name:
            message = (
                'In order to AND two dimension filters, dimension_names must match. '
                'Dimension names were {this_name}, {other_name}.'
            ).format(this_name=self.dimension_name, other_name=other.dimension_name)
            raise ValueError(message)

        if self.all_values and other.all_values:
            all_exclude_values = self.exclude_values.intersection(other.exclude_values)
            return DimensionFilter(
                self.dimension_name,
                include_values=None,
                exclude_values=all_exclude_values,
                all_values=True,
            )
        else:
            if self.all_values:
                values = other.include_values
            elif other.all_values:
                values = self.include_values
            else:
                values = self.include_values.intersection(other.include_values)

            return DimensionFilter(self.dimension_name, values)

    def __or__(self, other):
        if self == other:
            return self

        if self.dimension_name != other.dimension_name:
            message = (
                'In order to OR two dimension filters, dimension_names must match. '
                'Dimension names were {this_name}, {other_name}.'
            ).format(this_name=self.dimension_name, other_name=other.dimension_name)
            raise ValueError(message)

        if self.all_values or other.all_values:
            all_exclude_values = self.exclude_values.union(other.exclude_values)
            return DimensionFilter(
                self.dimension_name,
                include_values=None,
                exclude_values=all_exclude_values,
                all_values=True,
            )
        else:
            all_include_values = self.include_values.union(other.include_values)
            return DimensionFilter(
                self.dimension_name, include_values=all_include_values
            )

    def __contains__(self, other):
        if self.dimension_name != other.dimension_name:
            return False

        is_exclude_subset = self.exclude_values.issubset(other.exclude_values)
        is_include_superset = self.include_values.issuperset(other.dimension_values)

        if self.all_values:
            # If self contains ALL values, then other is in self
            return is_exclude_subset
        elif other.all_values:
            # If other contains ALL values, then other is definitely NOT in self
            return False
        else:
            # If self.dimension_values is a subset of other.dimension_values,
            # Then other is definitely in self.
            return is_include_superset and is_exclude_subset

    def __repr__(self):
        include_values = '( all )' if self.all_values else self.include_values

        return '<{0} dimension_name={1} include_values={2} exclude_values={3}>'.format(
            self.__class__.__name__,
            self.dimension_name,
            include_values,
            self.exclude_values,
        )

    def __hash__(self):
        return self._hash

    def _update_hash(self):
        _hash = hash(self.dimension_name) + hash(self.all_values)

        for exclude_value in self.exclude_values:
            _hash += hash(exclude_value)

        if not self.all_values:
            for value in self.include_values:
                _hash += hash(value)

        self._hash = _hash


class ZenysisPrincipalMixin(PrincipalMixin):
    '''A mixin for use with Flask-Potion APIs that uses the Zenysis implementation of
    `WhitelistedHybridPermission` as the base permission type.
    '''

    # This mixin is used in place of the default PrincipalMixin in Flask-Potion BECAUSE
    # we want certain roles (e.g. the Site Administrator) to have guaranteed access to
    # every system API without explicitly granting those roles access. For that we use the
    # `WhitelistedPermission` and `WhitelistedHybridPermission` classes.

    def __init__(self, *args, **kwargs):
        super(ZenysisPrincipalMixin, self).__init__(*args, **kwargs)
        raw_needs = dict(PERMISSION_DEFAULTS)
        raw_needs.update(self.resource.meta.get('permissions', {}))
        self._raw_needs = raw_needs

    @cached_property
    def _permissions(self):
        permissions = {}

        for method, needs in list(self._needs.items()):
            if True in needs:
                needs = set()
            permissions[method] = WhitelistedHybridPermission(needs)

        # TODO(vedant) - We should just completely write our own PrincipalMixin
        # This is a workaround needed because the Default PrincipalMixin doesn't
        # correctly propagate the `view_resource` permissions to the built-in
        # `read` permission. As a result, users cannot view Potion-Resources unless
        # they are site-administrators since no other needs get whitelisted.
        permissions['read'] = permissions['view_resource']
        permissions['create'] = permissions['create_resource']
        permissions['update'] = permissions['edit_resource']
        permissions['delete'] = permissions['delete_resource']
        return permissions


def principals(manager):
    if not issubclass(manager, RelationalManager):
        raise RuntimeError(
            'principals() only works with managers that inherit from '
            'RelationalManager'
        )

    class PrincipalsManager(ZenysisPrincipalMixin, manager):
        pass

    return PrincipalsManager


def augment_needs(needs, whitelisted_needs=None):
    '''
    For a given tuple of ```Need``` instances, generates a tuple of
    needs that ensures that users with sitewide permissions or those
    in the permission whitelist can perform the specified operation(s)
    even if they do not have explicit authorization.

    Parameters
    ----------
    needs : tuple
        The existing needs

    whitelisted_needs (optional): tuple
        The needs that represent the permissions whitelist. By default,
        this value will be DEFAULT_WHITELIST unless an empty tuple value is
        specified.

    Returns
    -------
    tuple
        A tuple of the whitelisted needs, sitewide needs and the original needs
    '''

    whitelisted_needs = (
        whitelisted_needs if whitelisted_needs != None else DEFAULT_WHITELIST
    )
    sitewide_needs = generate_sitewide_needs(needs)
    augmented_needs = whitelisted_needs.union(sitewide_needs).union(needs)
    return augmented_needs


def generate_sitewide_needs(needs):
    '''
    For a given set of ```ItemNeed``` or ```HybridItemNeed``` instances,
    generates a tuple of needs that ensures that users with sitewide
    permissions on an object type can perform the specified operation(s)
    even if they do not have explicit authorization.

    Parameters
    ----------
    needs : tuple
        The existing needs

    Returns
    -------
    tuple
        A tuple of the sitewide needs for the given needs
    '''

    sitewide_needs = set()

    for need in needs:
        if isinstance(need, HybridItemNeed) or isinstance(need, ItemNeed):
            # The need is already a site-wide need.
            if need.type == 'site':
                continue

            permission = need.method
            resource_type = need.type
            sitewide_needs.add(ItemNeed(permission, None, resource_type))

    return sitewide_needs


def is_public_dashboard_user():
    '''Returns a boolean representing whether the current user is an
    unregistered dashboard user.
    '''
    return get_configuration(PUBLIC_ACCESS_KEY) and isinstance(
        g.identity, AnonymousIdentity
    )
