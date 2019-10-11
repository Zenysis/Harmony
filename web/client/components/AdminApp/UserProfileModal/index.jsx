// @flow
import Promise from 'bluebird';
import React from 'react';

import BaseModal from 'components/ui/BaseModal';
import Dropdown from 'components/ui/Dropdown';
import InputText from 'components/ui/InputText';
import ResourceTypeRoleMap from 'services/models/ResourceTypeRoleMap';
import Role from 'services/models/Role';
import RoleDefinition from 'services/models/RoleDefinition';
import User, { USER_STATUS } from 'services/models/User';
import UserRoleDisplayTags from 'components/AdminApp/UserProfileModal/UserRoleDisplayTags';
import UserRoleEditableTags from 'components/AdminApp/UserProfileModal/UserRoleEditableTags';
import ZenArray from 'util/ZenModel/ZenArray';
import autobind from 'decorators/autobind';
import withScriptLoader from 'components/common/withScriptLoader';
import {
  USER_PROFILE_FIELD,
  USER_STATUS_TRANSLATIONS,
} from 'components/AdminApp/constants';
import { VENDOR_SCRIPTS } from 'vendor/registry';
import type { Intent } from 'components/ui/Intents';
import type {
  ResourceResponse,
  ResourceType,
  ResourceTypeResponse,
} from 'services/AuthorizationService';
import type { UserProfileField } from 'components/AdminApp/constants';

const {
  FIRST_NAME,
  LAST_NAME,
  EMAIL,
  PHONE_NUMBER,
  STATUS,
  USER_ROLES,
} = USER_PROFILE_FIELD;
const FIELDS = [FIRST_NAME, LAST_NAME, EMAIL, PHONE_NUMBER, STATUS, USER_ROLES];

const TEXT = t('admin_app.userProfileModal');

const NAME_PATTERN = '(^[A-zÀ-ÿ0-9]+[A-zÀ-ÿ0-9-_ ]*[A-zÀ-ÿ0-9]*)$';
const NAME_REGEX = RegExp(NAME_PATTERN);
// Don't know how to indicate that this is a regex string.
// eslint-disable-next-line no-useless-escape
const EMAIL_REGEX = RegExp('(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$)');

export type TagMetadata = {
  value: Role,
  key: string,
  displayContents: string,
};

type FieldToUpdateMethodMapping = { [string]: (value: any) => void };

type Props = {
  getResources: (
    resourceType: ?ResourceType,
  ) => Promise<ZenArray<ResourceResponse>>,
  getResourceTypes: () => Promise<ZenArray<ResourceTypeResponse>>,
  getRoles: (resourceType: ?ResourceType) => Promise<ZenArray<RoleDefinition>>,
  onUserUpdated: (updatedUser: User) => void,
  resendUserInvite: () => Promise<void>,
  resetUserPassword: () => Promise<void>,
  show: boolean,
  user: User,
};

type State = {
  editing: boolean,
  editedUser: User,
  resendingInvite: boolean,
  resources: ZenArray<ResourceResponse>,
  resourceTypes: ZenArray<ResourceTypeResponse>,
  roles: ZenArray<RoleDefinition>,
  sendingResetPassword: boolean,
  validFieldValues: boolean,
};

class UserProfileModal extends React.PureComponent<Props, State> {
  _fieldToUpdateMethod: FieldToUpdateMethodMapping;

  constructor(props: Props) {
    super(props);
    this.state = {
      editing: false,
      editedUser: this.props.user,
      resendingInvite: false,
      resources: ZenArray.create(),
      resourceTypes: ZenArray.create(),
      roles: ZenArray.create(),
      sendingResetPassword: false,
      validFieldValues: true,
    };

    const _fieldToUpdateMethod: FieldToUpdateMethodMapping = {};
    FIELDS.forEach((field: UserProfileField) => {
      const { fieldName } = field;
      const updateFieldMethod = this.onUserFieldUpdated.bind(this, fieldName);
      _fieldToUpdateMethod[fieldName] = updateFieldMethod;
    });

    this._fieldToUpdateMethod = _fieldToUpdateMethod;
  }

  componentDidMount() {
    this.fetchResourceTypes();
  }

  componentDidUpdate(prevProps: Props): void {
    // TODO(vedant) - Offer the user a prompt to see if they want to overwrite
    // the changes they've made to User with the latest value being passed in
    // from props.
    if (!this.state.editing && this.props.user !== prevProps.user) {
      this.setState({ editedUser: this.props.user });
    }
  }

  getPrimaryButtonText(): string {
    return this.state.editing ? TEXT.save : TEXT.edit;
  }

  getPrimaryButtonIntent(): Intent {
    return this.state.editing
      ? BaseModal.Intents.SUCCESS
      : BaseModal.Intents.PRIMARY;
  }

  getSecondaryButtonText(): string {
    if (this.isUserPending()) {
      return this.state.resendingInvite
        ? TEXT.sending_invite
        : TEXT.resend_invite;
    }

    return this.state.sendingResetPassword
      ? TEXT.resetting_password
      : TEXT.reset_password;
  }

  getUserFieldValue(field: UserProfileField): any {
    const user = this.state.editedUser;
    const { fieldName } = field;

    if (fieldName === USER_ROLES.fieldName) {
      const roleTags: Array<TagMetadata> = ResourceTypeRoleMap.MapUtil.flatten(
        user.roles(),
      ).map(role => {
        const roleName = role.roleName();
        const resourceName = role.resourceName()
          ? role.resourceName()
          : TEXT.sitewide_permission;

        // If the role does not have a resource property, then the
        // role applies to any resource on the site.
        const label = `${roleName} (${resourceName})`;

        const output: TagMetadata = {
          value: role,
          key: label,
          displayContents: label,
        };
        return output;
      });
      return ZenArray.create(roleTags);
    }

    return user[fieldName]();
  }

  fetchResourceTypes() {
    return this.props.getResourceTypes().then(resourceTypes => {
      this.setState({ resourceTypes });
    });
  }

  fetchRoles(resourceType: ResourceType | void) {
    return this.props.getRoles(resourceType).then(roles => {
      this.setState({ roles });
    });
  }

  fetchResources(resourceType: ResourceType | void) {
    return this.props.getResources(resourceType).then(resources => {
      this.setState({ resources });
    });
  }

  isUserPending(): boolean {
    return this.state.editedUser.status() === USER_STATUS.PENDING;
  }

  editsAreValid() {
    const { editedUser } = this.state;
    const { username, firstName, lastName } = editedUser.modelValues();

    return (
      NAME_REGEX.test(firstName) &&
      (NAME_REGEX.test(lastName) || !lastName.trim()) &&
      EMAIL_REGEX.test(username)
    );
  }

  @autobind
  refreshRoleSelections(resourceType: ResourceType | void): void {
    this.fetchRoles(resourceType);
    this.fetchResources(resourceType);
  }

  saveEditedProfile(): void {
    if (this.editsAreValid()) {
      this.setState({ editing: false }, () =>
        this.props.onUserUpdated(this.state.editedUser),
      );
    } else {
      window.toastr.warning(TEXT.invalid_user_fields);
    }
  }

  startEditing(): void {
    this.setState({ editing: true });
  }

  @autobind
  onSecondaryButtonClick(): void {
    if (this.isUserPending()) {
      // Pending user: secondary action is to resend invite
      if (this.state.resendingInvite) {
        // do not send again if we're already in the middle of resending
        return;
      }
      this.setState({ resendingInvite: true });
      // Send invite
      this.props
        .resendUserInvite()
        .then(() => {
          this.setState({ resendingInvite: false });
          window.toastr.success(TEXT.invite_resent);
        })
        .catch(error => {
          window.toastr.error(TEXT.invite_resend_failure);
          console.error(error);
        });
    } else {
      this.setState({ sendingResetPassword: true }, () =>
        this.props
          .resetUserPassword()
          .then(() => this.setState({ sendingResetPassword: false })),
      );
    }
  }

  @autobind
  onPrimaryButtonClick(): void {
    if (this.state.editing) {
      this.saveEditedProfile();
    } else {
      this.startEditing();
    }
  }

  @autobind
  onUserFieldUpdated(fieldName: string, fieldValue: any) {
    this.setState((prevState: State) => ({
      editedUser: prevState.editedUser[fieldName](fieldValue),
    }));
  }

  @autobind
  onUserRolesUpdated(user: User) {
    if (user.roles() === this.state.editedUser.roles()) {
      window.toastr.info(TEXT.role_already_selected);
    } else {
      this.setState({ editedUser: user });
    }
  }

  renderEditableValue(field: UserProfileField) {
    const { fieldName } = field;
    const updateFieldMethod = this._fieldToUpdateMethod[fieldName];
    const value = this.getUserFieldValue(field);

    if (fieldName === STATUS.fieldName) {
      if (this.isUserPending()) {
        return <div>{t(`admin_app.user_status_values.${value}`)}</div>;
      }

      const options = Object.keys(USER_STATUS_TRANSLATIONS).map(optionKey => {
        const { key, displayContents } = USER_STATUS_TRANSLATIONS[optionKey];

        if (key === USER_STATUS.PENDING) {
          return null;
        }

        return (
          <Dropdown.Option key={key} value={key}>
            {displayContents}
          </Dropdown.Option>
        );
      });
      return (
        <Dropdown
          className="user-profile-dropdown"
          onSelectionChange={updateFieldMethod}
          value={value}
        >
          {options}
        </Dropdown>
      );
    }
    if (fieldName === USER_ROLES.fieldName) {
      const { resourceTypes, resources, roles } = this.state;

      return (
        <UserRoleEditableTags
          roleTags={value}
          user={this.state.editedUser}
          onUserRolesUpdated={this.onUserRolesUpdated}
          onResourceTypeChanged={this.refreshRoleSelections}
          resourceTypes={resourceTypes}
          resources={resources}
          roles={roles}
        />
      );
    }
    if (fieldName === EMAIL.fieldName) {
      return (
        <InputText.Uncontrolled
          type="email"
          onChange={updateFieldMethod}
          initialValue={value}
        />
      );
    }

    return (
      <InputText.Uncontrolled
        type="text"
        onChange={updateFieldMethod}
        initialValue={value}
      />
    );
  }

  renderDisplayValue(field: UserProfileField) {
    const { fieldName } = field;
    const value = this.getUserFieldValue(field);
    if (fieldName === STATUS.fieldName) {
      return <div>{t(`admin_app.user_status_values.${value}`)}</div>;
    }

    if (fieldName === USER_ROLES.fieldName) {
      return <UserRoleDisplayTags roleTags={value} />;
    }

    return <div>{value}</div>;
  }

  renderSingleProfileRow(field: UserProfileField) {
    const { fieldName, label } = field;
    const rowValue = this.state.editing
      ? this.renderEditableValue(field)
      : this.renderDisplayValue(field);

    // TODO(pablo, kyle): use LabelWrapper here to clean this up once
    // LabelWrapper allows for horizontal labeling - T3485
    return (
      <div key={fieldName} className="row user-profile__row">
        <div className="col-xs-3 user-profile__label">{label}:</div>
        <div className="col-xs-9">{rowValue}</div>
      </div>
    );
  }

  renderModalContents() {
    const editingClass = this.state.editing ? 'editing' : '';
    return (
      <div className={`user-profile-modal-body ${editingClass}`}>
        {FIELDS.map(field => this.renderSingleProfileRow(field))}
      </div>
    );
  }

  render() {
    const { show, user, ...passThroughProps } = this.props;
    const fullName = user.getUserFullName();
    const disablePrimaryButton =
      (this.isUserPending() && this.state.resendingInvite) ||
      (!this.isUserPending() && !this.state.validFieldValues);

    return (
      <BaseModal
        title={fullName}
        show={show}
        disablePrimaryButton={disablePrimaryButton}
        disableSecondaryButton={this.state.sendingResetPassword}
        onPrimaryAction={this.onPrimaryButtonClick}
        onSecondaryAction={this.onSecondaryButtonClick}
        primaryButtonText={this.getPrimaryButtonText()}
        primaryButtonIntent={this.getPrimaryButtonIntent()}
        secondaryButtonIntent={BaseModal.Intents.PRIMARY}
        secondaryButtonOutline
        secondaryButtonText={this.getSecondaryButtonText()}
        showSecondaryButton
        defaultHeight={480}
        {...passThroughProps}
      >
        {this.renderModalContents()}
      </BaseModal>
    );
  }
}

export default withScriptLoader(UserProfileModal, VENDOR_SCRIPTS.toastr);
