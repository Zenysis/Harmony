// @flow
import * as React from 'react';

import StatusDropdown from 'components/AdminApp/StatusDropdown';
import type { UserStatus } from 'services/models/User';

type Props = {
  onUserStatusFilterChange: (UserStatus | null) => void,
  selectedUserStatus: UserStatus | null,
};

export default function ActionsBar({
  onUserStatusFilterChange,
  selectedUserStatus,
}: Props) {
  return (
    <div className="actions-bar">
      <StatusDropdown
        onSelectionChange={onUserStatusFilterChange}
        selectedUserStatus={selectedUserStatus}
      />
    </div>
  );
}

ActionsBar.defaultProps = {
  selectedUserStatus: null,
};
