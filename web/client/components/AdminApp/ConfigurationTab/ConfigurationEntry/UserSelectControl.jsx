// @flow
import * as React from 'react';
import Promise from 'bluebird';

import Button from 'components/ui/Button';
import DirectoryService from 'services/DirectoryService';
import IdentityRoleMap from 'services/models/IdentityRoleMap';
import Role from 'services/models/Role';
import User from 'services/models/User';
import UserSelect from 'components/common/UserSelect';
import ZenArray from 'util/ZenModel/ZenArray';
import ZenMap from 'util/ZenModel/ZenMap';
import { autobind } from 'decorators';
import { noop } from 'util/util';
import type { ChildProps } from 'components/AdminApp/ConfigurationTab/ConfigurationEntry';

type State = {
  allUsers: ZenArray<User>,
  selectedUsers: IdentityRoleMap,
};

type Props = ChildProps & {
  getUsers: () => Promise<ZenArray<User>>,
};

const KEY_TEXT = t('admin_app.configuration.keys');
const USER_URI_PREFIX = '/api2/user/';

// HACK(vedant) - A way to get a User ID from the URI since most configurations
// don't use the URI when representing a user but infact, use the DB ID.
function userIdFromUri(user: User): number {
  return parseInt(user.uri().split(USER_URI_PREFIX)[1], 10);
}

function userIdToUri(userId: number): string {
  return `${USER_URI_PREFIX}${userId.toString()}`;
}

export default class UserSelectControl extends React.PureComponent<
  Props,
  State,
> {
  static defaultProps = {
    onConfigurationUpdated: noop,
    getUsers: () =>
      DirectoryService.getUsers().then(users => ZenArray.create(users)),
  };

  _userUriToUser: ZenMap<User>;
  _usernameToUser: ZenMap<User>;

  state = {
    allUsers: ZenArray.create(),
    selectedUsers: IdentityRoleMap.create({}),
  };

  componentDidMount() {
    this.fetchUsers();
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.configuration !== prevProps.configuration) {
      this.computeSelectedUsers();
      this.fetchUsers();
    }
  }

  fetchUsers() {
    return this.props.getUsers().then(allUsers => {
      this.setState({ allUsers }, () => {
        this._userUriToUser = ZenMap.fromArray(allUsers, 'uri');
        this._usernameToUser = ZenMap.fromArray(allUsers, 'username');
        this.computeSelectedUsers();
      });
    });
  }

  computeSelectedUsers() {
    const { configuration } = this.props;
    let selectedUsers = IdentityRoleMap.create({});
    configuration.value().forEach((userId: number) => {
      const userUri: string = userIdToUri(userId);
      const user: User | void = this._userUriToUser.get(userUri, undefined);
      if (user) {
        selectedUsers = selectedUsers.addRole(
          user.username(),
          Role.createDefault(),
        );
      }
    });
    this.setState({
      selectedUsers,
    });
  }

  @autobind
  onUsersUpdated(selectedUsers: IdentityRoleMap) {
    this.setState({
      selectedUsers,
    });
  }

  @autobind
  onConfigurationUpdated() {
    const { configuration, onConfigurationUpdated } = this.props;
    const { selectedUsers } = this.state;

    const userIds = selectedUsers
      .roles()
      .keys()
      .map((username: string) => {
        const user = this._usernameToUser.get(username, undefined);
        if (user) {
          return userIdFromUri(user);
        }
        return undefined;
      });
    onConfigurationUpdated(configuration.value(userIds));
  }

  render() {
    const { configuration } = this.props;
    const controlClassName = `
      configuration-tab__user-select
      configuration-tab__user-select__${configuration.key()}`;

    const saveText: string = t(
      'admin_app.configuration.textConfiguration.saveText',
      {
        key: KEY_TEXT[configuration.key()],
      },
    );

    return (
      <div className={controlClassName}>
        <div className="configuration-tab__row">
          <UserSelect
            users={this.state.allUsers}
            roleSelectionEnabled={false}
            userToRoles={this.state.selectedUsers}
            onUserRolesUpdated={this.onUsersUpdated}
          />
        </div>
        <div className="configuration-tab__row configuration-tab__controls">
          <Button
            className="configuration-tab__button"
            onClick={this.onConfigurationUpdated}
          >
            {saveText}
          </Button>
        </div>
      </div>
    );
  }
}
