// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import APIService, { API_VERSION } from 'services/APIService';
import SecurityGroup from 'services/models/SecurityGroup';
import User from 'services/models/User';
import ZenError from 'util/ZenError';
import ZenMap from 'util/ZenModel/ZenMap';
import autobind from 'decorators/autobind';
import type ResourceTypeRoleMap from 'services/models/ResourceTypeRoleMap';
import type { HTTPService } from 'services/APIService';

// HACK(vedant) - Pagination should be supported via a Pagination Service.
// The underlying service should not know or care.
const MAXIMUM_PAGE_SIZE = 1000;

export type InviteeRequest = {
  name: string,
  email: string,
};

/**
  DirectoryService is used to perform CRUD operations on Users, and Security
  Groups.
 */
class DirectoryService {
  _httpService: HTTPService;
  constructor(httpService: HTTPService) {
    this._httpService = httpService;
  }

  /**
   * Return the active user's username
   */
  getActiveUsername(): string {
    // eslint-disable-line class-methods-use-this
    return window.__JSON_FROM_BACKEND.user.username;
  }

  /**
   * Returns client's user ID.
   */
  // eslint-disable-next-line class-methods-use-this
  getUserId(): number {
    return window.__JSON_FROM_BACKEND.user.id;
  }

  /**
   * Gets a list of all the groups on the site.
   *
   * @returns {Promise<Array<SecurityGroup>>} A listing of all the groups
   */
  @autobind
  getGroups(): Promise<$ReadOnlyArray<SecurityGroup>> {
    return new Promise((resolve, reject) => {
      this._httpService
        .get(API_VERSION.V2, `group?per_page=${MAXIMUM_PAGE_SIZE}`)
        .then(groupObjects => {
          const groupModels = groupObjects.map(groupObject =>
            SecurityGroup.deserialize(groupObject),
          );
          resolve(groupModels);
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  /**
   * Gets a specific group by its name.
   *
   * @param {String} name The string representation of the group name
   *
   * @returns {Promise<SecurityGroup>} The security group in question
   */
  @autobind
  getGroup(name: string): Promise<SecurityGroup> {
    return new Promise((resolve, reject) => {
      this._httpService
        .get(API_VERSION.V2, `group?where={"name":"${name}"}`)
        .then((groupObjects: Array<Zen.Serialized<SecurityGroup>>) => {
          if (groupObjects.length === 0) {
            reject(new ZenError(`Security Group '${name}' was not found. `));
          } else if (groupObjects.length > 1) {
            reject(
              new ZenError(
                `Multiple values for Security Group '${name}' were found. `,
              ),
            );
          } else {
            resolve(SecurityGroup.deserialize(groupObjects[0]));
          }
        })
        .catch(error => reject(error));
    });
  }

  /**
   * Updates the specified group's name
   *
   * @param {SecurityGroup} group The group to update
   *
   * @param {String} newName The group's new name
   *
   * @returns {Promise<SecurityGroup>} The updated security group
   */
  @autobind
  updateGroupName(
    group: SecurityGroup,
    newName: string,
  ): Promise<SecurityGroup> {
    return new Promise((resolve, reject) => {
      this._httpService
        .patch(API_VERSION.NONE, group.uri(), { name: newName })
        .then(response => resolve(response))
        .catch(error => reject(error));
    });
  }

  /**
   * Updates the roles held by the group with the roles specified
   *
   * @param {SecurityGroup} group The group to update
   *
   * @param {ZenMap<ResourceTypeRoleMap>} newRoles An object of resource types
   * to their corresponding RoleMap instance
   */
  @autobind
  updateGroupRoles(
    group: SecurityGroup,
    newRoles: ZenMap<ResourceTypeRoleMap>,
  ): Promise<void> {
    const payload = newRoles.serialize();

    return new Promise((resolve, reject) => {
      this._httpService
        .patch(API_VERSION.NONE, `${group.uri()}/roles`, payload)
        .then(response => resolve(response))
        .catch(error => reject(error));
    });
  }

  /**
   * Updates the users in the group with the users specified
   *
   * @param {SecurityGroup} group The group to update
   *
   * @param {Array<String>} newUsers The group's new users (by username)
   *
   */
  @autobind
  updateGroupUsers(
    group: SecurityGroup,
    newUsers: Array<string>,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this._httpService
        .patch(API_VERSION.NONE, `${group.uri()}/users`, newUsers)
        .then(response => resolve(response))
        .catch(error => reject(error));
    });
  }

  /**
   * Creates a new group with the specified name
   *
   * @param {String} groupName The name for the new Group
   *
   * @returns {Promise<SecurityGroup>} The newly created group
   */
  @autobind
  createGroup(groupName: string): Promise<SecurityGroup> {
    return new Promise((resolve, reject) => {
      this._httpService
        .post(API_VERSION.V2, 'group', { name: groupName })
        .then(newGroupObject =>
          resolve(SecurityGroup.deserialize(newGroupObject)),
        )
        .catch(error => reject(error));
    });
  }

  /**
   * Deletes the specified group
   *
   * @param {SecurityGroup} group The group to delete
   *
   */
  @autobind
  deleteGroup(group: SecurityGroup): Promise<void> {
    return new Promise((resolve, reject) => {
      this._httpService
        .delete(API_VERSION.NONE, group.uri())
        .then(() => resolve())
        .catch(error => {
          reject(error);
        });
    });
  }

  /**
   * Gets an individual user by their username.
   *
   * @param {String} username The user's username
   *
   * @returns {Promise<User>} The user in question
   */
  @autobind
  getUser(username: string): Promise<User> {
    // HACK(vedant) We need to convert the `+` character found in some emails
    // to its URL encoded value when querying.
    const _username = username.replace('+', '%2B');

    return new Promise((resolve, reject) => {
      this._httpService
        .get(API_VERSION.V2, `user?where={"username":"${_username}"}`)
        .then((userObjects: Array<Zen.Serialized<User>>) => {
          if (userObjects.length === 0) {
            reject(new ZenError(`Username '${username}' was not found. `));
          } else if (userObjects.length > 1) {
            reject(
              new ZenError(
                `Multiple values for username '${username}' were found. `,
              ),
            );
          } else {
            resolve(User.deserialize(userObjects[0]));
          }
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  @autobind
  getUserByUri(uri: string): Promise<User> {
    return new Promise((resolve, reject) => {
      this._httpService
        .get(API_VERSION.NONE, uri)
        .then((result: Zen.Serialized<User>) => {
          resolve(User.deserialize(result));
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  @autobind
  inviteUsers(invitees: Array<InviteeRequest>): Promise<Array<User>> {
    return new Promise((resolve, reject) => {
      this._httpService
        .post(API_VERSION.V2, 'user/invite', invitees)
        .then(userObjects => {
          resolve(userObjects.map(userObject => User.deserialize(userObject)));
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  @autobind
  inviteUser(invitee: InviteeRequest): Promise<User> {
    const invitees: Array<InviteeRequest> = [invitee];
    return new Promise((resolve, reject) => {
      this.inviteUsers(invitees)
        .then(invitedUsers => {
          resolve(invitedUsers[0]);
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  /**
   * Resets the user's password
   *
   * @param {User} user
   */
  @autobind
  resetPassword(user: User): Promise<void> {
    return new Promise((resolve, reject) => {
      const userUri = user.uri();
      this._httpService
        .post(API_VERSION.NONE, `${userUri}/reset_password`)
        .then(() => resolve())
        .catch(error => reject(error));
    });
  }

  /**
   * Gets a list of all the registered users on the site.
   *
   * @returns {Promise<Array<User>>} A listing of all users
   */
  @autobind
  getUsers(): Promise<Array<User>> {
    return new Promise((resolve, reject) => {
      this._httpService
        .get(API_VERSION.V2, `user?per_page=${MAXIMUM_PAGE_SIZE}`)
        .then(userObjects => {
          const userModels = userObjects.map(userObject =>
            User.deserialize(userObject),
          );
          resolve(userModels);
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  /**
   * Updates the specified user (including the roles assigned to them).
   *
   * @param {User} user The user to update
   *
   * @returns {Promise<User>} A promise that when completed successfully will
   *                          contain the details of the updated user.
   */
  @autobind
  updateUser(user: User): Promise<User> {
    return new Promise((resolve, reject) => {
      this._httpService
        .patch(API_VERSION.NONE, `${user.uri()}`, user.serialize())
        .then(() => this.updateUserRoles(user, user.roles()))
        .then(response => resolve(User.deserialize(response)))
        .catch(error => reject(error));
    });
  }

  /**
   * Deletes the specified user. Deletion WILL fail if the User has any
   * Dashboards or other artifacts associated with them. To force delete
   * a user, refer to the `forceDelete` method.
   *
   * @param {User} user
   *
   * @returns {Promise<void>} A promise that when completed successfully,
   *                          will indicate that the specified user has been
   *                          deleted.
   */
  @autobind
  deleteUser(user: User): Promise<void> {
    return new Promise((resolve, reject) => {
      this._httpService
        .delete(API_VERSION.NONE, user.uri())
        .then(() => resolve())
        .catch(error => {
          reject(error);
        });
    });
  }

  /**
   * Force deletes the specified user. Any Dashboards or other artifacts
   * associated with the user will be deleted as well.
   *
   * @param {User} user
   *
   * @returns {Promise<void>} A promise that when completed successfully,
   *                          will indicate that the specified user has been
   *                          force deleted.
   */
  @autobind
  forceDeleteUser(user: User): Promise<void> {
    return new Promise((resolve, reject) => {
      this._httpService
        .delete(API_VERSION.NONE, `${user.uri()}/force`)
        .then(() => resolve())
        .catch(error => {
          reject(error);
        });
    });
  }

  /**
   * Updates the roles held by the user with the roles specified.
   *
   * @param {User} user The group to update
   *
   * @param {ZenMap<ResourceTypeRoleMap>} newRoles An object of resource types
   *   to their corresponding RoleMap instance
   */
  @autobind
  updateUserRoles(
    user: User,
    newRoles: ZenMap<ResourceTypeRoleMap>,
  ): Promise<User> {
    const payload = newRoles.serialize();

    return new Promise((resolve, reject) => {
      this._httpService
        .patch(API_VERSION.NONE, `${user.uri()}/roles`, payload)
        .then(response => resolve(response))
        .catch(error => reject(error));
    });
  }
}

export default new DirectoryService(APIService);
