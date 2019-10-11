// @flow
import * as React from 'react';

import ActionsBar from 'components/AdminApp/ActionsBar';
import UserList from 'components/AdminApp/UserList';

type Props = $Merge<
  React.ElementConfig<typeof ActionsBar>,
  React.ElementConfig<typeof UserList>,
>;

export default function UserManagementBlock(props: Props) {
  const {
    onUserStatusFilterChange,
    selectedUserStatus,
    ...userListProps
  } = props;

  return (
    <div className="user-management-block">
      <ActionsBar
        onUserStatusFilterChange={onUserStatusFilterChange}
        selectedUserStatus={selectedUserStatus}
      />
      <UserList {...userListProps} />
    </div>
  );
}
