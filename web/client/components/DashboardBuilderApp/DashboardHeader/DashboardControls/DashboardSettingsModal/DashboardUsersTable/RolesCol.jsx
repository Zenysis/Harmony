// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import Dropdown from 'components/ui/Dropdown';
import I18N from 'lib/I18N';
import Table from 'components/ui/Table';
import {
  createDropOptions,
  SINGLE_DASHBOARD_OPTIONS_MAP,
} from 'components/AdminApp/constants';
import type Role from 'services/models/Role';

type Props = {
  onRoleChange: (string, string) => void,
  username: string,
  userRoles: Zen.Array<Role>,
};

const DROPDOWN_OPTIONS = createDropOptions(SINGLE_DASHBOARD_OPTIONS_MAP);

const RolesCol = ({
  onRoleChange,
  userRoles,
  username,
}: Props): React.Element<typeof Table.Cell> => {
  // TODO: This is not updated to use ItemLevelACLs which makes things
  // here cumbersome, but since the UI will need a refresh as well, it makes
  // sense to do the data plumbing when updating the UI.
  const userRoleNames: $ReadOnlyArray<string> = userRoles.mapValues(role =>
    role.roleName(),
  );
  const dropdownValue = userRoleNames[0] || I18N.text('Specify role');

  return (
    <Table.Cell>
      <Dropdown
        onSelectionChange={value => onRoleChange(username, value)}
        value={dropdownValue}
      >
        {DROPDOWN_OPTIONS}
      </Dropdown>
    </Table.Cell>
  );
};

export default RolesCol;
