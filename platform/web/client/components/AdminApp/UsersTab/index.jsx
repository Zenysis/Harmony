// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import InputText from 'components/ui/InputText';
import InviteUserBlock from 'components/AdminApp/InviteUserBlock';
import UserList from 'components/AdminApp/UsersTab/UserList';
import type AlertDefinition from 'models/AlertsApp/AlertDefinition';
import type DashboardMeta from 'models/core/Dashboard/DashboardMeta';
import type Resource from 'services/models/Resource';
import type RoleDefinition from 'services/models/RoleDefinition';
import type SecurityGroup from 'services/models/SecurityGroup';
import type User from 'services/models/User';

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

export default function UsersTab({
  alertDefinitions,
  alertResources,
  dashboards,
  groups,
  loadGroups,
  loadUsers,
  roleMemberCounts,
  roles,
  users,
}: Props): React.Node {
  const [searchText, setSearchText] = React.useState<string>('');
  const [userToGroups, setUserToGroups] = React.useState<
    Zen.Map<Zen.Array<SecurityGroup>>,
  >(Zen.Map.create());

  React.useEffect(() => {
    const newMap = {};
    groups.forEach(group => {
      group.users().mapValues(user => {
        const username = user.username();
        const currArr = newMap[username] || Zen.Array.create();
        newMap[username] = currArr.push(group);
      });
    });

    setUserToGroups(Zen.Map.create(newMap));
  }, [groups]);

  const onUsersUpdated = () => {
    loadGroups();
    loadUsers();
  };

  const renderSearchBar = (): React.Node => {
    return (
      <InputText.Uncontrolled
        debounce
        debounceTimeoutMs={300}
        icon="search"
        initialValue={searchText}
        onChange={setSearchText}
        placeholder={I18N.text('Search for users')}
      />
    );
  };

  const renderUserList = (): React.Node => {
    return (
      <UserList
        alertDefinitions={alertDefinitions}
        alertResources={alertResources}
        dashboards={dashboards}
        groups={groups}
        onUsersMutated={onUsersUpdated}
        roleMemberCounts={roleMemberCounts}
        roles={roles}
        searchText={searchText}
        users={Zen.Array.create(users)}
        userToGroups={userToGroups}
      />
    );
  };

  return (
    <Group.Vertical spacing="m">
      <Group.Horizontal flex lastItemStyle={{ marginLeft: 'auto' }}>
        {renderSearchBar()}
        <InviteUserBlock
          allUsers={Zen.Array.create(users)}
          onRefreshUsers={onUsersUpdated}
        />
      </Group.Horizontal>
      {renderUserList()}
    </Group.Vertical>
  );
}
