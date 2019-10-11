// @flow
import React from 'react';

import AlertMessage, { ALERT_TYPE } from 'components/common/AlertMessage';
import AuthorizationResource from 'services/models/AuthorizationResource';
import Checkbox from 'components/ui/Checkbox';
import DefaultRole from 'services/models/Role/DefaultRole';
import LabelWrapper from 'components/ui/LabelWrapper';
import RoleDefinition from 'services/models/RoleDefinition';
import ZenArray from 'util/ZenModel/ZenArray';
import autobind from 'decorators/autobind';
import withScriptLoader from 'components/common/withScriptLoader';
import { VENDOR_SCRIPTS } from 'vendor/registry';
import type { ResourceType } from 'services/AuthorizationService';

const PARENT_TEXT = t('dashboard_builder.dashboard_settings');
const TEXT = PARENT_TEXT.public_users_tab;

type Props = {
  authorizationResource: AuthorizationResource,
  checkCanPublish: () => Promise<boolean>,
  getRoles: () => Promise<ZenArray<RoleDefinition>>,
  isActiveTab: boolean,
  onPermissionsChanged: (updatedResource: AuthorizationResource) => void,
  publicAccessEnabled: boolean,
};

type State = {
  allRoles: ZenArray<RoleDefinition>,
  canPublish: boolean,
};

class PublicUsersTab extends React.PureComponent<Props, State> {
  state = {
    allRoles: ZenArray.create(),
    canPublish: false,
  };

  componentDidMount() {
    if (this.props.isActiveTab) {
      this.initializeData();
    }
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.isActiveTab && this.props.isActiveTab) {
      this.initializeData();
    }
  }

  initializeData() {
    this.initializeRoles();
    this.initializeCanPublish();
  }

  initializeRoles() {
    return this.props
      .getRoles()
      .then(allRoles => {
        this.setState({
          allRoles,
        });
      })
      .error(e => {
        window.toastr.error(PARENT_TEXT.fetch_users_fail);
        console.error(e);
      });
  }

  initializeCanPublish() {
    this.props.checkCanPublish().then(canPublish => {
      this.setState({ canPublish });
    });
  }

  @autobind
  onRoleSelected(roleSelected: boolean, roleName: string) {
    const { authorizationResource } = this.props;

    // $ZenModelReadOnlyIssue
    const resourceType: ResourceType = authorizationResource.resourceType();
    const newRole = DefaultRole.create({
      resourceName: authorizationResource.name(),
      resourceType,
      roleName,
      applyToUnregistered: false,
    });

    let updatedResource;
    const defaultRoles = authorizationResource.roles().defaultRoles();
    if (roleSelected) {
      updatedResource = authorizationResource
        .deepUpdate()
        .roles()
        .defaultRoles(defaultRoles.deleteRole(newRole));
    } else {
      updatedResource = authorizationResource
        .deepUpdate()
        .roles()
        .defaultRoles(defaultRoles.addRole(newRole));
    }

    this.props.onPermissionsChanged(updatedResource);
  }

  @autobind
  onRolePublicAccessSelected(applyToUnregistered: boolean, roleName: string) {
    const { authorizationResource } = this.props;

    // $ZenModelReadOnlyIssue
    const resourceType: ResourceType = authorizationResource.resourceType();
    const newRole = DefaultRole.create({
      resourceName: authorizationResource.name(),
      resourceType,
      roleName,
      applyToUnregistered,
    });

    const defaultRoles = authorizationResource.roles().defaultRoles();
    const updatedResource = authorizationResource
      .deepUpdate()
      .roles()
      .defaultRoles(defaultRoles.addRole(newRole));
    this.props.onPermissionsChanged(updatedResource);
  }

  maybeRenderPublisherWarning() {
    const { publicAccessEnabled } = this.props;
    const { canPublish } = this.state;

    if (!canPublish || publicAccessEnabled) {
      return null;
    }

    return (
      <AlertMessage type={ALERT_TYPE.WARNING}>
        {TEXT.public_access_warning}
      </AlertMessage>
    );
  }

  maybeRenderPublishCheckbox(
    roleName: string,
    applyToUnregistered: boolean,
    checkboxDisabled: boolean,
  ) {
    const { canPublish } = this.state;

    if (!canPublish) {
      return null;
    }

    return (
      <div className="col-xs-6">
        <LabelWrapper
          inline
          label={TEXT.allow_unregistered}
          htmlFor={`${roleName}_public`}
        >
          <Checkbox
            id={`${roleName}_public`}
            name={roleName}
            onChange={this.onRolePublicAccessSelected}
            value={applyToUnregistered}
            disabled={checkboxDisabled}
          />
        </LabelWrapper>
      </div>
    );
  }

  renderRoleCheckboxes() {
    const { authorizationResource } = this.props;
    const { allRoles } = this.state;

    return allRoles.map((roleDefinition: RoleDefinition) => {
      const { name, label } = roleDefinition.modelValues();
      const role = authorizationResource
        .roles()
        .defaultRoles()
        .getRole(name);
      let roleEnabled: boolean = false;
      let applyToUnregistered: boolean = false;

      // Data is not yet loaded, wait until is.
      if (role) {
        roleEnabled = authorizationResource.roles().allUsersHaveRole(role);
        applyToUnregistered = roleEnabled && role.applyToUnregistered();
      }

      return (
        <div key={name}>
          <div className="col-xs-6">
            <LabelWrapper inline label={label} htmlFor={name}>
              <Checkbox
                id={name}
                name={name}
                onChange={this.onRoleSelected}
                value={roleEnabled}
              />
            </LabelWrapper>
          </div>
          {this.maybeRenderPublishCheckbox(
            name,
            applyToUnregistered,
            !roleEnabled,
          )}
        </div>
      );
    });
  }

  render() {
    const { isActiveTab } = this.props;
    if (!isActiveTab) {
      return null;
    }

    const { canPublish } = this.state;
    const title: string = canPublish ? TEXT.subtitle_publisher : TEXT.subtitle;

    return (
      <div className="public-users-body">
        {this.maybeRenderPublisherWarning()}
        <h4>{title}</h4>
        <div className="row">{this.renderRoleCheckboxes()}</div>
      </div>
    );
  }
}

export default withScriptLoader(PublicUsersTab, VENDOR_SCRIPTS.toastr);
