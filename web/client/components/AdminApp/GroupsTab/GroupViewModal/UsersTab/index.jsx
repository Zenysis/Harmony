// @flow
import * as React from 'react';

import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import RemoveItemButton from 'components/ui/RemoveItemButton';
import Table from 'components/ui/Table';
import type User from 'services/models/User';

type Props = {
  onAddUsersClick: () => void,
  onUsersUpdate: (users: $ReadOnlyArray<User>) => void,
  users: $ReadOnlyArray<User>,
};

const HEADERS = [
  {
    id: 'First Name',
    searchable: d => d.firstName(),
    sortFn: Table.Sort.string(d => d.firstName()),
  },
  {
    id: 'Last Name',
    searchable: d => d.lastName(),
    sortFn: Table.Sort.string(d => d.lastName()),
  },
  {
    id: 'Email',
    searchable: d => d.username(),
    sortFn: Table.Sort.string(d => d.username()),
  },
  { id: 'Phone Number', searchable: d => d.phoneNumber() },
];

const TEXT = t('admin_app.GroupsTab.GroupViewModal.UsersTab');

const TABLE_PAGE_SIZE = 6;

export default function UsersTab({
  onAddUsersClick,
  onUsersUpdate,
  users,
}: Props): React.Element<typeof Group.Vertical> {
  const renderTableRow = user => {
    const onUserRemove = () =>
      onUsersUpdate(users.filter(u => u.username() !== user.username()));
    return (
      <Table.Row id={user.username()}>
        <Table.Cell>{user.firstName()}</Table.Cell>
        <Table.Cell>{user.lastName()}</Table.Cell>
        <Table.Cell>{user.username()}</Table.Cell>
        <Table.Cell>{user.phoneNumber()}</Table.Cell>
        <Table.Cell>
          <RemoveItemButton
            className="group-view-modal__remove-icon"
            onClick={onUserRemove}
          />
        </Table.Cell>
      </Table.Row>
    );
  };

  return (
    <Group.Vertical spacing="m">
      <Group.Horizontal flex lastItemStyle={{ marginLeft: 'auto' }}>
        <Heading size={Heading.Sizes.SMALL}>{TEXT.users}</Heading>
        <button
          className="group-view-modal__add-button"
          onClick={onAddUsersClick}
          type="button"
        >
          {TEXT.addUsers}
        </button>
      </Group.Horizontal>
      <div className="group-view-modal__header" />
      <Table
        adjustWidthsToContent
        className="group-view-modal__table"
        data={users}
        headers={HEADERS}
        initialColumnToSort="First Name"
        initialColumnSortOrder="ASC"
        pageSize={TABLE_PAGE_SIZE}
        renderRow={renderTableRow}
      />
    </Group.Vertical>
  );
}
