// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import AddAlertView from 'components/AdminApp/AccessSelectionView/AddAlertView';
import AddDashboardView from 'components/AdminApp/AccessSelectionView/AddDashboardView';
import AddGroupView from 'components/AdminApp/AccessSelectionView/AddGroupView';
import AddRoleView from 'components/AdminApp/AccessSelectionView/AddRoleView';
import DashboardAndAlertsTab from 'components/AdminApp/UsersTab/UserViewModal/DashboardAndAlertsTab';
import DeleteConfirmationModal from 'components/AdminApp/DeleteConfirmationModal';
import DirectoryService from 'services/DirectoryService';
import RolesAndGroupsTab from 'components/AdminApp/UsersTab/UserViewModal/RolesAndGroupsTab';
import Tab from 'components/ui/Tabs/Tab';
import TabbedModal from 'components/ui/TabbedModal';
import Toaster from 'components/ui/Toaster';
import UserDetailsTab from 'components/AdminApp/UsersTab/UserViewModal/UserDetailsTab';
import useBoolean from 'lib/hooks/useBoolean';
import useSavedChangesTracker from 'components/AdminApp/hooks/useSavedChangesTracker';
import { RESOURCE_TYPES } from 'services/AuthorizationService/registry';
import { filterACLs } from 'components/AdminApp/constants';
import type AlertDefinition from 'models/AlertsApp/AlertDefinition';
import type DashboardMeta from 'models/core/Dashboard/DashboardMeta';
import type ItemLevelACL from 'services/models/ItemLevelACL';
import type Resource from 'services/models/Resource';
import type RoleDefinition from 'services/models/RoleDefinition';
import type SecurityGroup from 'services/models/SecurityGroup';
import type User, { UserStatus } from 'services/models/User';
import type { GroupACLPair } from 'components/AdminApp/constants';

const TEXT = t('admin_app.UsersTab.UserViewModal');

function filterGroupACLPairs(
  list: Zen.Array<GroupACLPair>,
  type: string,
): Zen.Array<GroupACLPair> {
  return list.filter(dict => dict.acl.resource().resourceType() === type);
}

type Props = {
  alertDefinitions: $ReadOnlyArray<AlertDefinition>,
  alertResources: $ReadOnlyArray<Resource>,
  dashboards: $ReadOnlyArray<DashboardMeta>,
  groups: $ReadOnlyArray<SecurityGroup>,
  onCloseModal: () => void,
  onResendUserInvite: (existingUser: User) => Promise<User>,
  onResetPassword: (user: User) => Promise<void>,
  onUserUpdate: () => void,
  roleMemberCounts: {
    +[roleId: string]: number,
    ...,
  },
  roles: $ReadOnlyArray<RoleDefinition>,
  user: User,
  userGroups: Zen.Array<SecurityGroup>,

  updateUser?: typeof DirectoryService.updateUser,
};

const isAlertsEnabled = window.__JSON_FROM_BACKEND.alertsEnabled;

export default function UserViewModal({
  alertDefinitions,
  alertResources,
  dashboards,
  groups,
  onCloseModal,
  onResendUserInvite,
  onResetPassword,
  onUserUpdate,
  roleMemberCounts,
  roles,
  user,
  userGroups,
  updateUser = DirectoryService.updateUser,
}: Props): React.Element<typeof React.Fragment> {
  // Defaulting this to be true so state is reset every time this modal is
  // opened
  const [showUserViewModal, openUserViewModal, closeUserViewModal] = useBoolean(
    true,
  );
  const [activeTab, setActiveTab] = React.useState<string>(
    TEXT.userDetailsTabName,
  );

  // User Profile
  const [firstName, setFirstName] = React.useState<string>(user.firstName());
  const [lastName, setLastName] = React.useState<string>(user.lastName());
  const [username, setUsername] = React.useState<string>(user.username());
  const [phoneNumber, setPhoneNumber] = React.useState<string>(
    user.phoneNumber(),
  );
  const [status, setStatus] = React.useState<UserStatus>(user.status());

  // Roles and Groups
  const [userRoles, setUserRoles] = React.useState<
    $ReadOnlyArray<RoleDefinition>,
  >(user.roles().arrayView());
  const [userGroupsArr, setUserGroupsArr] = React.useState<
    $ReadOnlyArray<SecurityGroup>,
  >(userGroups.arrayView());
  const userGroupRoles = React.useMemo(
    () =>
      userGroups
        .flatMap(group => group.roles().map(role => ({ group, role })))
        .arrayView(),
    [userGroups],
  );
  const [showAddRoleView, openAddRoleView, closeAddRoleView] = useBoolean(
    false,
  );
  const [showAddGroupView, openAddGroupView, closeAddGroupView] = useBoolean(
    false,
  );

  // Dashboard and Alerts
  const [userDashboardACLs, setUserDashboardACLs] = React.useState<
    $ReadOnlyArray<ItemLevelACL>,
  >(filterACLs(user.acls().arrayView(), RESOURCE_TYPES.DASHBOARD));
  const [userAlertACLs, setUserAlertACLs] = React.useState<
    $ReadOnlyArray<ItemLevelACL>,
  >(filterACLs(user.acls().arrayView(), RESOURCE_TYPES.ALERT));

  const [
    showAddDashboardView,
    openAddDashboardView,
    closeAddDashboardView,
  ] = useBoolean(false);
  const [showAddAlertView, openAddAlertView, closeAddAlertView] = useBoolean(
    false,
  );
  const [
    showConfirmationModal,
    openConfirmationModal,
    closeConfirmationModal,
  ] = useBoolean(false);

  const [unsavedChanges] = useSavedChangesTracker({
    isDataLoaded: true,
    markAsUnsavedWhen: [
      firstName,
      lastName,
      username,
      phoneNumber,
      status,
      userRoles,
      userGroupsArr,
      userAlertACLs,
      userDashboardACLs,
    ],
    markAsSavedWhen: [user],
  });

  const groupACLs = React.useMemo(
    () =>
      userGroups.flatMap(group => group.acls().map(acl => ({ acl, group }))),
    [userGroups],
  );
  const groupDashboardACLs = React.useMemo(
    () => filterGroupACLPairs(groupACLs, RESOURCE_TYPES.DASHBOARD).arrayView(),
    [groupACLs],
  );
  const groupAlertACLs = React.useMemo(
    () => filterGroupACLPairs(groupACLs, RESOURCE_TYPES.ALERT).arrayView(),
    [groupACLs],
  );

  const onAddRoleClick = () => {
    closeUserViewModal();
    openAddRoleView();
  };

  const onCloseGroupViewModal = () =>
    unsavedChanges ? openConfirmationModal() : onCloseModal();

  const onConfirmConfirmationModal = () => {
    closeConfirmationModal();
    onCloseModal();
  };

  const onCloseRoleClick = () => {
    closeAddRoleView();
    openUserViewModal();
  };

  const onAddGroupClick = () => {
    closeUserViewModal();
    openAddGroupView();
  };
  const onCloseGroupClick = () => {
    closeAddGroupView();
    openUserViewModal();
  };

  const onAddDashboardClick = () => {
    closeUserViewModal();
    openAddDashboardView();
  };
  const onCloseDashboardClick = () => {
    closeAddDashboardView();
    openUserViewModal();
  };

  const onAddAlertClick = () => {
    closeUserViewModal();
    openAddAlertView();
  };
  const onCloseAlertClick = () => {
    closeAddAlertView();
    openUserViewModal();
  };

  const userProfileTab = (
    <Tab
      className="user-view-modal__tab-contents"
      containerType="no padding"
      name={TEXT.userDetailsTabName}
    >
      <UserDetailsTab
        email={username}
        firstName={firstName}
        lastName={lastName}
        onEmailChange={setUsername}
        onFirstNameChange={setFirstName}
        onLastNameChange={setLastName}
        onPhoneNumberChange={setPhoneNumber}
        onResendUserInvite={onResendUserInvite}
        onResetPassword={onResetPassword}
        onStatusChange={setStatus}
        phoneNumber={phoneNumber}
        status={status}
        user={user}
      />
    </Tab>
  );

  const rolesAndGroupsTab = (
    <Tab
      className="user-view-modal__tab-contents"
      containerType="no padding"
      name={TEXT.rolesAndGroupsTabName}
    >
      <RolesAndGroupsTab
        onAddGroupClick={onAddGroupClick}
        onAddRoleClick={onAddRoleClick}
        updateUserGroups={setUserGroupsArr}
        updateUserRoles={setUserRoles}
        user={user}
        userGroups={userGroupsArr}
        userGroupRoles={userGroupRoles}
        userRoles={userRoles}
      />
    </Tab>
  );

  const dashboardAndAlertsTab = (
    <Tab
      className="user-view-modal__tab-contents"
      containerType="no padding"
      name={
        isAlertsEnabled ? TEXT.dashboardAndAlertsTabName : TEXT.dashboardTabName
      }
    >
      <DashboardAndAlertsTab
        groupAlertACLs={groupAlertACLs}
        groupDashboardACLs={groupDashboardACLs}
        onAddAlertClick={onAddAlertClick}
        onAddDashboardClick={onAddDashboardClick}
        updateUserAlertACLs={setUserAlertACLs}
        updateUserDashboardACLs={setUserDashboardACLs}
        user={user}
        userAlertACLs={userAlertACLs}
        userDashboardACLs={userDashboardACLs}
      />
    </Tab>
  );

  const enabledDashboardACLsMap = userDashboardACLs.reduce(
    (map, dashboardACL) =>
      map.set(
        dashboardACL.resource().name(),
        dashboardACL.resourceRole().name(),
      ),
    new Map(),
  );
  const enabledAlertACLsMap = userAlertACLs.reduce(
    (map, alertACL) =>
      map.set(alertACL.resource().uri(), alertACL.resourceRole().name()),
    new Map(),
  );

  const onSaveUser = () => {
    updateUser(
      user
        .firstName(firstName)
        .lastName(lastName)
        .username(username)
        .phoneNumber(phoneNumber)
        .status(status)
        .roles(Zen.Array.create(userRoles))
        .acls(Zen.Array.create([...userAlertACLs, ...userDashboardACLs])),
      userGroupsArr,
    )
      .then(() => {
        if (status !== user.status()) {
          analytics.track('User status changed', {
            changedUser: user.username(),
            newStatus: status,
          });
        }
        Toaster.success(TEXT.updateUserSuccess);
        onUserUpdate();
        onCloseModal();
      })
      .catch(() => Toaster.error(TEXT.updateUserFailure));
  };

  return (
    <React.Fragment>
      <TabbedModal
        className="user-view-modal"
        height={984}
        initialTab={activeTab}
        onTabChange={setActiveTab}
        show={showUserViewModal}
        onPrimaryAction={onSaveUser}
        onRequestClose={onCloseGroupViewModal}
        primaryButtonText={TEXT.primaryAction}
        title={TEXT.title}
        width={984}
      >
        {userProfileTab}
        {rolesAndGroupsTab}
        {dashboardAndAlertsTab}
      </TabbedModal>
      {showAddRoleView ? (
        <AddRoleView
          enabledRoles={userRoles}
          onClickSave={setUserRoles}
          onRequestClose={onCloseRoleClick}
          roleMemberCounts={roleMemberCounts}
          roles={roles}
          show={showAddRoleView}
        />
      ) : null}
      {showAddGroupView ? (
        <AddGroupView
          allGroups={groups}
          enabledGroups={userGroupsArr}
          onRequestClose={onCloseGroupClick}
          onClickSave={setUserGroupsArr}
          show={showAddGroupView}
        />
      ) : null}
      {showAddDashboardView ? (
        <AddDashboardView
          dashboards={dashboards}
          enabledDashboardACLsMap={enabledDashboardACLsMap}
          onRequestClose={onCloseDashboardClick}
          onClickSave={setUserDashboardACLs}
          show={showAddDashboardView}
        />
      ) : null}
      {showAddAlertView && isAlertsEnabled ? (
        <AddAlertView
          alerts={alertDefinitions}
          alertResources={alertResources}
          enabledAlertACLsMap={enabledAlertACLsMap}
          onRequestClose={onCloseAlertClick}
          onClickSave={setUserAlertACLs}
          show={showAddAlertView}
        />
      ) : null}
      {showConfirmationModal ? (
        <DeleteConfirmationModal
          closeButtonText={TEXT.noButtonText}
          description={TEXT.confirmationModalDescription}
          onClose={closeConfirmationModal}
          onPrimaryAction={onConfirmConfirmationModal}
          primaryButtonText={TEXT.yesButtonText}
          show={showConfirmationModal}
          title={TEXT.confirmationModalTitle}
        />
      ) : null}
    </React.Fragment>
  );
}
