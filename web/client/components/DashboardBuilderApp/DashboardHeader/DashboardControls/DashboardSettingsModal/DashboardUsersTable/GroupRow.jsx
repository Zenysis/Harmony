// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import InfoTooltip from 'components/ui/InfoTooltip';
import RemoveButtonCol from 'components/common/RemoveButtonCol';
import RolesCol from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardSettingsModal/DashboardUsersTable//RolesCol';
import SecurityGroup from 'services/models/SecurityGroup';
import Table from 'components/ui/Table';
import type Role from 'services/models/Role';

type Props = {
  disableRemove: boolean,
  disableRemoveText: string,
  displayUserInfoToolTip: SecurityGroup => React.Element<typeof InfoTooltip>,
  group: SecurityGroup,
  groupRoles: Zen.Array<Role>,
  onGroupRoleChange: (username: string, newRoleName: string) => void,
  onRemoveClick: SecurityGroup => void,
};

export default function GroupRow({
  disableRemove,
  disableRemoveText,
  displayUserInfoToolTip,
  group,
  groupRoles,
  onGroupRoleChange,
  onRemoveClick,
}: Props): Array<
  | React.Element<typeof Table.Cell>
  | React.Element<typeof RolesCol>
  | React.Element<typeof RemoveButtonCol>,
> {
  return [
    <Table.Cell key="fullName">{group.name()}</Table.Cell>,
    <Table.Cell key="username">{displayUserInfoToolTip(group)}</Table.Cell>,
    <RolesCol
      key="groupRoles"
      onRoleChange={onGroupRoleChange}
      username={group.name()}
      userRoles={groupRoles}
    />,
    <RemoveButtonCol
      key="removeButton"
      columnId={group}
      disabled={disableRemove}
      disabledText={disableRemoveText}
      onRemoveClick={() => onRemoveClick(group)}
    />,
  ];
}
