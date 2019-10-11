// @flow
// NOTE(stephen): Eslint doesn't understand that `newGroupSelection` is used as
// as state variable.
/* eslint-disable react/no-unused-state */
import * as React from 'react';
import Promise from 'bluebird';
import classNames from 'classnames';
import invariant from 'invariant';

import AuthorizationService from 'services/AuthorizationService';
import BaseModal from 'components/ui/BaseModal';
import Button from 'components/ui/Button';
import DirectoryService from 'services/DirectoryService';
import Dropdown from 'components/ui/Dropdown';
import IdentityRoleMap from 'services/models/IdentityRoleMap';
import LegacyButton from 'components/ui/LegacyButton';
import NewGroupModal from 'components/AdminApp/GroupsTab/NewGroupModal';
import ResourceTypeRoleMap from 'services/models/ResourceTypeRoleMap';
import RoleDefinition from 'services/models/RoleDefinition';
import RoleSelect from 'components/common/RoleSelect';
import SecurityGroup from 'services/models/SecurityGroup';
import SwitchGroupModal from 'components/AdminApp/GroupsTab/SwitchGroupModal';
import User from 'services/models/User';
import UserSelect from 'components/common/UserSelect';
import ZenArray from 'util/ZenModel/ZenArray';
import ZenMap from 'util/ZenModel/ZenMap';
import autobind from 'decorators/autobind';
import withScriptLoader from 'components/common/withScriptLoader';
import { VENDOR_SCRIPTS } from 'vendor/registry';
import type { ResourceType } from 'services/AuthorizationService';

const TEXT = t('admin_app.groups');

const GROUP_PROPERTIES = {
  ALL: TEXT.all,
  MANAGE_ROLES: TEXT.roles_property,
  MANAGE_USERS: TEXT.users_property,
};

type Props = {
  /**
   * A callback that is invoked when the user wishes to create a new Security
   * Group
   *
   * @returns {Promise<SecurityGroup>} The newly created group}
   */
  createGroup: string => Promise<SecurityGroup>,

  /**
   * A callback that is invoked when the user wishes to delete the currently
   * selected Security Group
   *
   * @param {SecurityGroup} The security group to delete
   *
   * @returns {Promise} A promise that when completed successfully,
   *                    will indicate that the specified security
   *                    group has been deleted.
   */
  deleteGroup: SecurityGroup => Promise<SecurityGroup>,

  /**
   * A callback that is invoked when the user wishes to fetch a listing of all
   * existing security groups.
   *
   * @returns {Promise<ZenArray<SecurityGroup>>} The listing of all security
   *                                             groups
   */
  getGroups: () => Promise<ZenArray<SecurityGroup>>,

  /**
   * A callback that is invoked when the user wishes to update the users in a
   * given security group.
   *
   * @param {SecurityGroup} group The group to update
   *
   * @param {Array<String>} newUsers The group's new users (by username)
   */
  updateGroupUsers: (
    SecurityGroup,
    $ReadOnlyArray<string>,
  ) => $ReadOnlyArray<string>,

  /**
   * A callback that is invoked when the user wishes to update the roles for
   * a given security group.
   *
   * @param {SecurityGroup} group The group to update
   *
   * @param {ZenMap<ResourceTypeRoleMap>} newRoles An object of resource types
   * to their corresponding RoleMap instance
   */
  updateGroupRoles: (
    SecurityGroup,
    ZenMap<ResourceTypeRoleMap>,
  ) => ZenMap<ResourceTypeRoleMap>,

  /**
   * A callback that is invoked when the user wishes to fetch a listing of all
   * existing users.
   *
   * @returns {Promise<ZenArray<User>>} The listing of all users.
   */
  getUsers: () => Promise<ZenArray<User>>,

  /**
   * A callback that is invoked when the user wishes to fetch a listing of all
   * roles or all roles for a specific resource type.
   *
   * @param {String} resourceType (Optional) The resource type to fetch all
   *                              roles for.
   *
   * @returns {Promise<ZenArray<RoleDefinition>>} A listing of Role objects
   */
  getRoles: (?ResourceType) => Promise<ZenArray<RoleDefinition>>,

  /**
   *
   *
   */
  getResources: (?ResourceType) => Promise<ZenArray<{ [string]: any }>>,

  /**
   *
   */
  getResourceTypes: () => Promise<ZenArray<{ [string]: any }>>,
};

type State = {
  nameToGroupMapping: ZenMap<SecurityGroup>,
  allUsers: ZenArray<User>,
  allRoles: ZenArray<RoleDefinition>,
  allResourceTypes: ZenArray<{ [string]: any }>,
  allResources: ZenArray<{ [string]: any }>,
  currentGroupUsers: IdentityRoleMap,
  currentGroupRoles: ZenMap<ResourceTypeRoleMap>,
  currentGroup: SecurityGroup | void,
  selectedGroupProperty: string,
  newGroupSelection: string | void,
  unsavedChanges: boolean,
  switchGroupModalVisible: boolean,
  newGroupModalVisible: boolean,
  deleteModalVisible: boolean,
};

/**
 * Returns a function that serves as the parameter to the functional setState
 * operation that triggers the workflow from switching the current group
 * to the newly selected group (denoted by `selectedGroupName`)
 *
 * @param {String} newGroupSelection (Optional): The new group to edit in the
 *                                   Groups Tab UI. If not specified, this
 *                                   value is inferred from the
 *                                   `newGroupSelection` property of the state
 *                                   that is passed into this function.
 *
 * @returns {Function} The setState transformation function
 */
function switchActiveGroup(
  newGroupSelection: string | void = undefined,
): State => $Shape<State> {
  return (prevState: State) => {
    const currentGroup = prevState.nameToGroupMapping.get(
      newGroupSelection || prevState.newGroupSelection || '',
    );
    if (!currentGroup) {
      window.toastr.error(TEXT.switch_group_error);
      return {};
    }
    const { users, roles } = currentGroup.modelValues();
    const userMapping = {};
    users.forEach(user => {
      userMapping[user.username()] = ZenArray.create();
    });
    const currentGroupUsers = IdentityRoleMap.create({
      roles: ZenMap.create(userMapping),
      resourceName: currentGroup.name(),
    });

    if (prevState.unsavedChanges) {
      window.toastr.info(TEXT.changes_discarded);
    }

    return {
      currentGroup,
      currentGroupUsers,
      currentGroupRoles: roles,
      switchGroupModalVisible: false,
      unsavedChanges: false,
      newGroupSelection: undefined,
    };
  };
}

// TODO(vedant) - We should compose this component into smaller bits that are
// more reflective of functionality (e.g. move controls into a component,
// move each property editor into its own separate component, etc.ß)
class GroupsTab extends React.PureComponent<Props, State> {
  static defaultProps = {
    createGroup: DirectoryService.createGroup,
    deleteGroup: DirectoryService.deleteGroup,
    getGroups: () =>
      DirectoryService.getGroups().then(groups => ZenArray.create(groups)),
    updateGroupRoles: DirectoryService.updateGroupRoles,
    updateGroupUsers: DirectoryService.updateGroupUsers,

    getUsers: () =>
      DirectoryService.getUsers().then(users => ZenArray.create(users)),

    getRoles: resourceType =>
      AuthorizationService.getRoles(resourceType).then(roles =>
        ZenArray.create(roles),
      ),

    getResources: resourceType =>
      AuthorizationService.getResources(resourceType).then(resources =>
        ZenArray.create(resources),
      ),

    getResourceTypes: () =>
      AuthorizationService.getResourceTypes().then(resourceTypes =>
        ZenArray.create(resourceTypes),
      ),
  };

  state = {
    nameToGroupMapping: ZenMap.create(),
    allUsers: ZenArray.create(),
    allRoles: ZenArray.create(),
    allResourceTypes: ZenArray.create(),
    allResources: ZenArray.create(),
    currentGroupUsers: IdentityRoleMap.create({}),
    currentGroupRoles: ZenMap.ofType(ResourceTypeRoleMap).create(),
    currentGroup: undefined,
    selectedGroupProperty: GROUP_PROPERTIES.ALL,
    newGroupSelection: undefined,
    unsavedChanges: false,
    switchGroupModalVisible: false,
    newGroupModalVisible: false,
    deleteModalVisible: false,
  };

  componentDidMount() {
    this.fetchGroups();
    this.fetchUsers();
    this.fetchResourceTypes();
  }

  @autobind
  hideNewGroupModal() {
    this.onNewGroupModalVisibilityChange(false);
  }

  @autobind
  showDeleteModal() {
    this.onDeleteModalVisibilityChange(true);
  }

  @autobind
  hideDeleteModal() {
    this.onDeleteModalVisibilityChange(false);
  }

  @autobind
  showNewGroupModal() {
    this.setState({
      newGroupModalVisible: true,
      switchGroupModalVisible: false,
      newGroupSelection: undefined,
    });
  }

  fetchGroups() {
    return this.props.getGroups().then(groups => {
      const nameToGroupMapping = ZenMap.fromArray(groups, 'name');
      this.setState({ nameToGroupMapping });
    });
  }

  fetchUsers() {
    return this.props.getUsers().then(allUsers => {
      this.setState({ allUsers });
    });
  }

  fetchResourceTypes() {
    return this.props.getResourceTypes().then(allResourceTypes => {
      this.setState({ allResourceTypes });
    });
  }

  fetchRoles(resourceType: ResourceType | void) {
    return this.props.getRoles(resourceType).then(allRoles => {
      this.setState({ allRoles });
    });
  }

  fetchResources(resourceType: ResourceType | void) {
    return this.props.getResources(resourceType).then(allResources => {
      this.setState({ allResources });
    });
  }

  @autobind
  refreshRoleSelectOptions(resourceType: ResourceType | void) {
    // TODO(vedant). We should build caching functionality into
    // the Authorization and Directory services so that we aren't
    // continuously making network calls to update resources in this
    // fashion.
    return Promise.all([
      this.fetchRoles(resourceType),
      this.fetchResources(resourceType),
    ]);
  }

  @autobind
  onSwitchGroupRequested() {
    this.setState(switchActiveGroup());
  }

  @autobind
  onCreateNewGroup(groupName: string) {
    this.props
      .createGroup(groupName)
      .then(() => {
        window.toastr.success(TEXT.create_group_success);
        this.onNewGroupModalVisibilityChange(false);
        this.fetchGroups();
        this.setState({
          newGroupSelection: groupName,
        });
      })
      .catch(error => {
        window.toastr.error(TEXT.create_group_failed);
        console.error(JSON.stringify(error));
      });
  }

  @autobind
  onNewGroupSelected(selectionValue: string) {
    const { currentGroup } = this.state;

    if (currentGroup && selectionValue === currentGroup.name()) {
      return;
    }

    if (selectionValue === 'new-group') {
      this.showNewGroupModal();
      return;
    }

    const selectedGroupName = selectionValue;
    this.setState(prevState => {
      const selectionUnchanged =
        prevState.currentGroup &&
        prevState.currentGroup.name() === selectedGroupName;

      if (
        prevState.currentGroup === undefined ||
        !prevState.unsavedChanges ||
        selectionUnchanged
      ) {
        return switchActiveGroup(selectedGroupName)(prevState);
      }

      return {
        switchGroupModalVisible: true,
        newGroupSelection: selectedGroupName,
      };
    });

    this.setState({ selectedGroupProperty: GROUP_PROPERTIES.ALL });

    this.fetchGroups();
    this.fetchUsers();
  }

  @autobind
  onGroupDeleteConfirmed() {
    const { currentGroup } = this.state;
    if (currentGroup === undefined) {
      return;
    }

    this.props
      .deleteGroup(currentGroup)
      .then(() => {
        window.toastr.success(TEXT.delete_group_success);
        this.fetchGroups().then(() => {
          this.setState({
            currentGroup: undefined,
            currentGroupUsers: IdentityRoleMap.create({}),
            currentGroupRoles: ZenMap.ofType(ResourceTypeRoleMap).create(),
            deleteModalVisible: false,
            unsavedChanges: false,
            newGroupSelection: undefined,
            selectedGroupProperty: '',
          });
        });
      })
      .catch(error => {
        window.toastr.error(TEXT.delete_group_failed);
        console.error(error);
      });
  }

  @autobind
  onGroupUsersUpdated(currentGroupUsers: IdentityRoleMap) {
    this.setState({
      currentGroupUsers,
      unsavedChanges: true,
    });
  }

  @autobind
  onGroupRolesUpdated(currentGroupRoles: ZenMap<ResourceTypeRoleMap>) {
    this.setState({
      currentGroupRoles,
      unsavedChanges: true,
    });
  }

  @autobind
  onNewGroupSelectionCancelled() {
    this.setState({
      switchGroupModalVisible: false,
      newGroupSelection: undefined,
    });
  }

  onNewGroupModalVisibilityChange(visible: boolean) {
    this.setState({ newGroupModalVisible: visible });
  }

  onDeleteModalVisibilityChange(visible: boolean) {
    this.setState({ deleteModalVisible: visible });
  }

  @autobind
  onGroupPropertySelectionChange(e) {
    const selectedGroupProperty = GROUP_PROPERTIES[e.target.value];
    this.setState({ selectedGroupProperty });
  }

  @autobind
  onSaveGroupChangesClicked() {
    const { currentGroup, currentGroupRoles, currentGroupUsers } = this.state;
    const updatedUsernames = currentGroupUsers.roles().keys();
    invariant(
      currentGroup !== undefined,
      'Current group must exist when saving',
    );
    const updateCalls = Promise.all([
      this.props.updateGroupRoles(currentGroup, currentGroupRoles),
      this.props.updateGroupUsers(currentGroup, updatedUsernames),
    ]);

    updateCalls
      .then(() => {
        window.toastr.success(TEXT.changes_saved_success);
        this.setState({ unsavedChanges: false });
      })
      .catch(error => {
        window.toastr.error(TEXT.changes_saved_error);
        console.error(JSON.stringify(error));
      });
  }

  maybeRenderControlButtons() {
    const { currentGroup, unsavedChanges } = this.state;

    if (!currentGroup) {
      return null;
    }

    const groupIsSelected = currentGroup !== undefined;
    const disableSaveButton = !groupIsSelected || !unsavedChanges;

    return (
      <span className="groups-tab__right-controls">
        <Button
          className="groups-tab__button"
          disabled={disableSaveButton}
          intent={Button.Intents.SUCCESS}
          onClick={this.onSaveGroupChangesClicked}
        >
          {TEXT.save_group_changes}
        </Button>
        {this.maybeRenderDeleteButton()}
      </span>
    );
  }

  maybeRenderDeleteButton() {
    const { nameToGroupMapping, currentGroup } = this.state;
    const groupIsSelected = !!currentGroup;

    if (!groupIsSelected || nameToGroupMapping.isEmpty()) {
      return null;
    }

    return (
      <Button
        className="groups-tab__button"
        disabled={!currentGroup}
        intent={Button.Intents.DANGER}
        onClick={this.showDeleteModal}
      >
        {TEXT.delete_group}
      </Button>
    );
  }

  maybeRenderRoleSelect() {
    const {
      allResources,
      allResourceTypes,
      allRoles,
      currentGroupRoles,
      selectedGroupProperty,
    } = this.state;
    const renderRoleSelect =
      selectedGroupProperty === GROUP_PROPERTIES.ALL ||
      selectedGroupProperty === GROUP_PROPERTIES.MANAGE_ROLES;

    if (renderRoleSelect) {
      return (
        <RoleSelect
          onRolesUpdated={this.onGroupRolesUpdated}
          onNewSelectionChanged={this.refreshRoleSelectOptions}
          currentRoles={currentGroupRoles}
          roles={allRoles}
          resourceTypes={allResourceTypes}
          resources={allResources}
        />
      );
    }

    return null;
  }

  maybeRenderTables() {
    if (!this.state.currentGroup) {
      return null;
    }

    return (
      <React.Fragment>
        {this.maybeRenderRoleSelect()}
        {this.maybeRenderUserSelect()}
      </React.Fragment>
    );
  }

  maybeRenderUserSelect() {
    const { selectedGroupProperty } = this.state;
    const renderUserSelect =
      selectedGroupProperty === GROUP_PROPERTIES.ALL ||
      selectedGroupProperty === GROUP_PROPERTIES.MANAGE_USERS;

    if (renderUserSelect) {
      return (
        <UserSelect
          users={this.state.allUsers}
          roleSelectionEnabled={false}
          userToRoles={this.state.currentGroupUsers}
          onUserRolesUpdated={this.onGroupUsersUpdated}
        />
      );
    }

    return null;
  }

  renderGroupsDropdown() {
    const value = this.state.currentGroup ? this.state.currentGroup.name() : '';

    return (
      <Dropdown
        className="groups-tab__dropdown"
        buttonClassName="groups-tab__dropdown-button"
        onSelectionChange={this.onNewGroupSelected}
        menuMaxHeight={600}
        defaultDisplayContent={TEXT.select_group}
        value={value}
        buttonWidth={200}
        menuWidth={200}
      >
        {this.renderNewGroupOption()}
        {this.renderGroupOptions()}
      </Dropdown>
    );
  }

  renderNewGroupButton() {
    return (
      <LegacyButton onClick={this.showNewGroupModal}>
        <i className="glyphicon glyphicon-plus" aria-hidden />
        {TEXT.create_group}
      </LegacyButton>
    );
  }

  /* eslint-disable class-methods-use-this */
  renderNewGroupOption() {
    return (
      <Dropdown.Option value="new-group">
        <i className="glyphicon glyphicon-plus" aria-hidden />
        <span className="dashboards-dropdown__new-dashboard-option-label">
          {TEXT.create_group}
        </span>
      </Dropdown.Option>
    );
  }

  renderSwitchGroupModal() {
    return (
      <SwitchGroupModal
        onGroupChangeAcknowledged={this.onSwitchGroupRequested}
        onGroupChangeCancelled={this.onNewGroupSelectionCancelled}
        show={this.state.switchGroupModalVisible}
      />
    );
  }

  renderNewGroupModal() {
    return (
      <NewGroupModal
        onRequestClose={this.hideNewGroupModal}
        onCreateGroupRequested={this.onCreateNewGroup}
        show={this.state.newGroupModalVisible}
      />
    );
  }

  renderDeleteGroupModal() {
    return (
      <BaseModal
        primaryButtonIntent={BaseModal.Intents.DANGER}
        onRequestClose={this.hideDeleteModal}
        show={this.state.deleteModalVisible}
        title={TEXT.delete_group}
        onPrimaryAction={this.onGroupDeleteConfirmed}
        defaultHeight={250}
      >
        <h4>{TEXT.delete_group_warning}</h4>
      </BaseModal>
    );
  }

  renderGroupOptions() {
    return this.state.nameToGroupMapping.values().map(group => (
      <Dropdown.Option key={group.name()} value={group.name()}>
        {group.name()}
      </Dropdown.Option>
    ));
  }

  renderGroupPropertyDropdown() {
    if (!this.state.currentGroup) {
      return null;
    }

    const { selectedGroupProperty } = this.state;

    const propertyButtons = Object.keys(GROUP_PROPERTIES).map(option => {
      const optionName = GROUP_PROPERTIES[option];
      const btnClassName = classNames('groups-tab__property', {
        'groups-tab__property--selected': selectedGroupProperty === optionName,
      });

      return (
        <button
          className={btnClassName}
          key={option}
          value={option}
          onClick={this.onGroupPropertySelectionChange}
          type="button"
        >
          {optionName}
        </button>
      );
    });

    return <div className="property-wrapper">{propertyButtons}</div>;
  }

  renderTopLevelControls() {
    if (this.state.nameToGroupMapping.isEmpty()) {
      return this.renderNewGroupButton();
    }

    return (
      <div className="groups-tab__controls">
        {this.renderGroupsDropdown()}
        {this.renderGroupPropertyDropdown()}
        {this.maybeRenderControlButtons()}
      </div>
    );
  }

  render() {
    return (
      <div className="groups-tab">
        {this.renderTopLevelControls()}
        {this.maybeRenderTables()}
        {this.renderSwitchGroupModal()}
        {this.renderNewGroupModal()}
        {this.renderDeleteGroupModal()}
      </div>
    );
  }
}

export default withScriptLoader(GroupsTab, VENDOR_SCRIPTS.toastr);
