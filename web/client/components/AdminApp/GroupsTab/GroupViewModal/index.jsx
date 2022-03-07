// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import AddAlertView from 'components/AdminApp/AccessSelectionView/AddAlertView';
import AddDashboardView from 'components/AdminApp/AccessSelectionView/AddDashboardView';
import AddRoleView from 'components/AdminApp/AccessSelectionView/AddRoleView';
import AddUserView from 'components/AdminApp/AccessSelectionView/AddUserView';
import DashboardAndAlertsTab from 'components/AdminApp/GroupsTab/GroupViewModal/DashboardAndAlertsTab';
import DeleteConfirmationModal from 'components/AdminApp/DeleteConfirmationModal';
import DirectoryService from 'services/DirectoryService';
import GroupDetailsTab from 'components/AdminApp/GroupsTab/GroupViewModal/GroupDetailsTab';
import RolesTab from 'components/AdminApp/GroupsTab/GroupViewModal/RolesTab';
import SecurityGroup from 'services/models/SecurityGroup';
import Tab from 'components/ui/Tabs/Tab';
import TabbedModal from 'components/ui/TabbedModal';
import Toaster from 'components/ui/Toaster';
import UsersTab from 'components/AdminApp/GroupsTab/GroupViewModal/UsersTab';
import useBoolean from 'lib/hooks/useBoolean';
import useSavedChangesTracker from 'components/AdminApp/hooks/useSavedChangesTracker';
import { RESOURCE_TYPES } from 'services/AuthorizationService/registry';
import type AlertDefinition from 'models/AlertsApp/AlertDefinition';
import type DashboardMeta from 'models/core/Dashboard/DashboardMeta';
import type ItemLevelACL from 'services/models/ItemLevelACL';
import type Resource from 'services/models/Resource';
import type RoleDefinition from 'services/models/RoleDefinition';
import type User from 'services/models/User';
import type { ResourceType } from 'services/AuthorizationService/types';

const TEXT = t('admin_app.GroupsTab.GroupViewModal');

const isAlertsEnabled = window.__JSON_FROM_BACKEND.alertsEnabled;

type Props = {
  alertDefinitions: $ReadOnlyArray<AlertDefinition>,
  alertResources: $ReadOnlyArray<Resource>,
  dashboards: $ReadOnlyArray<DashboardMeta>,
  groupNames: $ReadOnlyArray<string>,
  groups: $ReadOnlyArray<SecurityGroup>,
  // onGroupViewClose is used to close and unmount this component. Methods to
  // open and close the modal are maintained within this component.
  onGroupViewClose: () => void,
  roleMemberCounts: {
    +[roleId: string]: number,
    ...,
  },
  roles: $ReadOnlyArray<RoleDefinition>,
  updateGroupsTab: () => void,
  users: $ReadOnlyArray<User>,

  createGroup?: typeof DirectoryService.createGroup,
  // Group is undefined when we are creating a new group.
  group?: SecurityGroup | void,
  updateGroup?: typeof DirectoryService.updateGroup,
};

function getACLs(
  group: SecurityGroup | void,
  resourceType: ResourceType,
): $ReadOnlyArray<ItemLevelACL> {
  return group !== undefined
    ? group
        .acls()
        .filter(acl => acl.resource().resourceType() === resourceType)
        .arrayView()
    : [];
}

export default function GroupViewModal({
  alertDefinitions,
  alertResources,
  dashboards,
  groupNames,
  groups,
  onGroupViewClose,
  roleMemberCounts,
  roles,
  users,
  group,
  updateGroupsTab,
  createGroup = DirectoryService.createGroup,
  updateGroup = DirectoryService.updateGroup,
}: Props): React.Element<typeof React.Fragment> {
  const [activeTab, setActiveTab] = React.useState<string>(TEXT.groupDetails);
  const [name, setName] = React.useState<string>(
    group !== undefined ? group.name() : '',
  );
  const [groupUsers, setGroupUsers] = React.useState<$ReadOnlyArray<User>>(
    group !== undefined ? group.users().arrayView() : [],
  );
  const [groupRoles, setGroupRoles] = React.useState<
    $ReadOnlyArray<RoleDefinition>,
  >(group !== undefined ? group.roles().arrayView() : []);
  const [alertACLs, setAlertACLs] = React.useState<
    $ReadOnlyArray<ItemLevelACL>,
  >(getACLs(group, RESOURCE_TYPES.ALERT));
  const [dashboardACLs, setDashboardACLs] = React.useState<
    $ReadOnlyArray<ItemLevelACL>,
  >(getACLs(group, RESOURCE_TYPES.DASHBOARD));
  const [showAddRoleView, openAddRoleView, closeAddRoleView] = useBoolean(
    false,
  );
  const [showAddUserView, openAddUserView, closeAddUserView] = useBoolean(
    false,
  );
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
  const [isModalVisible, showModal, hideModal] = useBoolean(true);

  const [unsavedChanges] = useSavedChangesTracker({
    isDataLoaded: true,
    markAsUnsavedWhen: [name, groupUsers, groupRoles, alertACLs, dashboardACLs],
    markAsSavedWhen: [group],
  });

  const onAddRoleViewClose = () => {
    closeAddRoleView();
    showModal();
  };

  const onAddUserViewClose = () => {
    closeAddUserView();
    showModal();
  };

  const onCloseGroupViewModal = () =>
    unsavedChanges ? openConfirmationModal() : onGroupViewClose();

  const onConfirmConfirmationModal = () => {
    closeConfirmationModal();
    onGroupViewClose();
  };

  const onAddDashboardViewClose = () => {
    closeAddDashboardView();
    showModal();
  };

  const onAddAlertViewClose = () => {
    closeAddAlertView();
    showModal();
  };

  const onAddRoleClick = () => {
    hideModal();
    openAddRoleView();
  };

  const onAddUserClick = () => {
    hideModal();
    openAddUserView();
  };

  const onAddDashboardClick = () => {
    hideModal();
    openAddDashboardView();
  };

  const onAddAlertClick = () => {
    hideModal();
    openAddAlertView();
  };

  const onPrimaryAction = () => {
    const newACLs = Zen.Array.create([...dashboardACLs, ...alertACLs]);
    const newRoles = Zen.Array.create(groupRoles);
    const newUsers = Zen.Array.create(groupUsers);
    const cleanedName = name.trim();
    if (cleanedName === '') {
      Toaster.error(TEXT.noEmptyName);
      return;
    }
    if (group === undefined && groupNames.includes(cleanedName.toLowerCase())) {
      Toaster.error(
        t('services.DirectoryService.duplicateGroupNameError', {
          name: cleanedName,
        }),
      );
      return;
    }
    const groupToUpdate =
      group === undefined
        ? SecurityGroup.create({
            acls: Zen.Array.create(newACLs),
            name: cleanedName,
            roles: Zen.Array.create(newRoles),
            users: Zen.Array.create(newUsers),
          })
        : group
            .acls(newACLs)
            .name(cleanedName)
            .roles(newRoles)
            .users(newUsers);
    const updateGroupAction = group === undefined ? createGroup : updateGroup;
    updateGroupAction(groupToUpdate)
      .then(() => {
        updateGroupsTab();
        onGroupViewClose();
      })
      .catch(error => Toaster.error(error));
  };

  const dashboardAndAlertsTab = () => {
    const resourceURIToAlertMap = alertDefinitions.reduce(
      (map, alert) => map.set(alert.resourceURI(), alert),
      Zen.Map.create(),
    );
    const dashboardSlugToDashboardMap = dashboards.reduce(
      (map, dashboard) => map.set(dashboard.slug(), dashboard),
      Zen.Map.create(),
    );
    return (
      <Tab
        className="group-view-modal__tab-contents"
        containerType="no padding"
        name={isAlertsEnabled ? TEXT.dashboardAndAlerts : TEXT.dashboard}
      >
        <DashboardAndAlertsTab
          alertACLs={alertACLs}
          dashboardACLs={dashboardACLs}
          dashboardSlugToDashboardMap={dashboardSlugToDashboardMap}
          onAddAlertClick={onAddAlertClick}
          onAddDashboardClick={onAddDashboardClick}
          onAlertACLsUpdate={setAlertACLs}
          onDashboardACLsUpdate={setDashboardACLs}
          resourceURIToAlertMap={resourceURIToAlertMap}
        />
      </Tab>
    );
  };

  const groupDetailsTab = (
    <Tab
      className="group-view-modal__tab-contents"
      containerType="no padding"
      name={TEXT.groupDetails}
    >
      <GroupDetailsTab
        name={name}
        numAlertACLs={alertACLs.length}
        numDashboardACLs={dashboardACLs.length}
        numUsers={groupUsers.length}
        onNameInputChange={setName}
        roles={groupRoles}
      />
    </Tab>
  );

  const rolesTab = (
    <Tab
      className="group-view-modal__tab-contents"
      containerType="no padding"
      name={TEXT.roles}
    >
      <RolesTab
        onAddRolesClick={onAddRoleClick}
        onRolesUpdate={setGroupRoles}
        roles={groupRoles}
      />
    </Tab>
  );

  const usersTab = (
    <Tab
      className="group-view-modal__tab-contents"
      containerType="no padding"
      name={TEXT.users}
    >
      <UsersTab
        onAddUsersClick={onAddUserClick}
        onUsersUpdate={setGroupUsers}
        users={groupUsers}
      />
    </Tab>
  );

  const enabledUsernames = groupUsers.map(user => user.username());
  const enabledDashboardACLsMap = dashboardACLs.reduce(
    (map, dashboardACL) =>
      map.set(
        dashboardACL.resource().name(),
        dashboardACL.resourceRole().name(),
      ),
    new Map(),
  );
  const enabledAlertACLsMap = alertACLs.reduce(
    (map, alertACL) =>
      map.set(alertACL.resource().uri(), alertACL.resourceRole().name()),
    new Map(),
  );

  return (
    <React.Fragment>
      <TabbedModal
        className="group-view-modal"
        height={984}
        initialTab={activeTab}
        show={isModalVisible}
        onRequestClose={onCloseGroupViewModal}
        onTabChange={setActiveTab}
        onPrimaryAction={onPrimaryAction}
        primaryButtonText={TEXT.save}
        title={group !== undefined ? TEXT.editGroup : TEXT.createGroup}
        width={984}
      >
        {groupDetailsTab}
        {usersTab}
        {rolesTab}
        {dashboardAndAlertsTab()}
      </TabbedModal>
      {showAddRoleView ? (
        <AddRoleView
          enabledRoles={groupRoles}
          onClickSave={setGroupRoles}
          onRequestClose={onAddRoleViewClose}
          roleMemberCounts={roleMemberCounts}
          roles={roles}
          show={showAddRoleView}
        />
      ) : null}
      {showAddUserView ? (
        <AddUserView
          allGroups={groups}
          enabledUsernames={enabledUsernames}
          onClickSave={setGroupUsers}
          onRequestClose={onAddUserViewClose}
          show={showAddUserView}
          users={users}
        />
      ) : null}
      {showAddDashboardView ? (
        <AddDashboardView
          dashboards={dashboards}
          enabledDashboardACLsMap={enabledDashboardACLsMap}
          onClickSave={setDashboardACLs}
          onRequestClose={onAddDashboardViewClose}
          show={showAddDashboardView}
        />
      ) : null}
      {showAddAlertView && isAlertsEnabled ? (
        <AddAlertView
          alerts={alertDefinitions}
          alertResources={alertResources}
          enabledAlertACLsMap={enabledAlertACLsMap}
          onClickSave={setAlertACLs}
          onRequestClose={onAddAlertViewClose}
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
