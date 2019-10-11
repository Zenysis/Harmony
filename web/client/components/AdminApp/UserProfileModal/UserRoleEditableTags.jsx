// @flow
import * as React from 'react';

import LegacyButton from 'components/ui/LegacyButton';
import NewRoleModal from 'components/common/RoleSelect/NewRoleModal';
import ResourceTypeRoleMap from 'services/models/ResourceTypeRoleMap';
import Tag from 'components/ui/Tag';
import User from 'services/models/User';
import ZenArray from 'util/ZenModel/ZenArray';
import autobind from 'decorators/autobind';
import type Role from 'services/models/Role';
import type RoleDefinition from 'services/models/RoleDefinition';
import type {
  ResourceResponse,
  ResourceType,
  ResourceTypeResponse,
} from 'services/AuthorizationService';
import type { TagMetadata } from 'components/AdminApp/UserProfileModal';

type Props = {
  onUserRolesUpdated: (user: User) => void,
  onResourceTypeChanged: (ResourceType | void) => void,
  roleTags: ZenArray<TagMetadata>,
  user: User,
  roles: ZenArray<RoleDefinition>,
  resourceTypes: ZenArray<ResourceTypeResponse>,
  resources: ZenArray<ResourceResponse>,
};

type State = {
  addRoleModalVisible: boolean,
};

export default class UserRoleEditableTags extends React.PureComponent<
  Props,
  State,
> {
  constructor(props: Props) {
    super(props);
    this.state = {
      addRoleModalVisible: false,
    };
  }

  @autobind
  onAddRoleClicked() {
    this.setState({ addRoleModalVisible: true });
  }

  @autobind
  onAddRoleCancelled() {
    this.setState({ addRoleModalVisible: false });
  }

  @autobind
  onRoleAdded(role: Role) {
    const { user, onUserRolesUpdated } = this.props;
    const updatedUser: User = user.roles(
      ResourceTypeRoleMap.MapUtil.addRole(role, user.roles()),
    );

    this.setState({ addRoleModalVisible: false }, () =>
      onUserRolesUpdated(updatedUser),
    );
  }

  @autobind
  onRoleDeleted(value: Role) {
    const { user, onUserRolesUpdated } = this.props;
    const updatedUser: User = user.roles(
      ResourceTypeRoleMap.MapUtil.deleteRole(value, user.roles()),
    );
    onUserRolesUpdated(updatedUser);
  }

  maybeRenderAddRoleModal() {
    if (!this.state.addRoleModalVisible) {
      return null;
    }

    const {
      onResourceTypeChanged,
      resourceTypes,
      resources,
      roles,
    } = this.props;

    // TODO(vedant, pablo) - Modals are cool and all but a modal within a modal
    // is not a great design. We need to figure out how to better enable
    // selection and role delegation here.
    return (
      <NewRoleModal
        onSelectionsChanged={onResourceTypeChanged}
        onSelectionCompleted={this.onRoleAdded}
        onRequestClose={this.onAddRoleCancelled}
        resourceTypes={resourceTypes}
        resources={resources}
        roles={roles}
        show={this.state.addRoleModalVisible}
        showPrimaryButton
      />
    );
  }

  render() {
    const { roleTags } = this.props;
    const tags = roleTags.mapValues((tag: TagMetadata) => (
      <Tag
        removable
        className="user-profile__tag"
        onRequestRemove={this.onRoleDeleted}
        value={tag.value}
        key={tag.key}
        size={Tag.Sizes.SMALL}
      >
        {tag.displayContents}
      </Tag>
    ));

    return (
      <div>
        <div className="row">
          <div className="col-xs-1 dropdown-col">
            <LegacyButton onClick={this.onAddRoleClicked}>+</LegacyButton>
          </div>
          <div className="col-xs-11">{tags}</div>
        </div>
        {this.maybeRenderAddRoleModal()}
      </div>
    );
  }
}
