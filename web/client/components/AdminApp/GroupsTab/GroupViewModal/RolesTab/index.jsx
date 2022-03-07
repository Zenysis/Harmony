// @flow
import * as React from 'react';

import AuthorizationService from 'services/AuthorizationService';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import InteractivePill from 'components/AdminApp/InteractivePill';
import RemoveItemButton from 'components/ui/RemoveItemButton';
import Table from 'components/ui/Table';
import type RoleDefinition from 'services/models/RoleDefinition';

type Props = {
  onAddRolesClick: () => void,
  onRolesUpdate: (roles: Array<RoleDefinition>) => void,
  roles: $ReadOnlyArray<RoleDefinition>,
  getRoleToNumUsersObj?: () => Promise<{ [roleName: string]: number, ... }>,
};

const TEXT = t('admin_app.GroupsTab.GroupViewModal.RolesTab');

const TABLE_PAGE_SIZE = 6;

const HEADERS = [
  {
    id: 'name',
    displayContent: TEXT.name,
    searchable: d => d.label(),
    sortFn: Table.Sort.string(d => d.label()),
  },
  { id: 'memberCount', displayContent: TEXT.memberCount },
];

export default function RolesTab({
  onAddRolesClick,
  onRolesUpdate,
  roles,
  getRoleToNumUsersObj = AuthorizationService.getRoleToNumUsersObj,
}: Props): React.Element<typeof Group.Vertical> {
  const [roleMemberCounts, setRoleMemberCounts] = React.useState<{
    +[string]: number,
    ...,
  }>({});

  React.useEffect(() => {
    getRoleToNumUsersObj().then(roleToNumUsersObj => {
      setRoleMemberCounts(roleToNumUsersObj);
    });
  }, [getRoleToNumUsersObj]);

  const renderTableRow = role => {
    const onRoleRemove = () =>
      onRolesUpdate(roles.filter(r => r.name() !== role.name()));
    const numMembers = roleMemberCounts[role.name()] || 0;
    const totalMembers = t('totalMembers', {
      scope: 'admin_app.GroupsTab.GroupViewModal.RolesTab',
      count: numMembers,
    });
    return (
      <Table.Row id={role.name()}>
        <Table.Cell>
          <InteractivePill pillType="role" role={role} />
        </Table.Cell>
        <Table.Cell>{totalMembers}</Table.Cell>
        <Table.Cell>
          <RemoveItemButton
            className="group-view-modal__remove-icon"
            onClick={onRoleRemove}
          />
        </Table.Cell>
      </Table.Row>
    );
  };

  return (
    <Group.Vertical spacing="m">
      <Group.Horizontal flex lastItemStyle={{ marginLeft: 'auto' }}>
        <Heading size={Heading.Sizes.SMALL}>{TEXT.roles}</Heading>
        <button
          className="group-view-modal__add-button"
          onClick={onAddRolesClick}
          type="button"
        >
          {TEXT.addRoles}
        </button>
      </Group.Horizontal>
      <div className="group-view-modal__header" />
      <Table
        adjustWidthsToContent
        className="group-view-modal__table"
        data={roles}
        headers={HEADERS}
        initialColumnToSort="name"
        initialColumnSortOrder="ASC"
        pageSize={TABLE_PAGE_SIZE}
        renderRow={renderTableRow}
      />
    </Group.Vertical>
  );
}
