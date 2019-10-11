// @flow
import * as React from 'react';

import AlertMessage, { ALERT_TYPE } from 'components/common/AlertMessage';
import AuthorizationResource from 'services/models/AuthorizationResource';
import UserSelect from 'components/common/UserSelect';
import ZenArray from 'util/ZenModel/ZenArray';
import autobind from 'decorators/autobind';
import withScriptLoader from 'components/common/withScriptLoader';
import { VENDOR_SCRIPTS } from 'vendor/registry';
import type IdentityRoleMap from 'services/models/IdentityRoleMap';
import type RoleDefinition from 'services/models/RoleDefinition';
import type User from 'services/models/User';

const TEXT = t('dashboard_builder.dashboard_settings');

type Props = {
  authorizationResource: AuthorizationResource,
  getRoles: () => Promise<ZenArray<RoleDefinition>>,
  getUsers: () => Promise<ZenArray<User>>,
  isActiveTab: boolean,
  onPermissionsChanged: AuthorizationResource => void,

  newUserRole: string,
};

type State = {
  allRoles: ZenArray<RoleDefinition>,
  allUsers: ZenArray<User>,
  defaultNewUserRole: RoleDefinition | void,
};

class UserManagementTab extends React.PureComponent<Props, State> {
  static defaultProps = {
    newUserRole: 'dashboard_viewer',
  };

  state = {
    allUsers: ZenArray.create<User>(),
    allRoles: ZenArray.create<RoleDefinition>(),
    defaultNewUserRole: undefined,
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
    this.initializeUsers();
    this.initializeRoles();
  }

  initializeUsers() {
    this.props
      .getUsers()
      .then(users => {
        this.setState({
          allUsers: users,
        });
      })
      .error(e => {
        window.toastr.error(TEXT.fetch_users_fail);
        console.error(e);
      });
  }

  initializeRoles() {
    this.props
      .getRoles()
      .then(roles => {
        const newUserRole = roles.find(
          role => role.name() === this.props.newUserRole,
        );

        this.setState({
          allRoles: roles,
          defaultNewUserRole: newUserRole,
        });
      })
      .error(e => {
        window.toastr.error(TEXT.fetch_users_fail);
        console.error(e);
      });
  }

  @autobind
  onUserRolesUpdated(userToRoles: IdentityRoleMap) {
    const { authorizationResource } = this.props;
    const updatedResource = authorizationResource
      .deepUpdate()
      .roles()
      .userRoles(userToRoles);
    this.props.onPermissionsChanged(updatedResource);
  }

  renderUserSelector() {
    const { allRoles, allUsers, defaultNewUserRole } = this.state;
    const userRoles = this.props.authorizationResource.roles().userRoles();

    // HACK(stephen): Flow fails to deduce the valid type here.
    const newUserRole = (defaultNewUserRole: any);
    return (
      <UserSelect
        users={allUsers}
        roles={allRoles}
        userToRoles={userRoles}
        onUserRolesUpdated={this.onUserRolesUpdated}
        newUserRole={newUserRole}
      />
    );
  }

  render() {
    if (!this.props.isActiveTab) {
      return null;
    }

    return (
      <div className="user-management-block">
        <div className="user-management-header">
          <AlertMessage type={ALERT_TYPE.INFO}>
            {TEXT.users_tab.additional_users}
          </AlertMessage>
          {this.renderUserSelector()}
        </div>
      </div>
    );
  }
}

export default withScriptLoader(UserManagementTab, VENDOR_SCRIPTS.toastr);
