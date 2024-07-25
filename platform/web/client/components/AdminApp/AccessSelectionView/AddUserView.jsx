// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import BaseAccessSelectionView from 'components/AdminApp/AccessSelectionView/BaseAccessSelectionView';
import Checkbox from 'components/ui/Checkbox';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import InteractivePill from 'components/AdminApp/InteractivePill';
import Table from 'components/ui/Table';
import {
  mergeData,
  searchRoles,
  searchGroups,
} from 'components/AdminApp/UsersTab/UserList';
import type SecurityGroup from 'services/models/SecurityGroup';
import type User from 'services/models/User';

type Props = {
  allGroups: $ReadOnlyArray<SecurityGroup>,
  enabledUsernames: $ReadOnlyArray<string>,
  onClickSave: (users: $ReadOnlyArray<User>) => void,
  onRequestClose: () => void,
  show: boolean,
  users: $ReadOnlyArray<User>,
};

const HEADERS = [
  { displayContent: '', id: 'Checkbox' },
  {
    displayContent: I18N.textById('Name'),
    id: 'name',
    searchable: obj => obj.user.getUserFullName(),
    sortFn: Table.Sort.string(obj => obj.user.getUserFullName()),
  },
  {
    displayContent: I18N.textById('Email'),
    id: 'email',
    searchable: obj => obj.user.username(),
    sortFn: Table.Sort.string(obj => obj.user.username()),
  },
  {
    displayContent: I18N.text('Status'),
    id: 'status',
    searchable: obj => obj.user.status(),
    sortFn: Table.Sort.string(obj => obj.user.status()),
  },
  {
    displayContent: I18N.text('Roles'),
    id: 'roles',
    searchable: searchRoles,
  },
  {
    displayContent: I18N.textById('Groups'),
    id: 'groups',
    searchable: searchGroups,
  },
];

export default function AddUserView({
  allGroups,
  enabledUsernames,
  onClickSave,
  onRequestClose,
  show,
  users,
}: Props): React.Element<typeof BaseAccessSelectionView> {
  const [selectedUsers, setSelectedUsers] = React.useState<
    $ReadOnlyArray<User>,
  >([]);
  const [selectedUsersMap, setSelectedUsersMap] = React.useState(
    Zen.Map.create<boolean>(),
  );
  const [checkAllUsers, setCheckAllUsers] = React.useState<boolean>(false);
  const [userToGroups, setUserToGroups] = React.useState(
    Zen.Map.create<Zen.Array<SecurityGroup>>({}),
  );

  // Creates a selected users map and a mapping between user to its respective
  // groups.
  React.useEffect(() => {
    setSelectedUsersMap(
      users.reduce(
        (map, user) =>
          map.set(user.username(), enabledUsernames.includes(user.username())),
        Zen.Map.create(),
      ),
    );
    setSelectedUsers(
      users.filter(user => enabledUsernames.includes(user.username())),
    );
    const newMap = {};
    if (allGroups !== undefined) {
      allGroups.forEach(group => {
        group.users().mapValues(user => {
          const username = user.username();
          const currArr = newMap[username] || Zen.Array.create();
          newMap[username] = currArr.push(group);
        });
      });
    }
    setUserToGroups(Zen.Map.create(newMap));
  }, [enabledUsernames, allGroups, users]);

  const onPrimaryAction = () => {
    onClickSave(selectedUsers);
    onRequestClose();
  };

  const onSelectCheckAllUsers = isSelected => {
    setSelectedUsers(isSelected ? users : []);
    setSelectedUsersMap(prevSelectedUsersMap =>
      prevSelectedUsersMap.map(() => isSelected),
    );
    setCheckAllUsers(isSelected);
  };

  const toggleCheckBox = (isSelected, user) => {
    setSelectedUsers(prevSelectedUsers =>
      isSelected
        ? [...prevSelectedUsers, user]
        : selectedUsers.filter(u => u.username() !== user.username()),
    );
    setSelectedUsersMap(prevSelectedUsersMap =>
      prevSelectedUsersMap.set(user.username(), isSelected),
    );
  };

  const renderTableRow = userWithGroups => {
    const { groups, user } = userWithGroups;
    const rolePills = user.roles().mapValues((role, index) => (
      <div key={index}>
        <InteractivePill pillType="role" role={role} />
      </div>
    ));
    const groupPills = groups.mapValues((group, index) => (
      <InteractivePill key={index} group={group} pillType="group" />
    ));
    return (
      <Table.Row id={user.username()}>
        <Table.Cell>
          <Checkbox
            className="access-selection-view__checkbox"
            onChange={isSelected => toggleCheckBox(isSelected, user)}
            value={selectedUsersMap.get(user.username()) || false}
          />
        </Table.Cell>
        <Table.Cell>{user.getUserFullName()}</Table.Cell>
        <Table.Cell>{user.username()}</Table.Cell>
        <Table.Cell>{user.status()}</Table.Cell>
        <Table.Cell>
          <Group.Vertical spacing="xxs">{rolePills}</Group.Vertical>
        </Table.Cell>
        <Table.Cell>
          <Group.Vertical spacing="xxs">{groupPills}</Group.Vertical>
        </Table.Cell>
      </Table.Row>
    );
  };

  const tableData = React.useMemo(
    () => mergeData(Zen.Array.create(users), userToGroups),
    [users, userToGroups],
  );

  return (
    <BaseAccessSelectionView
      checkAllValue={checkAllUsers}
      initialColumnToSort="name"
      onCheckAllChange={onSelectCheckAllUsers}
      onPrimaryAction={onPrimaryAction}
      onRequestClose={onRequestClose}
      renderTableRow={renderTableRow}
      sectionDescription={I18N.text(
        'User will gain access to all associated tools, data access & system access',
      )}
      sectionHeading={I18N.text('Add Users')}
      showModal={show}
      tableData={tableData}
      tableHeaders={HEADERS}
    />
  );
}
