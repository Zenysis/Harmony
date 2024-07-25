// @flow
import * as React from 'react';

import AddUserView from 'components/AdminApp/AccessSelectionView/AddUserView';
import AdminAppActionCard from 'components/AdminApp/AdminAppActionCard';
import AdminAppMenuOption from 'components/AdminApp/AdminAppMenu/AdminAppMenuOption';
import DeleteConfirmationModal from 'components/AdminApp/DeleteConfirmationModal';
import DirectoryService from 'services/DirectoryService';
import GroupCardContents from 'components/AdminApp/GroupsTab/GroupCardContents';
import I18N from 'lib/I18N';
import useBoolean from 'lib/hooks/useBoolean';
import type SecurityGroup from 'services/models/SecurityGroup';
import type User from 'services/models/User';

type Props = {
  allGroups: $ReadOnlyArray<SecurityGroup>,
  group: SecurityGroup,
  onGroupViewOpen: () => void,
  updateGroupsTab: () => void,
  users: $ReadOnlyArray<User>,
};

function InteractiveGroupCard({
  allGroups,
  group,
  onGroupViewOpen,
  updateGroupsTab,
  users,
}: Props) {
  const [showMenu, openMenu, closeMenu] = useBoolean(false);
  const [showAddUserView, openAddUserView, closeAddUserView] = useBoolean(
    false,
  );
  const [
    showDeleteGroupConfirmationModal,
    openDeleteGroupConfirmationModal,
    closeDeleteGroupConfirmationModal,
  ] = useBoolean(false);

  const onAddUsersClick = () => {
    closeMenu();
    openAddUserView();
  };

  const onEditGroupClick = () => {
    onGroupViewOpen();
    closeMenu();
  };

  const onDeleteGroup = () => {
    DirectoryService.deleteGroup(group).then(() => updateGroupsTab());
  };

  const onAddUsersViewClose = () => {
    closeAddUserView();
    openMenu();
  };

  const onDeleteGroupMenuOptionClick = () => {
    closeMenu();
    openDeleteGroupConfirmationModal();
  };

  // NOTE: Keeping this button here because we will probably come back
  // to using this later.
  /* eslint-disable no-unused-vars */
  const addUsersButton = (
    <AdminAppMenuOption
      key="group_user"
      iconType="user"
      onClick={onAddUsersClick}
      text={I18N.textById('Add Users')}
    />
  );

  const editGroupButton = (
    <AdminAppMenuOption
      key="edit_group"
      iconType="edit"
      onClick={onEditGroupClick}
      text={I18N.text('Edit Group')}
    />
  );

  const deleteGroupModal = (
    <DeleteConfirmationModal
      description={I18N.text(
        'Are you sure you want to permanently delete this group?',
      )}
      onClose={closeDeleteGroupConfirmationModal}
      onPrimaryAction={onDeleteGroup}
      show={showDeleteGroupConfirmationModal}
      title={I18N.text('Delete Group')}
    />
  );

  const deleteGroupButton = (
    <AdminAppMenuOption
      key="delete_group"
      iconType="trash"
      onClick={onDeleteGroupMenuOptionClick}
      text={I18N.textById('Delete Group')}
    />
  );

  const enabledGroupUserNames = React.useMemo(
    () =>
      group
        .users()
        .map(user => user.username())
        .arrayView(),
    [group],
  );

  const onAddUserViewClickSave = (inputUsers: $ReadOnlyArray<User>) => {
    DirectoryService.updateGroupUsers(
      group,
      inputUsers.map(user => user.username()),
    ).then(() => updateGroupsTab());
  };

  const addUserView = (
    <AddUserView
      allGroups={allGroups}
      enabledUsernames={enabledGroupUserNames}
      onClickSave={onAddUserViewClickSave}
      onRequestClose={onAddUsersViewClose}
      show={showAddUserView}
      users={users}
    />
  );

  const card = (
    <AdminAppActionCard
      menuOptions={[editGroupButton, deleteGroupButton]}
      onCardClick={onGroupViewOpen}
      onRequestCloseMenu={closeMenu}
      onRequestOpenMenu={openMenu}
      showMenu={showMenu}
      title={group.name()}
    >
      <GroupCardContents group={group} />
    </AdminAppActionCard>
  );

  return (
    <React.Fragment>
      {card}
      {addUserView}
      {deleteGroupModal}
    </React.Fragment>
  );
}

export default (React.memo(
  InteractiveGroupCard,
): React.AbstractComponent<Props>);
