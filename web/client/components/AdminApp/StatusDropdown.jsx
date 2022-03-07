// @flow
import * as React from 'react';

import Dropdown from 'components/ui/Dropdown';
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

const DEFAULT_TEXT = t('admin_app.status_dropdown_default');

export default function StatusDropdown(
  props: Props,
): React.Element<typeof Dropdown> {
  const { onSelectionChange, selectedUserStatus } = props;
  return (
    <Dropdown onSelectionChange={onSelectionChange} value={selectedUserStatus}>
      <Dropdown.Option value={null}>{DEFAULT_TEXT}</Dropdown.Option>
      {OPTIONS}
    </Dropdown>
  );
}
