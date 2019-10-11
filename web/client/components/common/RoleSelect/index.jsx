// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import Button from 'components/ui/Button';
import NewRoleModal from 'components/common/RoleSelect/NewRoleModal';
import ResourceTypeRoleMap from 'services/models/ResourceTypeRoleMap';
import Role from 'services/models/Role';
import RoleDefinition from 'services/models/RoleDefinition';
import RoleRow from 'components/common/RoleSelect/RoleRow';
import Table from 'components/ui/Table';
import autobind from 'decorators/autobind';
import withScriptLoader from 'components/common/withScriptLoader';
import {
  HEADERS,
  TEXT,
  SITEWIDE_LABEL,
} from 'components/common/RoleSelect/constants';
import { VENDOR_SCRIPTS } from 'vendor/registry';
import type {
  ResourceResponse,
  ResourceType,
  ResourceTypeResponse,
} from 'services/AuthorizationService';

/**
  RoleSelect is used to offer a Dropdown to manage a complex list of individual
  role objects. It is used during User Group Administration but can be used to
  manage roles for other entities including Individual Users.
*/
type Props = {
  onNewSelectionChanged: (ResourceType | void) => void,

  /**
   * The callback that is invoked whenever the role mapping
   * is updated. The callback is invoked whenever a role is
   * added or deleted.
   *
   * @param {ZenMap<ResourceTypeRoleMap>} The updated role mapping.
   */
  onRolesUpdated: (Zen.Map<ResourceTypeRoleMap>) => void,

  /**
   * A mapping of the current roles that the User/SecurityGroup currently
   * holds.
   */
  currentRoles: Zen.Map<ResourceTypeRoleMap>,
  /**
   * The listing of all the applicable resource types that the user can
   * select.
   */
  resourceTypes: Zen.Array<ResourceTypeResponse>,

  /**
   * The listing of all the applicable resources that the user can select
   * for the selected `resourceType` in the `newRoleSelections` property
   */
  resources: Zen.Array<ResourceResponse>,

  /**
   * The listing of all the applicable roles that the user can select for
   * the selected `resourceType` and `resourceName` in the `newRoleSelections`
   * property
   */
  roles: Zen.Array<RoleDefinition>,

  /**
   * The label for a sitewide-selection for a resource.
   */
  sitewideResourceLabel: string,
};

type State = {
  addRoleModalVisible: boolean,
};

class RoleSelect extends React.PureComponent<Props, State> {
  static defaultProps = {
    currentRoles: Zen.Map.create(),
    resourceTypes: Zen.Array.create(),
    resources: Zen.Array.create(),
    roles: Zen.Array.create(),
    sitewideResourceLabel: SITEWIDE_LABEL,
  };

  state = {
    addRoleModalVisible: false,
  };

  @autobind
  getRoleSearchKeywords(role: Role) {
    const { resourceName, resourceType, roleName } = role.modelValues();
    const { sitewideResourceLabel } = this.props;
    const searchableResourceName = resourceName || sitewideResourceLabel;
    return [searchableResourceName, resourceType, roleName];
  }

  @autobind
  onAddRoleClicked() {
    this.setState({ addRoleModalVisible: true });
  }

  @autobind
  onAddRoleCancelled() {
    this.setState({ addRoleModalVisible: false }, () =>
      this.props.onNewSelectionChanged(undefined),
    );
  }

  @autobind
  onRoleDeleted(deletedRole: Role) {
    const { currentRoles } = this.props;
    const updatedRoles = ResourceTypeRoleMap.MapUtil.deleteRole(
      deletedRole,
      currentRoles,
    );
    this.props.onRolesUpdated(updatedRoles);
  }

  @autobind
  onRoleAdded(newRoleSelections: Role) {
    this.setState({ addRoleModalVisible: false }, () => {
      const { currentRoles } = this.props;
      const updatedRoles = ResourceTypeRoleMap.MapUtil.addRole(
        newRoleSelections,
        currentRoles,
      );

      if (updatedRoles === this.props.currentRoles) {
        window.toastr.info(TEXT.role_already_selected);
      } else {
        this.props.onRolesUpdated(updatedRoles);
      }

      this.props.onNewSelectionChanged(undefined);
    });
  }

  maybeRenderAddRoleModal() {
    if (!this.state.addRoleModalVisible) {
      return null;
    }

    const {
      onNewSelectionChanged,
      roles,
      resourceTypes,
      resources,
      sitewideResourceLabel,
    } = this.props;

    return (
      <NewRoleModal
        onSelectionsChanged={onNewSelectionChanged}
        onSelectionCompleted={this.onRoleAdded}
        onRequestClose={this.onAddRoleCancelled}
        resourceTypes={resourceTypes}
        resources={resources}
        roles={roles}
        show={this.state.addRoleModalVisible}
        sitewideResourceLabel={sitewideResourceLabel}
        showPrimaryButton
      />
    );
  }

  renderRoleRows() {
    const { currentRoles } = this.props;
    const roles = ResourceTypeRoleMap.MapUtil.flatten(currentRoles);
    const rows = roles.map(role => this.renderRoleRow(role));
    return rows;
  }

  @autobind
  renderRoleRow(role) {
    const { resourceName, resourceType, roleName } = role.modelValues();
    const { sitewideResourceLabel } = this.props;
    const id = `${resourceType}-${resourceName}-${roleName}`;

    return (
      <Table.Row id={id}>
        <RoleRow
          data={role}
          onRemoveClick={this.onRoleDeleted}
          roleName={roleName}
          resourceName={resourceName}
          resourceType={resourceType}
          sitewideResourceLabel={sitewideResourceLabel}
        />
      </Table.Row>
    );
  }

  render() {
    const { currentRoles } = this.props;
    const roles = ResourceTypeRoleMap.MapUtil.flatten(currentRoles);

    return (
      <div className="role-select">
        <div className="role-controls">
          <Button className="button-add-role" onClick={this.onAddRoleClicked}>
            {TEXT.add_role}
          </Button>
        </div>
        {this.maybeRenderAddRoleModal()}
        <div className="role-list">
          <Table
            data={roles}
            headers={HEADERS}
            getSearchKeywords={this.getRoleSearchKeywords}
            renderRow={this.renderRoleRow}
          />
        </div>
      </div>
    );
  }
}

export default withScriptLoader(RoleSelect, VENDOR_SCRIPTS.toastr);
