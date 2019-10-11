// @flow
import * as React from 'react';
import invariant from 'invariant';

import AlertMessage, { ALERT_TYPE } from 'components/common/AlertMessage';
import BaseModal from 'components/ui/BaseModal';
import ResourceDropdown from 'components/common/RoleSelect/NewRoleModal/ResourceDropdown';
import ResourceTypeDropdown from 'components/common/RoleSelect/NewRoleModal/ResourceTypeDropdown';
import Role from 'services/models/Role';
import RoleDropdown from 'components/common/RoleSelect/NewRoleModal/RoleDropdown';
import ZenArray from 'util/ZenModel/ZenArray';
import autobind from 'decorators/autobind';
import {
  RESOURCE_TYPES,
  RESOURCE_TYPE_VALUES,
} from 'services/AuthorizationService';
import { SITEWIDE_LABEL } from 'components/common/RoleSelect/constants';
import type RoleDefinition from 'services/models/RoleDefinition';
import type {
  ResourceResponse,
  ResourceType,
  ResourceTypeResponse,
} from 'services/AuthorizationService';

const TEXT = t('common.role_select.new_role_modal');

type BaseModalProps = $Diff<
  React.ElementConfig<typeof BaseModal>,
  {
    disablePrimaryButton: *,
    onPrimaryAction: *,
    primaryButtonText: *,
  },
>;

type Props = BaseModalProps & {
  // TODO(vedant) - As dicussed with Pablo, we should differentiate between
  // a fully constructed role and a role selection in progress (e.g. with a
  // `ProtoRole` and a `Role`)

  onSelectionsChanged: (ResourceType | void) => void,

  /**
   * A callback that is invoked when the user has completed the process of
   * selecting a role name, resource type and resource.
   *
   * @param {Role} role The completed role selection
   */
  onSelectionCompleted: (role: Role) => void,

  /** The current selections for the Role */
  initialSelections: Role | void,

  /**
   * The listing of all the applicable resource types that the user can
   * select.
   */
  resourceTypes: ZenArray<ResourceTypeResponse>,

  /**
   * The listing of all the applicable roles that the user can select for
   * the selected `resourceType` and `resourceName` in the `selections`
   * property
   */
  roles: ZenArray<RoleDefinition>,

  /**
   * The listing of all the applicable resources that the user can select
   * for the selected `resourceType` in the `selections` property
   */
  resources: ZenArray<ResourceResponse>,

  /**
   * The label for a sitewide-selection for a resource.
   */
  sitewideResourceLabel: string,
};

type State = {
  resourceType: ResourceType | void,
  resourceName: string | void,
  roleName: string | void,
};

/**
 * A modal that allows a user to select a `Role` for a given resource
 * and resource type.
 */
export default class NewRoleModal extends React.PureComponent<Props, State> {
  static defaultProps = {
    initialSelections: undefined,
    resourceTypes: ZenArray.create<ResourceTypeResponse>(),
    roles: ZenArray.create<RoleDefinition>(),
    resources: ZenArray.create<ResourceResponse>(),
    sitewideResourceLabel: SITEWIDE_LABEL,
    title: TEXT.title,
  };

  constructor(props: Props) {
    super(props);
    const { initialSelections } = props;
    this.state = {
      resourceType: undefined,
      resourceName: undefined,
      roleName: undefined,
    };
    if (initialSelections !== undefined) {
      this.state.resourceType = initialSelections.resourceType();
      this.state.resourceName = initialSelections.resourceName();
      this.state.roleName = initialSelections.roleName();
    }
  }

  @autobind
  onSelectionsChanged() {
    this.props.onSelectionsChanged(this.state.resourceType);
  }

  @autobind
  onResourceTypeUpdated(event: SyntheticEvent<HTMLSelectElement>) {
    const { value } = event.currentTarget;
    invariant(
      RESOURCE_TYPE_VALUES.includes(value),
      `Invalid resource type supplied: ${value}`,
    );
    const resourceType: ResourceType = (value: any);
    this.setState({ resourceType }, this.onSelectionsChanged);
  }

  @autobind
  onRoleUpdated(event: SyntheticEvent<HTMLSelectElement>) {
    const roleName = event.currentTarget.value;
    this.setState({ roleName }, this.onSelectionsChanged);
  }

  @autobind
  onResourceUpdated(event: SyntheticEvent<HTMLSelectElement>) {
    const resourceLabel = event.currentTarget.value;
    const resourceName =
      resourceLabel === this.props.sitewideResourceLabel ? '' : resourceLabel;

    this.setState({ resourceName }, this.onSelectionsChanged);
  }

  @autobind
  onSelectionCompleted() {
    this.setState(() => {
      const { resourceType, resourceName, roleName } = this.state;
      if (
        resourceType !== undefined &&
        resourceName !== undefined &&
        roleName !== undefined
      ) {
        this.props.onSelectionCompleted(
          Role.create({
            resourceType,
            resourceName,
            roleName,
          }),
        );
      }
      return {
        resourceType: undefined,
        resourceName: undefined,
        roleName: undefined,
      };
    });
  }

  maybeRenderSitewideWarning() {
    const { resourceType, roleName, resourceName } = this.state;
    const siteResourceTypeSelected = resourceType === RESOURCE_TYPES.SITE;

    if (
      siteResourceTypeSelected ||
      (resourceType && roleName && resourceName === '')
    ) {
      return (
        <AlertMessage className="row" type={ALERT_TYPE.INFO}>
          {TEXT.selected_sitewide_role}
        </AlertMessage>
      );
    }

    return null;
  }

  renderResourceTypeDropdown() {
    const { resourceType } = this.state;

    return (
      <ResourceTypeDropdown
        onResourceTypeUpdated={this.onResourceTypeUpdated}
        resourceTypes={this.props.resourceTypes}
        selectedResourceType={resourceType}
      />
    );
  }

  renderRoleDropdown() {
    const { resourceType, roleName } = this.state;

    return (
      <RoleDropdown
        onRoleUpdated={this.onRoleUpdated}
        roles={this.props.roles}
        selectedResourceType={resourceType}
        selectedRole={roleName}
      />
    );
  }

  renderResourceDropdown() {
    const { sitewideResourceLabel, resources } = this.props;
    const { resourceName, resourceType, roleName } = this.state;

    return (
      <ResourceDropdown
        onResourceUpdated={this.onResourceUpdated}
        resources={resources}
        selectedResource={resourceName}
        selectedResourceType={resourceType}
        selectedRole={roleName}
        sitewideResourceLabel={sitewideResourceLabel}
      />
    );
  }

  render() {
    const { resourceType, roleName, resourceName } = this.state;
    const disablePrimaryButton =
      resourceType === undefined ||
      roleName === undefined ||
      resourceName === undefined;

    return (
      <BaseModal
        {...this.props}
        disablePrimaryButton={disablePrimaryButton}
        onPrimaryAction={this.onSelectionCompleted}
        primaryButtonText={TEXT.add_role}
      >
        <div className="new-role-modal-body">
          <div className="row">{this.maybeRenderSitewideWarning()}</div>
          <div className="row">
            <div className="col-md-4">{this.renderResourceTypeDropdown()}</div>
            <div className="col-md-4">{this.renderRoleDropdown()}</div>
            <div className="col-md-4">{this.renderResourceDropdown()}</div>
          </div>
        </div>
      </BaseModal>
    );
  }
}
