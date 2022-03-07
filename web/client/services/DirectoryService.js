// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import APIService, { API_VERSION } from 'services/APIService';
import Resource from 'services/models/Resource';
import SecurityGroup from 'services/models/SecurityGroup';
import User from 'services/models/User';
import ZenError from 'util/ZenError';
import autobind from 'decorators/autobind';
import type ResourceTypeRoleMap from 'services/models/ResourceTypeRoleMap';
import type { HTTPService } from 'services/APIService';

// HACK(vedant) - Pagination should be supported via a Pagination Service.
// The underlying service should not know or care.
const MAXIMUM_PAGE_SIZE = 1000;

const TEXT = t('services.DirectoryService');

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
    return window.__JSON_FROM_BACKEND.user.username;
  }

  /**
   * Returns client's user ID.
   */
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
   * @param {Zen.Map<ResourceTypeRoleMap>} newRoles An object of resource types
   * to their corresponding RoleMap instance
   */
  @autobind
  updateGroupRoles(
    group: SecurityGroup,
    newRoles: Zen.Map<ResourceTypeRoleMap>,
  ): Promise<void> {
    const payload = Zen.serializeMap(newRoles);

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
        .then(() =>
          resolve(window.toastr.success(TEXT.updateGroupUsersSuccess)),
        )
        .catch(error => reject(error));
    });
  }

  /**
   * Creates a new group with the specified name
   *
   * @param {SecurityGroup} group new group to be created
   */
  @autobind
  createGroup(group: SecurityGroup): Promise<void> {
    const serializedGroup = group.serialize();
    const roleURIs = group.roles().mapValues(role => role.uri());
    const usernames = group.users().mapValues(user => user.username());
    return new Promise((resolve, reject) => {
      this._httpService
        .post(API_VERSION.V2, 'group', {
          ...serializedGroup,
          roles: roleURIs,
          users: usernames,
        })
        .then(() => resolve(window.toastr.success(TEXT.createGroupSuccess)))
        .catch(error => reject(error));
    });
  }

  @autobind
  updateGroup(group: SecurityGroup): Promise<void> {
    const serializedGroup = group.serialize();
    const roleURIs = group.roles().mapValues(role => role.uri());
    const usernames = group.users().mapValues(user => user.username());
    return new Promise((resolve, reject) => {
      this._httpService
        .patch(API_VERSION.NONE, group.uri(), {
          ...serializedGroup,
          roles: roleURIs,
          users: usernames,
        })
        .then(() => resolve(window.toastr.success(TEXT.updateGroupSuccess)))
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
        .then(() => resolve(window.toastr.success(TEXT.deleteGroupSuccess)))
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
  getUserOwnership(userUri: string): Promise<Array<Resource>> {
    return new Promise((resolve, reject) => {
      this._httpService
        .get(API_VERSION.NONE, `${userUri}/ownership`)
        .then((result: Array<Zen.Serialized<Resource>>) => {
          resolve(result.map(resource => Resource.deserialize(resource)));
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  @autobind
  getIsUserInGroup(userUri: string, groupName: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this._httpService
        .get(
          API_VERSION.NONE,
          `${userUri}/is_user_in_group?group_name=${groupName}`,
        )
        .then((result: boolean) => resolve(result))
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
   * Update a user and all of its fields.
   */
  @autobind
  updateUser(user: User, groups: $ReadOnlyArray<SecurityGroup>): Promise<User> {
    return new Promise((resolve, reject) => {
      this._httpService
        .patch(API_VERSION.NONE, `${user.uri()}`, {
          ...user.serialize(),
          roles: user.roles().mapValues(r => r.uri()),
          groups: groups.map(g => g.uri()),
        })
        .then(updatedUser => resolve(updatedUser))
        .catch(error => reject(error));
    });
  }

  /**
   * Updates the roles held by the user with the roles specified.
   *
   * @param {User} user The group to update
   *
   * @param {Zen.Map<ResourceTypeRoleMap>} newRoles An object of resource types
   *   to their corresponding RoleMap instance
   */
  @autobind
  updateUserRoles(
    user: User,
    newRoles: Zen.Map<ResourceTypeRoleMap>,
  ): Promise<Zen.Serialized<User>> {
    const payload = Zen.serializeMap(newRoles);

    return new Promise((resolve, reject) => {
      this._httpService
        .patch(API_VERSION.NONE, `${user.uri()}/roles`, payload)
        .then(response => resolve(response))
        .catch(error => reject(error));
    });
  }

  /**
   * Returns if user can export data
   *
   * @param {string} username The username to check
   */
  @autobind
  canUserExportData(username: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.getUser(username).then(user => {
        this._httpService
          .get(API_VERSION.NONE, `${user.uri()}/can_export_data`)
          .then(response => resolve(response))
          .catch(error => reject(error));
      });
    });
  }
}

export default (new DirectoryService(APIService): DirectoryService);
