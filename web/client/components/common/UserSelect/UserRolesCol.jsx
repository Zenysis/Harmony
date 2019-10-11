// @flow
import * as React from 'react';

import BootstrapSelect from 'components/bootstrap_select';
import Table from 'components/ui/Table';
import { autobind, memoizeOne } from 'decorators';
import type Role from 'services/models/Role';
import type RoleDefinition from 'services/models/RoleDefinition';
import type ZenArray from 'util/ZenModel/ZenArray';
import type { ResourceType } from 'services/AuthorizationService';

const TEXT = t('common.user_select');

type Props = {
  onUserRoleChange: (string, $ReadOnlyArray<string>, ResourceType) => void,
  roles: ZenArray<RoleDefinition>,
  userRoles: ZenArray<Role>,
  username: string,
};

export default class UserRolesCol extends React.PureComponent<Props> {
  @memoizeOne
  getUserRoleNames(userRoles: ZenArray<Role>): $ReadOnlyArray<string> {
    return userRoles.mapValues(role => role.roleName());
  }

  @memoizeOne
  buildUserRoleMap(userRoles: ZenArray<Role>): { [string]: Role } {
    const output = {};
    userRoles.forEach(role => {
      output[role.roleName()] = role;
    });
    return output;
  }

  getUserRoleMap(): { [string]: Role } {
    return this.buildUserRoleMap(this.props.userRoles);
  }

  @autobind
  onUserRoleChange(event: SyntheticEvent<HTMLSelectElement>) {
    const newRoleNames = $(event.target).val() || [];
    // HACK(toshi): This is definitely not the best way of deducing type...
    const resourceType = this.props.roles.get(0).resourceType();
    this.props.onUserRoleChange(
      this.props.username,
      newRoleNames,
      // $ZenModelReadOnlyIssue - resourceType is ReadOnly
      resourceType,
    );
  }

  render() {
    const options = this.props.roles.map(role => (
      <option key={role.name()} value={role.name()}>
        {role.label()}
      </option>
    ));

    const userRoleNames = this.getUserRoleNames(this.props.userRoles);
    return (
      <Table.Cell>
        <BootstrapSelect
          className="role-select-dropdown btn-group-xs input-medium row col-xs-2"
          data-selected-text-format="count"
          data-width="fit"
          title={TEXT.select_role}
          data-live-search
          onChange={this.onUserRoleChange}
          value={userRoleNames}
          multiple
        >
          {options}
        </BootstrapSelect>
      </Table.Cell>
    );
  }
}
