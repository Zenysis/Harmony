// @flow
import * as React from 'react';

import Dropdown from 'components/ui/Dropdown';
import I18N from 'lib/I18N';
import { USER_STATUS_TRANSLATIONS } from 'components/AdminApp/constants';
import type { UserStatus } from 'services/models/User';

type Props = {
  onSelectionChange: (
    newStatus: UserStatus | null,
    event: SyntheticEvent<HTMLElement>,
  ) => void,
  selectedUserStatus: UserStatus | null,
};

const OPTIONS = Object.keys(USER_STATUS_TRANSLATIONS).map(
  (statusType: UserStatus) => {
    const status = USER_STATUS_TRANSLATIONS[statusType];
    return (
      <Dropdown.Option key={status.key} value={status.key}>
        {status.displayContents}
      </Dropdown.Option>
    );
  },
);

export default function StatusDropdown(
  props: Props,
): React.Element<typeof Dropdown> {
  const { onSelectionChange, selectedUserStatus } = props;
  return (
    <Dropdown onSelectionChange={onSelectionChange} value={selectedUserStatus}>
      <Dropdown.Option value={null}>{I18N.text('All Users')}</Dropdown.Option>
      {OPTIONS}
    </Dropdown>
  );
}
