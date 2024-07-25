// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import AlertMessage, { ALERT_TYPE } from 'components/common/AlertMessage';
import AuthorizationResource from 'services/models/AuthorizationResource';
import AuthorizationService from 'services/AuthorizationService';
import Checkbox from 'components/ui/Checkbox/index';
import ConfigurationService, {
  CONFIGURATION_KEY,
} from 'services/ConfigurationService';
import Dashboard from 'models/core/Dashboard';
import DashboardUsersTable from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardSettingsModal/DashboardUsersTable';
import DestructiveActionModal from 'components/common/DestructiveActionModal';
import DirectoryService from 'services/DirectoryService';
import Group from 'components/ui/Group/';
import Heading from 'components/ui/Heading';
import I18N from 'lib/I18N';
import SecurityGroup from 'services/models/SecurityGroup';
import Toaster from 'components/ui/Toaster';
import {
  RESOURCE_ROLE_MAP,
  RESOURCE_TYPES,
  SITE_PERMISSIONS,
} from 'services/AuthorizationService/registry';
import type IdentityRoleMap from 'services/models/IdentityRoleMap';
import type User from 'services/models/User';

type Props = {
  authorizationResource: AuthorizationResource,
  dashboard: Dashboard,
  defaultNewUserRole?: string,
  isActiveTab: boolean,
  newResourceRole?: string,
  onPermissionsChanged: AuthorizationResource => void,
};

const { DASHBOARD_VIEWER } = RESOURCE_ROLE_MAP;
export default function UserManagementTab({
  authorizationResource,
  dashboard,
  isActiveTab,
  onPermissionsChanged,
  defaultNewUserRole = 'dashboard_viewer',
  newResourceRole = DASHBOARD_VIEWER,
}: Props): React.Node {
  const { useState } = React;
  const [allGroups, setAllGroups] = useState<$ReadOnlyArray<SecurityGroup>>([]);
  const [allUsers, setAllUsers] = useState<Zen.Array<User>>(
    Zen.Array.create<User>(),
  );
  const [fetchedGroups, setFetchedGroups] = useState<boolean>(false);
  const [fetchedUsers, setFetchedUsers] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [publicAccessEnabled, setPublicAccessEnabled] = useState<boolean>(
    false,
  );
  const [
    showPublicAccessConfirmationModal,
    setShowPublicAccessConfirmationModal,
  ] = useState<boolean>(false);

  const initializeUsers = () => {
    DirectoryService.getUsers()
      .then(users => {
        setAllUsers(Zen.Array.create(users));
        setFetchedUsers(true);
      })
      .error(e => {
        Toaster.error(
          I18N.text(
            'Failed to fetch the list of users. Additional details were written to the console. ',
            'FetchUsersFail',
          ),
        );
        console.error(e);
      });
  };

  const initializeGroups = () => {
    DirectoryService.getGroups()
      .then(groups => {
        setAllGroups(groups);
        setFetchedGroups(true);
      })
      .error(e => {
        Toaster.error(
          I18N.text(
            'Failed to fetch the list of groups. Additional details were written to the console. ',
            'FetchGroupsFail',
          ),
        );
        console.error(e);
      });
  };

  const checkIsAdmin = () =>
    AuthorizationService.isAuthorized(
      SITE_PERMISSIONS.VIEW_ADMIN_PAGE,
      RESOURCE_TYPES.SITE,
    );

  React.useEffect(() => {
    if (isActiveTab) {
      initializeUsers();
      initializeGroups();
      checkIsAdmin().then(isNowAdmin => {
        setIsAdmin(isNowAdmin);
      });

      ConfigurationService.getConfiguration(
        CONFIGURATION_KEY.PUBLIC_ACCESS,
      ).then(setting => {
        setPublicAccessEnabled(setting.value());
      });
    }
  }, [isActiveTab]);

  const getNewResourceRole = (isRole: boolean): string => {
    return isRole ? newResourceRole : '';
  };

  const onGroupRolesUpdated = (groupToRoles: IdentityRoleMap) => {
    const updatedResource = authorizationResource
      .deepUpdate()
      .roles()
      .securityGroupRoles(groupToRoles);
    onPermissionsChanged(updatedResource);
  };

  const onUserRolesUpdated = (userToRoles: IdentityRoleMap) => {
    const updatedResource = authorizationResource
      .deepUpdate()
      .roles()
      .userRoles(userToRoles);
    onPermissionsChanged(updatedResource);
  };

  const onRegisteredUserViewClick = (newValue: boolean) => {
    const sitewideAcl = authorizationResource.roles().sitewideResourceAcl();
    const { unregisteredResourceRole } = sitewideAcl;
    const newSitewideAcl = {
      unregisteredResourceRole,
      registeredResourceRole: getNewResourceRole(newValue),
    };
    const updatedResource = authorizationResource
      .deepUpdate()
      .roles()
      .sitewideResourceAcl(newSitewideAcl);

    onPermissionsChanged(updatedResource);
  };

  const onPublicAccessValueChanged = (newValue: boolean) => {
    const sitewideAcl = authorizationResource.roles().sitewideResourceAcl();
    const { registeredResourceRole } = sitewideAcl;
    const newSitewideAcl = {
      registeredResourceRole,
      unregisteredResourceRole: getNewResourceRole(newValue),
    };
    const updatedResource = authorizationResource
      .deepUpdate()
      .roles()
      .sitewideResourceAcl(newSitewideAcl);

    onPermissionsChanged(updatedResource);
  };

  const onConfirmGrantPublicAccess = () => {
    setShowPublicAccessConfirmationModal(false);
    onPublicAccessValueChanged(true);
  };

  const onCancelGrantPublicAccess = () => {
    setShowPublicAccessConfirmationModal(false);
  };

  const onPublicAccessCheckboxClick = (newValue: boolean) => {
    if (newValue) {
      setShowPublicAccessConfirmationModal(true);
    } else {
      onPublicAccessValueChanged(false);
    }
  };

  const maybeRenderPublicAccessConfirmationModal = (): React.Node => {
    return (
      <DestructiveActionModal
        onActionAcknowledged={onConfirmGrantPublicAccess}
        onActionCancelled={onCancelGrantPublicAccess}
        show={showPublicAccessConfirmationModal}
        warningText={I18N.text(
          'By checking this box, you will allow unregistered users to access and view all the data on this dashboard.',
          'usersTabPublicAccessWarning',
        )}
      />
    );
  };

  const maybeRenderPublicAccessControls = (): React.Node => {
    if (!isAdmin || !publicAccessEnabled) {
      return null;
    }

    const sitewideAcl = authorizationResource.roles().sitewideResourceAcl();
    const isApplyToUnregistered = sitewideAcl.unregisteredResourceRole !== '';

    return (
      <Group.Vertical spacing="m">
        <Heading.Small underlined>
          <I18N.Ref id="Public Access" />
        </Heading.Small>
        <Checkbox
          id="unregistered-users-viewer"
          label={I18N.text(
            'Enable Dashboard Viewer access for all unregistered users',
            'unregisteredUsersCheckboxText',
          )}
          labelPlacement="right"
          onChange={onPublicAccessCheckboxClick}
          value={isApplyToUnregistered}
        />
      </Group.Vertical>
    );
  };

  const renderDashboardUsersTable = (): React.Node => {
    const roles = authorizationResource.roles();
    const userRoles = roles.userRoles();
    const groupRoles = roles.securityGroupRoles();

    return (
      <DashboardUsersTable
        fetchedGroups={fetchedGroups}
        fetchedUsers={fetchedUsers}
        groups={allGroups}
        groupToRoles={groupRoles}
        newUserRole={defaultNewUserRole}
        onGroupRolesUpdated={onGroupRolesUpdated}
        onUserRolesUpdated={onUserRolesUpdated}
        users={allUsers}
        userToRoles={userRoles}
      />
    );
  };

  const renderDashboardUsersSection = (): React.Node => {
    const sitewideAcl = authorizationResource.roles().sitewideResourceAcl();
    const isApplyToRegistered = sitewideAcl.registeredResourceRole !== '';

    return (
      <Group.Vertical spacing="m">
        <Heading.Small underlined>
          <I18N.Ref id="Dashboard Users" />
        </Heading.Small>
        {renderDashboardUsersTable()}
        <Checkbox
          id="registered-users-viewer"
          label={I18N.text(
            'Enable Dashboard Viewer access for all registered users',
            'registeredUsersCheckboxText',
          )}
          labelPlacement="right"
          onChange={onRegisteredUserViewClick}
          value={isApplyToRegistered}
        />
      </Group.Vertical>
    );
  };

  if (!isActiveTab) {
    return null;
  }

  return (
    <Group.Vertical spacing="l">
      <AlertMessage type={ALERT_TYPE.INFO}>
        <I18N id="usersTabAdditionalUsers">
          Users with sitewide viewer/editor/administrator permissions also have
          access to this Dashboard regardless of what permissions are set here.
        </I18N>
      </AlertMessage>
      {renderDashboardUsersSection()}
      {maybeRenderPublicAccessControls()}
      {maybeRenderPublicAccessConfirmationModal()}
    </Group.Vertical>
  );
}
