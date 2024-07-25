// @flow
import * as React from 'react';

import AuthorizationService from 'services/AuthorizationService';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import I18N from 'lib/I18N';
import InteractivePill from 'components/AdminApp/InteractivePill';
import RemoveItemButton from 'components/ui/RemoveItemButton';
import Table from 'components/ui/Table';
import type RoleDefinition from 'services/models/RoleDefinition';

type Props = {
  onAddRolesClick: () => void,
  onRolesUpdate: (roles: Array<RoleDefinition>) => void,
  roles: $ReadOnlyArray<RoleDefinition>,
};

const TABLE_PAGE_SIZE = 6;

const HEADERS = [
  {
    displayContent: I18N.textById('Name'),
    id: 'name',
    searchable: d => d.label(),
    sortFn: Table.Sort.string(d => d.label()),
  },
  { displayContent: I18N.textById('Member Count'), id: 'memberCount' },
];

export default function RolesTab({
  onAddRolesClick,
  onRolesUpdate,
  roles,
}: Props): React.Element<typeof Group.Vertical> {
  const [roleMemberCounts, setRoleMemberCounts] = React.useState<{
    +[string]: number,
    ...,
  }>({});

  React.useEffect(() => {
    AuthorizationService.getRoleToNumUsersObj().then(roleToNumUsersObj => {
      setRoleMemberCounts(roleToNumUsersObj);
    });
  }, []);

  const renderTableRow = role => {
    const onRoleRemove = () =>
      onRolesUpdate(roles.filter(r => r.name() !== role.name()));
    const numMembers: number = roleMemberCounts[role.name()] || 0;
    const totalMembers = I18N.textById('totalMembers', { count: numMembers });
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
        <Heading size={Heading.Sizes.SMALL}>{I18N.textById('Roles')}</Heading>
        <button
          className="group-view-modal__add-button"
          onClick={onAddRolesClick}
          type="button"
        >
          {I18N.textById('+ Add Roles')}
        </button>
      </Group.Horizontal>
      <div className="group-view-modal__header" />
      <Table
        adjustWidthsToContent
        className="group-view-modal__table"
        data={roles}
        headers={HEADERS}
        initialColumnSortOrder="ASC"
        initialColumnToSort="name"
        pageSize={TABLE_PAGE_SIZE}
        renderRow={renderTableRow}
      />
    </Group.Vertical>
  );
}
