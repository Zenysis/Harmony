// @flow
import * as React from 'react';
import type Promise from 'bluebird';

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
import SecurityGroup from 'services/models/SecurityGroup';
import Toaster from 'components/ui/Toaster';
import autobind from 'decorators/autobind';
import {
  RESOURCE_ROLE_MAP,
  RESOURCE_TYPES,
  SITE_PERMISSIONS,
} from 'services/AuthorizationService/registry';
import type IdentityRoleMap from 'services/models/IdentityRoleMap';
import type User from 'services/models/User';

const TEXT = t('dashboard_builder.dashboard_settings');

type DefaultProps = {
  allResourceRoles: $ReadOnlyArray<string>,
  defaultNewUserRole: string,
  checkIsAdmin: () => Promise<boolean>,
  newResourceRole: string,
};

type Props = {
  ...DefaultProps,
  authorizationResource: AuthorizationResource,
  dashboard: Dashboard,
  isActiveTab: boolean,
  onPermissionsChanged: AuthorizationResource => void,
};

type State = {
  allGroups: $ReadOnlyArray<SecurityGroup>,
  allUsers: Zen.Array<User>,
  fetchedGroups: boolean,
  fetchedUsers: boolean,
  isAdmin: boolean,
  publicAccessEnabled: boolean,
  showPublicAccessConfirmationModal: boolean,
};

const { DASHBOARD_VIEWER } = RESOURCE_ROLE_MAP;
export default class UserManagementTab extends React.PureComponent<
  Props,
  State,
> {
  static defaultProps: DefaultProps = {
    // HACK(toshi): Incredibly bad code, and everything that this prop touches.
    // This was done because this whole User / Group Management tab needs to get
    // rewritten and it is quite hefty.
    allResourceRoles: [
      'dashboard_viewer',
      'dashboard_admin',
      'dashboard_editor',
    ],
    defaultNewUserRole: 'dashboard_viewer',
    checkIsAdmin: () =>
      AuthorizationService.isAuthorized(
        SITE_PERMISSIONS.VIEW_ADMIN_PAGE,
        RESOURCE_TYPES.SITE,
      ),
    newResourceRole: DASHBOARD_VIEWER,
  };

  state: State = {
    allGroups: [],
    allUsers: Zen.Array.create<User>(),
    fetchedGroups: false,
    fetchedUsers: false,
    isAdmin: false,
    publicAccessEnabled: false,
    showPublicAccessConfirmationModal: false,
  };

  componentDidMount() {
    if (this.props.isActiveTab) {
      this.initializeData();
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (!prevProps.isActiveTab && this.props.isActiveTab) {
      this.initializeData();
    }
  }

  initializeData() {
    this.initializeUsers();
    this.initializeGroups();
    this.checkIfAdmin();

    ConfigurationService.getConfiguration(CONFIGURATION_KEY.PUBLIC_ACCESS).then(
      setting => {
        this.setState({ publicAccessEnabled: setting.value() });
      },
    );
  }

  initializeUsers() {
    DirectoryService.getUsers()
      .then(users => {
        this.setState({
          allUsers: Zen.Array.create(users),
          fetchedUsers: true,
        });
      })
      .error(e => {
        Toaster.error(TEXT.fetch_users_fail);
        console.error(e);
      });
  }

  initializeGroups() {
    DirectoryService.getGroups()
      .then(groups => {
        this.setState({
          allGroups: groups,
          fetchedGroups: true,
        });
      })
      .error(e => {
        Toaster.error(TEXT.fetch_groups_fail);
        console.error(e);
      });
  }

  checkIfAdmin() {
    this.props.checkIsAdmin().then(isAdmin => {
      this.setState({ isAdmin });
    });
  }

  getNewResourceRole(isRole: boolean): string {
    return isRole ? this.props.newResourceRole : '';
  }

  @autobind
  onGroupRolesUpdated(groupToRoles: IdentityRoleMap) {
    const { authorizationResource } = this.props;
    const updatedResource = authorizationResource
      .deepUpdate()
      .roles()
      .securityGroupRoles(groupToRoles);
    this.props.onPermissionsChanged(updatedResource);
  }

  @autobind
  onUserRolesUpdated(userToRoles: IdentityRoleMap) {
    const { authorizationResource } = this.props;
    const updatedResource = authorizationResource
      .deepUpdate()
      .roles()
      .userRoles(userToRoles);
    this.props.onPermissionsChanged(updatedResource);
  }

  @autobind
  onRegisteredUserViewClick(newValue: boolean) {
    const { authorizationResource, dashboard } = this.props;
    const sitewideAcl = authorizationResource.roles().sitewideResourceAcl();
    const { unregisteredResourceRole } = sitewideAcl;
    const newSitewideAcl = {
      unregisteredResourceRole,
      registeredResourceRole: this.getNewResourceRole(newValue),
    };
    const updatedResource = authorizationResource
      .deepUpdate()
      .roles()
      .sitewideResourceAcl(newSitewideAcl);

    this.props.onPermissionsChanged(updatedResource);
    window.analytics.track(
      'Dashboard public access for registered users triggered',
      {
        isEnabled: newValue,
        dashboardLink: window.location.href,
        dashboardTitle: dashboard.title(),
      },
    );
  }

  @autobind
  onPublicAccessValueChanged(newValue: boolean) {
    const { authorizationResource, dashboard } = this.props;
    const sitewideAcl = this.props.authorizationResource
      .roles()
      .sitewideResourceAcl();
    const { registeredResourceRole } = sitewideAcl;
    const newSitewideAcl = {
      registeredResourceRole,
      unregisteredResourceRole: this.getNewResourceRole(newValue),
    };
    const updatedResource = authorizationResource
      .deepUpdate()
      .roles()
      .sitewideResourceAcl(newSitewideAcl);

    this.props.onPermissionsChanged(updatedResource);
    window.analytics.track(
      'Dashboard public access for unregistered users triggered',
      {
        isEnabled: newValue,
        dashboardLink: window.location.href,
        dashboardTitle: dashboard.title(),
      },
    );
  }

  @autobind
  onConfirmGrantPublicAccess() {
    this.setState({ showPublicAccessConfirmationModal: false });
    this.onPublicAccessValueChanged(true);
  }

  @autobind
  onCancelGrantPublicAccess() {
    this.setState({ showPublicAccessConfirmationModal: false });
  }

  @autobind
  onPublicAccessCheckboxClick(newValue: boolean) {
    if (newValue) {
      this.setState({ showPublicAccessConfirmationModal: true });
    } else {
      this.onPublicAccessValueChanged(false);
    }
  }

  maybeRenderPublicAccessConfirmationModal(): React.Node {
    return (
      <DestructiveActionModal
        onActionAcknowledged={this.onConfirmGrantPublicAccess}
        onActionCancelled={this.onCancelGrantPublicAccess}
        show={this.state.showPublicAccessConfirmationModal}
        warningText={TEXT.users_tab.public_access_warning}
      />
    );
  }

  maybeRenderPublicAccessControls(): React.Node {
    const { isAdmin, publicAccessEnabled } = this.state;

    if (!isAdmin || !publicAccessEnabled) {
      return null;
    }

    const sitewideAcl = this.props.authorizationResource
      .roles()
      .sitewideResourceAcl();
    const isApplyToUnregistered = sitewideAcl.unregisteredResourceRole !== '';

    return (
      <Group.Vertical spacing="m">
        <Heading.Small underlined>
          {TEXT.users_tab.public_access_title}
        </Heading.Small>
        <Checkbox
          id="unregistered-users-viewer"
          onChange={this.onPublicAccessCheckboxClick}
          value={isApplyToUnregistered}
          label={TEXT.users_tab.unregistered_users_checkbox_text}
          labelPlacement="right"
        />
      </Group.Vertical>
    );
  }

  renderDashboardUsersTable(): React.Node {
    const { allResourceRoles, defaultNewUserRole } = this.props;
    const { allGroups, allUsers, fetchedGroups, fetchedUsers } = this.state;
    const roles = this.props.authorizationResource.roles();
    const userRoles = roles.userRoles();
    const groupRoles = roles.securityGroupRoles();

    return (
      <DashboardUsersTable
        fetchedGroups={fetchedGroups}
        fetchedUsers={fetchedUsers}
        groups={allGroups}
        users={allUsers}
        roles={allResourceRoles}
        userToRoles={userRoles}
        groupToRoles={groupRoles}
        onGroupRolesUpdated={this.onGroupRolesUpdated}
        onUserRolesUpdated={this.onUserRolesUpdated}
        newUserRole={defaultNewUserRole}
      />
    );
  }

  renderDashboardUsersSection(): React.Node {
    const sitewideAcl = this.props.authorizationResource
      .roles()
      .sitewideResourceAcl();
    const isApplyToRegistered = sitewideAcl.registeredResourceRole !== '';

    return (
      <Group.Vertical spacing="m">
        <Heading.Small underlined>{TEXT.users_tab.title}</Heading.Small>
        {this.renderDashboardUsersTable()}
        <Checkbox
          id="registered-users-viewer"
          value={isApplyToRegistered}
          onChange={this.onRegisteredUserViewClick}
          label={TEXT.users_tab.registered_users_checkbox_text}
          labelPlacement="right"
        />
      </Group.Vertical>
    );
  }

  render(): React.Node {
    if (!this.props.isActiveTab) {
      return null;
    }

    return (
      <Group.Vertical spacing="l">
        <AlertMessage type={ALERT_TYPE.INFO}>
          {TEXT.users_tab.additional_users}
        </AlertMessage>
        {this.renderDashboardUsersSection()}
        {this.maybeRenderPublicAccessControls()}
        {this.maybeRenderPublicAccessConfirmationModal()}
      </Group.Vertical>
    );
  }
}
