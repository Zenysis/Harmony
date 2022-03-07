// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import Group from 'components/ui/Group';
import InputText from 'components/ui/InputText';
import InviteUserBlock from 'components/AdminApp/InviteUserBlock';
import UserList from 'components/AdminApp/UsersTab/UserList';
import autobind from 'decorators/autobind';
import type AlertDefinition from 'models/AlertsApp/AlertDefinition';
import type DashboardMeta from 'models/core/Dashboard/DashboardMeta';
import type Resource from 'services/models/Resource';
import type RoleDefinition from 'services/models/RoleDefinition';
import type SecurityGroup from 'services/models/SecurityGroup';
import type User from 'services/models/User';

const TEXT = t('admin_app.UsersTab');

type Props = {
  alertDefinitions: $ReadOnlyArray<AlertDefinition>,
  alertResources: $ReadOnlyArray<Resource>,
  dashboards: $ReadOnlyArray<DashboardMeta>,
  groups: $ReadOnlyArray<SecurityGroup>,
  loadGroups: () => void,
  loadUsers: () => void,
  roleMemberCounts: {
    +[roleId: string]: number,
    ...,
  },
  roles: $ReadOnlyArray<RoleDefinition>,
  users: $ReadOnlyArray<User>,
};

type State = {
  userToGroups: Zen.Map<Zen.Array<SecurityGroup>>,
  searchText: string,
};

export default class UsersTab extends React.PureComponent<Props, State> {
  _searchInputRef: $ElementRefObject<
    typeof InputText.Uncontrolled,
  > = React.createRef();

  state: State = {
    userToGroups: Zen.Map.create(),
    searchText: '',
  };

  componentDidUpdate(prevProps: Props) {
    const { groups } = this.props;
    if (prevProps.groups !== groups) {
      const newMap = {};
      groups.forEach(group => {
        group.users().mapValues(user => {
          const username = user.username();
          const currArr = newMap[username] || Zen.Array.create();
          newMap[username] = currArr.push(group);
        });
      });
      this.setState({ userToGroups: Zen.Map.create(newMap) });
    }
  }

  @autobind
  onSearchTextChange(searchText: string) {
    this.setState({ searchText });
  }

  @autobind
  onUsersUpdated() {
    const { loadGroups, loadUsers } = this.props;
    loadGroups();
    loadUsers();
  }

  renderSearchBar(): React.Node {
    const { searchText } = this.state;
    return (
      <InputText.Uncontrolled
        debounce
        debounceTimeoutMs={300}
        icon="search"
        initialValue={searchText}
        onChange={this.onSearchTextChange}
        placeholder={TEXT.searchPlaceholder}
        ref={this._searchInputRef}
      />
    );
  }

  renderUserList(): React.Node {
    const { searchText, userToGroups } = this.state;
    const {
      alertDefinitions,
      alertResources,
      dashboards,
      groups,
      roleMemberCounts,
      roles,
      users,
    } = this.props;
    return (
      <UserList
        alertDefinitions={alertDefinitions}
        alertResources={alertResources}
        dashboards={dashboards}
        groups={groups}
        onUsersMutated={this.onUsersUpdated}
        roleMemberCounts={roleMemberCounts}
        roles={roles}
        searchText={searchText}
        users={Zen.Array.create(users)}
        userToGroups={userToGroups}
      />
    );
  }

  render(): React.Node {
    const { users } = this.props;
    return (
      <Group.Vertical spacing="m">
        <Group.Horizontal flex lastItemStyle={{ marginLeft: 'auto' }}>
          {this.renderSearchBar()}
          <InviteUserBlock
            allUsers={Zen.Array.create(users)}
            onRefreshUsers={this.onUsersUpdated}
          />
        </Group.Horizontal>
        {this.renderUserList()}
      </Group.Vertical>
    );
  }
}
