// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import InfoTooltip from 'components/ui/InfoTooltip';
import RemoveButtonCol from 'components/common/RemoveButtonCol';
import RolesCol from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardSettingsModal/DashboardUsersTable//RolesCol';
import SecurityGroup from 'services/models/SecurityGroup';
import Table from 'components/ui/Table';
import autobind from 'decorators/autobind';
import type Role from 'services/models/Role';

type Props = {
  disableRemove: boolean,
  disableRemoveText: string,
  displayUserInfoToolTip: SecurityGroup => React.Element<typeof InfoTooltip>,
  group: SecurityGroup,
  groupRoles: Zen.Array<Role>,
  onGroupRoleChange: (username: string, newRoleName: string) => void,
  onRemoveClick: SecurityGroup => void,
  roles: $ReadOnlyArray<string>,
};

export default class GroupRow extends React.PureComponent<Props> {
  @autobind
  onRemoveClick() {
    const { group, onRemoveClick } = this.props;
    onRemoveClick(group);
  }

  render(): Array<
    | React.Element<typeof Table.Cell>
    | React.Element<typeof RolesCol>
    | React.Element<typeof RemoveButtonCol>,
  > {
    const {
      disableRemove,
      disableRemoveText,
      displayUserInfoToolTip,
      group,
      groupRoles,
      onGroupRoleChange,
      roles,
    } = this.props;

    return [
      <Table.Cell key="fullName">{group.name()}</Table.Cell>,
      <Table.Cell key="username">{displayUserInfoToolTip(group)}</Table.Cell>,
      <RolesCol
        key="groupRoles"
        onRoleChange={onGroupRoleChange}
        roles={roles}
        username={group.name()}
        userRoles={groupRoles}
      />,
      <RemoveButtonCol
        columnId={group}
        disabled={disableRemove}
        disabledText={disableRemoveText}
        key="removeButton"
        onRemoveClick={this.onRemoveClick}
      />,
    ];
  }
}
