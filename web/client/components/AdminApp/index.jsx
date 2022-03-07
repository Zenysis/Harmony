// @flow
import * as React from 'react';
import ReactDOM from 'react-dom';
import invariant from 'invariant';
import { RelayEnvironmentProvider } from 'react-relay/hooks';

import AlertsService from 'services/AlertsService';
import AuthorizationService from 'services/AuthorizationService';
import ConfigurationTab from 'components/AdminApp/ConfigurationTab';
import DashboardService from 'services/DashboardBuilderApp/DashboardService';
import DirectoryService from 'services/DirectoryService';
import GroupsTab from 'components/AdminApp/GroupsTab';
import I18N from 'lib/I18N';
import RoleManagementTab from 'components/AdminApp/RoleManagementTab';
import Tab from 'components/ui/Tabs/Tab';
import TabHeader from 'components/ui/Tabs/internal/TabHeader';
import Tabs from 'components/ui/Tabs';
import Toaster from 'components/ui/Toaster';
import UsersTab from 'components/AdminApp/UsersTab';
import { IMMUTABLE_ROLES } from 'services/models/RoleDefinition';
import { RESOURCE_TYPES } from 'services/AuthorizationService/registry';
import { autobind } from 'decorators';
import { environment } from 'util/graphql';
import type AlertDefinition from 'models/AlertsApp/AlertDefinition';
import type DashboardMeta from 'models/core/Dashboard/DashboardMeta';
import type Resource from 'services/models/Resource';
import type RoleDefinition from 'services/models/RoleDefinition';
import type SecurityGroup from 'services/models/SecurityGroup';
import type User from 'services/models/User';

const TAB_NAMES = {
  CONFIG_TAB: 'siteConfiguration',
  GROUPS_TAB: 'groups',
  ROLE_MANAGEMENT_TAB: 'roleManagement',
  USERS_TAB: 'users',
};

const TAB_TITLES = {
  [TAB_NAMES.USERS_TAB]: I18N.text('Users'),
  [TAB_NAMES.CONFIG_TAB]: I18N.text('Site Configuration'),
  [TAB_NAMES.GROUPS_TAB]: I18N.text('Groups'),
  [TAB_NAMES.ROLE_MANAGEMENT_TAB]: I18N.text('Role Management'),
};

const DEFAULT_TAB_NAME = TAB_NAMES.USERS_TAB;

function updateURIHashTab(tabName: string) {
  window.location.hash = tabName;
}

type State = {
  activeTab: string,
  alertDefinitions: $ReadOnlyArray<AlertDefinition>,
  alertResources: $ReadOnlyArray<Resource>,
  dashboards: $ReadOnlyArray<DashboardMeta>,
  groups: $ReadOnlyArray<SecurityGroup>,
  groupsLoaded: boolean,
  roleMemberCounts: {
    +[roleId: string]: number,
    ...,
  },
  roles: $ReadOnlyArray<RoleDefinition>,
  users: $ReadOnlyArray<User>,
};

type Props = {};

export default class AdminApp extends React.PureComponent<Props, State> {
  state: State = {
    activeTab: DEFAULT_TAB_NAME,
    alertDefinitions: [],
    alertResources: [],
    dashboards: [],
    groups: [],
    groupsLoaded: false,
    roleMemberCounts: {},
    roles: [],
    users: [],
  };

  static renderToDOM(elementId?: string = 'app') {
    const element: ?HTMLElement = document.getElementById(elementId);
    invariant(element, `Element ID does not exist: ${elementId}`);
    ReactDOM.render(<AdminApp />, element);
  }

  componentDidMount() {
    this.updatedSelectedTabFromUrl();
    this.loadData();
  }

  @autobind
  loadData() {
    this.loadAlertDefinitions();
    this.loadAlertResources();
    this.loadDashboards();
    this.loadGroups();
    this.loadRoleMemberCounts();
    this.loadRoles();
    this.loadUsers();
  }

  @autobind
  loadAlertDefinitions() {
    AlertsService.getAlertDefinitions().then(alertDefinitions =>
      this.setState({ alertDefinitions }),
    );
  }

  @autobind
  loadAlertResources() {
    AuthorizationService.getResources(
      RESOURCE_TYPES.ALERT,
    ).then(alertResources => this.setState({ alertResources }));
  }

  @autobind
  loadDashboards() {
    DashboardService.getDashboards().then(dashboards =>
      this.setState({ dashboards }),
    );
  }

  @autobind
  loadGroups() {
    DirectoryService.getGroups().then(groups =>
      this.setState({
        groups: groups
          .concat()
          .sort((a, b) =>
            a.name().toUpperCase() < b.name().toUpperCase() ? -1 : 1,
          ),
        groupsLoaded: true,
      }),
    );
  }

  @autobind
  loadRoleMemberCounts() {
    AuthorizationService.getRoleToNumUsersObj().then(roleMemberCounts =>
      this.setState({ roleMemberCounts }),
    );
  }

  @autobind
  loadRoles() {
    AuthorizationService.getRoles().then(roles =>
      this.setState(() => {
        const immutableFirstSortedRoles = roles.concat().sort((a, b) => {
          if (
            IMMUTABLE_ROLES.includes(a.name()) &&
            !IMMUTABLE_ROLES.includes(b.name())
          ) {
            return -1;
          }
          if (
            IMMUTABLE_ROLES.includes(b.name()) &&
            !IMMUTABLE_ROLES.includes(a.name())
          ) {
            return 1;
          }
          return a.label().toUpperCase() < b.label().toUpperCase() ? -1 : 1;
        });
        return { roles: immutableFirstSortedRoles };
      }),
    );
  }

  @autobind
  loadUsers() {
    DirectoryService.getUsers().then(users => this.setState({ users }));
  }

  @autobind
  updatedSelectedTabFromUrl() {
    const selectedTab = window.location.hash.split('#')[1];
    const validTabNames = Object.values(TAB_NAMES);

    if (selectedTab && validTabNames.includes(selectedTab)) {
      if (this.state.activeTab !== selectedTab) {
        analytics.track('Admin Tab Changed from URL', {
          selectedTabName: selectedTab,
        });
      }
      this.updateActiveTab(selectedTab);
    } else {
      if (selectedTab) {
        Toaster.warning(
          I18N.text(
            'Invalid URL tab name. Defaulting to users tab.',
            'invalid-url',
          ),
        );
      }
      this.updateActiveTab(DEFAULT_TAB_NAME);
    }
  }

  @autobind
  updateActiveTab(activeTab: string) {
    updateURIHashTab(activeTab);
    this.setState({ activeTab });
  }

  renderTabHeader(
    name: string,
    onClick: () => void,
    isActive: boolean,
  ): React.Element<typeof TabHeader> {
    return (
      <TabHeader
        key={name}
        isActive={isActive}
        marginRight={50}
        name={TAB_TITLES[name]}
        onTabClick={onClick}
        testId={`${name}-tab`}
        useLightWeightHeading={false}
      />
    );
  }

  renderGroupsTab(): React.Element<typeof Tab> {
    const {
      alertDefinitions,
      alertResources,
      dashboards,
      groups,
      groupsLoaded,
      roleMemberCounts,
      roles,
      users,
    } = this.state;
    return (
      <Tab name={TAB_NAMES.GROUPS_TAB}>
        <GroupsTab
          alertDefinitions={alertDefinitions}
          alertResources={alertResources}
          dashboards={dashboards}
          groups={groups}
          groupsLoaded={groupsLoaded}
          loadGroups={this.loadGroups}
          roleMemberCounts={roleMemberCounts}
          roles={roles}
          users={users}
        />
      </Tab>
    );
  }

  renderUsersTab(): React.Element<typeof Tab> {
    const {
      alertDefinitions,
      alertResources,
      dashboards,
      groups,
      roleMemberCounts,
      roles,
      users,
    } = this.state;
    const filteredUsers = users.filter(
      user => !window.__JSON_FROM_BACKEND.botUsers.includes(user.username()),
    );
    return (
      <Tab name={TAB_NAMES.USERS_TAB}>
        <UsersTab
          alertDefinitions={alertDefinitions}
          alertResources={alertResources}
          dashboards={dashboards}
          groups={groups}
          loadGroups={this.loadGroups}
          loadUsers={this.loadUsers}
          roleMemberCounts={roleMemberCounts}
          roles={roles}
          users={filteredUsers}
        />
      </Tab>
    );
  }

  renderConfigurationTab(): React.Element<typeof Tab> {
    return (
      <Tab className="admin-app__tab" name={TAB_NAMES.CONFIG_TAB}>
        <ConfigurationTab />
      </Tab>
    );
  }

  renderRoleManagementTab(): React.Element<typeof Tab> {
    const { groups, roles, users } = this.state;
    return (
      <Tab name={TAB_NAMES.ROLE_MANAGEMENT_TAB}>
        <RoleManagementTab
          groups={groups}
          loadRoles={this.loadRoles}
          loadUsers={this.loadUsers}
          roles={roles}
          users={users}
        />
      </Tab>
    );
  }

  render(): React.Node {
    const { activeTab } = this.state;
    return (
      <RelayEnvironmentProvider environment={environment}>
        <div className="admin-app" data-testid="admin-page">
          <Tabs.Controlled
            onTabChange={this.updateActiveTab}
            renderHeader={this.renderTabHeader}
            selectedTab={activeTab}
          >
            {this.renderUsersTab()}
            {this.renderGroupsTab()}
            {this.renderRoleManagementTab()}
            {this.renderConfigurationTab()}
          </Tabs.Controlled>
        </div>
      </RelayEnvironmentProvider>
    );
  }
}
