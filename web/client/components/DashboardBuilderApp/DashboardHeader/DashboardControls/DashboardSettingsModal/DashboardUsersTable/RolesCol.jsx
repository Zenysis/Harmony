// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import Dropdown from 'components/ui/Dropdown';
import Table from 'components/ui/Table';
import { autobind, memoizeOne } from 'decorators';
import type Role from 'services/models/Role';

const TEXT = t('common.user_select');

type Props = {
  onRoleChange: (string, string) => void,
  roles: $ReadOnlyArray<string>,
  userRoles: Zen.Array<Role>,
  username: string,
};

export default class RolesCol extends React.PureComponent<Props> {
  @memoizeOne
  getUserRoleNames(userRoles: Zen.Array<Role>): $ReadOnlyArray<string> {
    return userRoles.mapValues(role => role.roleName());
  }

  @memoizeOne
  buildUserRoleMap(userRoles: Zen.Array<Role>): { [string]: Role, ... } {
    const output = {};
    userRoles.forEach(role => {
      output[role.roleName()] = role;
    });
    return output;
  }

  getUserRoleMap(): { [string]: Role, ... } {
    return this.buildUserRoleMap(this.props.userRoles);
  }

  @autobind
  onRoleChange(value: string) {
    // HACK(toshi): This is definitely not the best way of deducing type...
    this.props.onRoleChange(this.props.username, value);
  }

  render(): React.Element<typeof Table.Cell> {
    const options = this.props.roles.map(role => (
      <Dropdown.Option key={role} value={role}>
        {TEXT[role]}
      </Dropdown.Option>
    ));

    // TODO(toshi): This is not updated to use ItemLevelACLs which makes things
    // here cumbersome, but since the UI will need a refresh as well, it makes
    // sense to do the data plumbing when updating the UI.
    const userRoleNames = this.getUserRoleNames(this.props.userRoles);
    const dropdownValue =
      userRoleNames.length > 0 ? userRoleNames[0] : TEXT.select_role;
    return (
      <Table.Cell>
        <Dropdown value={dropdownValue} onSelectionChange={this.onRoleChange}>
          {options}
        </Dropdown>
      </Table.Cell>
    );
  }
}
