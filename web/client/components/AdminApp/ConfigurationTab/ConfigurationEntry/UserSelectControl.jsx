// @flow
import * as React from 'react';
import type Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import DirectoryService from 'services/DirectoryService';
import IdentityRoleMap from 'services/models/IdentityRoleMap';
import Role from 'services/models/Role';
import UserSelect from 'components/common/UserSelect';
import { autobind } from 'decorators';
import { cancelPromise } from 'util/promiseUtil';
import { noop } from 'util/util';
import type Configuration from 'services/models/Configuration';
import type User from 'services/models/User';
import type { ChildProps } from 'components/AdminApp/ConfigurationTab/ConfigurationEntry';

type State = {
  allUsers: Zen.Array<User>,
  selectedUsers: IdentityRoleMap,
};

type DefaultProps = {
  onConfigurationUpdated: (updatedValue: Configuration) => void,
  getUsers: () => Promise<Zen.Array<User>>,
};

type Props = {
  ...ChildProps,
  getUsers: () => Promise<Zen.Array<User>>,
  updateLocalConfiguration: (configuration: Configuration) => void,
};

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
  static defaultProps: DefaultProps = {
    onConfigurationUpdated: noop,
    getUsers: () =>
      DirectoryService.getUsers().then(users => Zen.Array.create<User>(users)),
  };

  _userUriToUser: Zen.Map<User>;
  _usernameToUser: Zen.Map<User>;
  _usersPromise: Promise<void> | void = undefined;

  state: State = {
    allUsers: Zen.Array.create(),
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

  componentWillUnmount() {
    if (this._usersPromise !== undefined) {
      cancelPromise(this._usersPromise);
    }
  }

  fetchUsers(): void {
    this._usersPromise = this.props.getUsers().then(allUsers => {
      this.setState({ allUsers }, () => {
        this._userUriToUser = Zen.Map.fromArray(allUsers, 'uri');
        this._usernameToUser = Zen.Map.fromArray(allUsers, 'username');
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
    const { configuration, updateLocalConfiguration } = this.props;
    this.setState({
      selectedUsers,
    });

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
    updateLocalConfiguration(configuration.value(userIds));
  }

  render(): React.Node {
    const { configuration } = this.props;
    const controlClassName = `
      configuration-tab__user-select
      configuration-tab__user-select__${configuration.key()}`;

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
      </div>
    );
  }
}
