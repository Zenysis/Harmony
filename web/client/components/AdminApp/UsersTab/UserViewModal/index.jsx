// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import APIToken from 'services/models/APIToken';
import APITokensTab from 'components/AdminApp/UsersTab/UserViewModal/APITokensTab';
import AddAlertView from 'components/AdminApp/AccessSelectionView/AddAlertView';
import AddDashboardView from 'components/AdminApp/AccessSelectionView/AddDashboardView';
import AddGroupView from 'components/AdminApp/AccessSelectionView/AddGroupView';
import AddRoleView from 'components/AdminApp/AccessSelectionView/AddRoleView';
import DashboardAndAlertsTab from 'components/AdminApp/UsersTab/UserViewModal/DashboardAndAlertsTab';
import DeleteConfirmationModal from 'components/AdminApp/DeleteConfirmationModal';
import DirectoryService from 'services/DirectoryService';
import I18N from 'lib/I18N';
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
}: Props): React.Element<typeof React.Fragment> {
  // Defaulting this to be true so state is reset every time this modal is
  // opened
  const [showUserViewModal, openUserViewModal, closeUserViewModal] = useBoolean(
    true,
  );
  const [activeTab, setActiveTab] = React.useState<string>(
    I18N.text('Profile Details'),
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

  // API Tokens
  const [userAPITokens, setUserAPITokens] = React.useState<
    $ReadOnlyArray<APIToken>,
  >(user.apiTokens().arrayView());

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
    markAsSavedWhen: [user],
    markAsUnsavedWhen: [
      firstName,
      lastName,
      username,
      phoneNumber,
      status,
      userAPITokens,
      userRoles,
      userGroupsArr,
      userAlertACLs,
      userDashboardACLs,
    ],
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
      name={I18N.textById('Profile Details')}
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
      name={I18N.text('Roles & Groups')}
    >
      <RolesAndGroupsTab
        onAddGroupClick={onAddGroupClick}
        onAddRoleClick={onAddRoleClick}
        updateUserGroups={setUserGroupsArr}
        updateUserRoles={setUserRoles}
        user={user}
        userGroupRoles={userGroupRoles}
        userGroups={userGroupsArr}
        userRoles={userRoles}
      />
    </Tab>
  );

  const dashboardAndAlertsTab = (
    <Tab
      className="user-view-modal__tab-contents"
      containerType="no padding"
      name={
        isAlertsEnabled
          ? I18N.text('Dashboards & Alerts')
          : I18N.textById('Dashboards')
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

  const apiTokensTab = (
    <Tab
      className="user-view-modal__tab-contents"
      containerType="no padding"
      name={I18N.text('API Tokens')}
    >
      <APITokensTab
        apiTokens={userAPITokens}
        onUpdate={setUserAPITokens}
        user={user}
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
    DirectoryService.updateUser(
      user
        .firstName(firstName)
        .lastName(lastName)
        .username(username)
        .phoneNumber(phoneNumber)
        .status(status)
        .roles(Zen.Array.create(userRoles))
        .acls(Zen.Array.create([...userAlertACLs, ...userDashboardACLs]))
        .apiTokens(Zen.Array.create(userAPITokens)),
      userGroupsArr,
    )
      .then(() => {
        Toaster.success(I18N.text('User successfully updated'));
        onUserUpdate();
        onCloseModal();
      })
      .catch(() =>
        Toaster.error(I18N.text('There was a problem updating this user')),
      );
  };

  return (
    <React.Fragment>
      <TabbedModal
        className="user-view-modal"
        height={984}
        initialTab={activeTab}
        onPrimaryAction={onSaveUser}
        onRequestClose={onCloseGroupViewModal}
        onTabChange={setActiveTab}
        primaryButtonText={I18N.textById('Save')}
        show={showUserViewModal}
        title={I18N.textById('Edit User')}
        width={984}
      >
        {userProfileTab}
        {rolesAndGroupsTab}
        {dashboardAndAlertsTab}
        {apiTokensTab}
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
          onClickSave={setUserGroupsArr}
          onRequestClose={onCloseGroupClick}
          show={showAddGroupView}
        />
      ) : null}
      {showAddDashboardView ? (
        <AddDashboardView
          dashboards={dashboards}
          enabledDashboardACLsMap={enabledDashboardACLsMap}
          onClickSave={setUserDashboardACLs}
          onRequestClose={onCloseDashboardClick}
          show={showAddDashboardView}
        />
      ) : null}
      {showAddAlertView && isAlertsEnabled ? (
        <AddAlertView
          alertResources={alertResources}
          alerts={alertDefinitions}
          enabledAlertACLsMap={enabledAlertACLsMap}
          onClickSave={setUserAlertACLs}
          onRequestClose={onCloseAlertClick}
          show={showAddAlertView}
        />
      ) : null}
      {showConfirmationModal ? (
        <DeleteConfirmationModal
          closeButtonText={I18N.textById('No')}
          description={I18N.textById(
            'Closing this will remove any unsaved changes. Do you wish to proceed?',
          )}
          onClose={closeConfirmationModal}
          onPrimaryAction={onConfirmConfirmationModal}
          primaryButtonText={I18N.textById('Yes')}
          show={showConfirmationModal}
          title={I18N.textById('Discard changes')}
        />
      ) : null}
    </React.Fragment>
  );
}
