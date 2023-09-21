class BaseUserMixin:
    def enumerate_permissions(self, transaction):
        '''For a given user, generates an enumeration of all the permissions that they have.'''
        # Public access case
        # pylint: disable=import-outside-toplevel
        from web.server.security.permissions import is_public_dashboard_user

        if is_public_dashboard_user():
            for need in self._build_sitewide_needs(transaction, False):
                yield need
            return

        # If the user is unauthenticated, then do not attempt to look up any additional permissions
        # as they do not have any in the system.
        if not self.is_authenticated:
            return

        # TODO - These will need to be cached at some point. They are constructed for each
        # request and with a large user-base and a large number of individual groups, re-building
        # this each time will introduce significant performance issues. For starters, we can employ
        # a really dumb cache and just store these in a dictionary in-memory in the current
        # application context.

        # Build out sitewide ACLs
        for need in self._build_sitewide_needs(transaction, True):
            yield need

        # Look through all roles that the user directly possesses
        for need in self._build_role_needs(self.roles):
            yield need

        # Go through User ACLs
        for user_acl in self.acls:
            for need in self._build_acl_needs(
                user_acl.resource_role.permissions, user_acl.resource
            ):
                yield need

        # Look through all roles that are possessed by the groups that the user is a member of
        for group in self.groups:
            for need in self._build_role_needs(group.roles):
                yield need

            # Go through Group ACLs
            for group_acl in group.acls:
                for need in self._build_acl_needs(
                    group_acl.resource_role.permissions, group_acl.resource
                ):
                    yield need


try:
    from models.alchemy.user.web_base_user import BaseWebUserMixin
except ImportError:
    pass
else:

    class BaseUserMixin(  # type: ignore[no-redef]
        BaseWebUserMixin, BaseUserMixin
    ):  # pylint: disable=function-redefined
        pass
