// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import APIService, { API_VERSION } from 'services/APIService';
import AuthorizationResource from 'services/models/AuthorizationResource';
import I18N from 'lib/I18N';
import QueryPolicy from 'services/models/QueryPolicy';
import Resource from 'services/models/Resource';
import ResourceRole from 'services/models/ResourceRole';
import ResourceRoleMap from 'services/models/ResourceRoleMap';
import RoleDefinition from 'services/models/RoleDefinition';
import ZenError from 'util/ZenError';
import autobind from 'decorators/autobind';
import type {
  AuthPermission,
  AuthorizationRequest,
  ResourceType,
  ResourceTypeResponse,
} from 'services/AuthorizationService/types';
import type { HTTPService } from 'services/APIService';

// Allow our promises to be cancelable so that their handlers can be
// cleaned up if a component is unmounted before the promise resolves
Promise.config({ cancellation: true });

// HACK(vedant): This is not sustainable, but will work for now. Figure out how
// to better support pagination.
const MAXIMUM_PAGE_SIZE = 1000;

const PER_PAGE_SUFFIX = `per_page=${MAXIMUM_PAGE_SIZE}`;

const TEXT = t('services.AuthorizationService');

class AuthorizationService {
  _httpService: HTTPService;
  constructor(httpService: HTTPService) {
    this._httpService = httpService;
  }

  /**
   * Returns whether or not the current user has a given permission for a
   * given resource type. If a resourceName is passed, we check this permission
   * for that specific resource. If there is no resourceName, then it's a
   * sitewide check.
   *
   * @param {AuthPermission} permission the action the user wants to take
   * @param {ResourceType} resourceType
   * @param {string} resourceName (Optional) if null, we check sitewide
   * @returns {Promise<boolean>} is the user authorized for this action or not
   */
  @autobind
  isAuthorized(
    permission: AuthPermission,
    resourceType: ResourceType,
    resourceName: ?string = null,
  ): Promise<boolean> {
    const request = {
      permission,
      resourceType,
      resourceName: resourceName || null,
    };

    return new Promise(resolve =>
      this._httpService
        .post(API_VERSION.V1, 'authorization', request)
        .then(response => {
          const { success } = response;
          resolve(success);
        })
        .catch(() => resolve(false)),
    );
  }

  @autobind
  isAuthorizedMulti(
    requests: $ReadOnlyArray<AuthorizationRequest>,
  ): Promise<$ReadOnlyArray<{ ...AuthorizationRequest, authorized: boolean }>> {
    return this._httpService.post(
      API_VERSION.V1,
      'authorization_multi',
      requests,
    );
  }

  /**
   * Updates all the user, security group, and default roles that are held for
   * a specific authorization resource.
   *
   * @param {AuthorizationResource} resource The authorization resource whose
   *                                         permissions are to be updated.
   *
   * @returns {Promise<void>} A promise that when completed successfully will
   *                          indicate that permissions for the specified
   *                          authorization resource have been updated.
   */
  @autobind
  updateResourcePermissions(resource: AuthorizationResource): Promise<void> {
    const path = `${resource.uri()}/roles`;
    const payload = resource.roles().serialize();
    return new Promise((resolve, reject) => {
      this._httpService
        .post(API_VERSION.NONE, path, payload)
        .then(() => {
          resolve();
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  /**
   * Fetches a listing of all resources or all resources for a specific
   * resource type (if specified).
   *
   * @param {ResourceType} resourceType (Optional) The resource type to fetch
   *                                    all resources for.
   *
   * @returns {Promise<Array<{}>>} A listing of `Resource` objects
   */
  // TODO(vedant, pablo): add type checking for the returned resources array
  @autobind
  getResources(resourceType?: ResourceType): Promise<$ReadOnlyArray<Resource>> {
    const requestPath = resourceType
      ? `resource?where={"resourceType":"${resourceType}"}&${PER_PAGE_SUFFIX}`
      : `resource?${PER_PAGE_SUFFIX}`;

    return new Promise((resolve, reject) => {
      this._httpService
        .get(API_VERSION.V2, requestPath)
        .then(rawResources => {
          resolve(
            rawResources.map(rawResource => Resource.deserialize(rawResource)),
          );
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  /**
   * Gets an Authorization Resource by its specific URI.
   *
   * @param {string} uri The URI of the authorization resource.
   *
   * @returns {Promise<AuthorizationResource>} A promise that when completed
   *                                           successfully will resolve to the
   *                                           `AuthorizationResource` in
   *                                           question.
   */
  @autobind
  getResourceByUri(uri: string): Promise<AuthorizationResource> {
    return new Promise((resolve, reject) => {
      this._httpService
        .get(API_VERSION.NONE, uri)
        .then(rawResource => {
          resolve(AuthorizationResource.deserialize(rawResource));
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  /**
   * Attemps to look up an Authorization Resource by name and type.
   *
   * @param {ResourceType} resourceType The resource's type.
   *
   * @param {string} resourceName The specific name of the resource.
   *
   * @returns {Promise<AuthorizationResource>} A promise that when completed
   *                                           successfully will resolve to the
   *                                           `AuthorizationResource` in
   *                                           question.
   */
  @autobind
  getResource(
    resourceType: ResourceType,
    resourceName: string,
  ): Promise<AuthorizationResource> {
    const _resourceName = resourceName.replace(' ', '%20');
    const requestPath = `resource?where={"resourceType":"${resourceType}","name":"${_resourceName}"}`;

    return new Promise((resolve, reject) => {
      this._httpService
        .get(API_VERSION.V2, requestPath)
        .then(rawResources => {
          if (rawResources.length === 1) {
            resolve(AuthorizationResource.deserialize(rawResources[0]));
          } else if (rawResources.length >= 1) {
            reject(
              new ZenError(
                `Multiple authorization resources of type '${resourceType}' and
              with name '${resourceName}' exist.`,
              ),
            );
          } else {
            reject(
              new ZenError(
                `No authorization resource of type '${resourceType}' and
              with name '${resourceName}' exists.`,
              ),
            );
          }
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  /**
   * Attemps to look up an Authorization Resource by name and type along with a
   * mapping of all the roles held by users and security groups.
   *
   * @param {ResourceType} resourceType The resource's type.
   *
   * @param {string} resourceName The specific name of the resource.
   *
   * @returns {Promise<AuthorizationResource>} A promise that when completed
   *                                           successfully will resolve to the
   *                                           `AuthorizationResource` in
   *                                           question.
   */
  @autobind
  getResourceWithRoles(
    resourceType: ResourceType,
    resourceName: string,
  ): Promise<AuthorizationResource> {
    return new Promise((resolve, reject) => {
      this.getResource(resourceType, resourceName)
        .then((resource: AuthorizationResource) => {
          const rolesUri: string = `${resource.uri()}/roles`;
          this._httpService
            .get(API_VERSION.NONE, rolesUri)
            .then((backendResourceRoleMap: Zen.Serialized<ResourceRoleMap>) => {
              const roles: ResourceRoleMap = ResourceRoleMap.deserialize({
                backendResourceRoleMap,
                resourceName: resource.name(),
                resourceType: resource.resourceType(),
              });
              const output: AuthorizationResource = resource.roles(roles);
              resolve(output);
            });
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  /**
   * Gets an Authorization Resource by its specific URI along with a
   * mapping of all the roles held by users and security groups.
   *
   * @param {string} uri The URI of the authorization resource.
   *
   * @returns {Promise<AuthorizationResource>} A promise that when completed
   *                                           successfully will resolve to the
   *                                           `AuthorizationResource` in
   *                                           question.
   */
  @autobind
  getResourceWithRolesByUri(uri: string): Promise<AuthorizationResource> {
    return new Promise((resolve, reject) => {
      this.getResourceByUri(uri)
        .then((resource: AuthorizationResource) => {
          const rolesUri: string = `${resource.uri()}/roles`;
          this._httpService
            .get(API_VERSION.NONE, rolesUri)
            .then((backendResourceRoleMap: Zen.Serialized<ResourceRoleMap>) => {
              const roles: ResourceRoleMap = ResourceRoleMap.deserialize({
                backendResourceRoleMap,
                resourceName: resource.name(),
                resourceType: resource.resourceType(),
              });
              const output: AuthorizationResource = resource.roles(roles);
              resolve(output);
            });
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  /**
   * Gets a list of ResourceRoles, optionally by ResourceType.
   *
   * @param {ResourceType} resourceType (Optional) The resource type to fetch
   *                                    all roles for
   *
   * @returns {Promise<Array<ResourceRole>>} A listing of `ResourceRole` objects
   */
  @autobind
  getResourceRoles(
    resourceType?: ResourceType,
  ): Promise<$ReadOnlyArray<ResourceRole>> {
    const requestPath = resourceType
      ? `resource_role?where={"resourceType":"${resourceType}"}&${PER_PAGE_SUFFIX}`
      : `resource_role?${PER_PAGE_SUFFIX}`;

    return new Promise((resolve, reject) => {
      this._httpService
        .get(API_VERSION.V2, requestPath)
        .then(rawRoles => {
          resolve(rawRoles.map(rawRole => ResourceRole.deserialize(rawRole)));
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  /**
   * Fetches a listing of all roles or all roles for a specific resource type
   * (if specified).
   *
   * @param {ResourceType} resourceType (Optional) The resource type to fetch
   *                                    all roles for.
   *
   * @returns {Promise<Array<RoleDefinition>>} A listing of `RoleDefinition`
   *                                           objects.
   */
  @autobind
  getRoles(
    resourceType?: ResourceType,
  ): Promise<$ReadOnlyArray<RoleDefinition>> {
    const requestPath = resourceType
      ? `role?where={"resourceType":"${resourceType}"}&${PER_PAGE_SUFFIX}`
      : `role?${PER_PAGE_SUFFIX}`;

    return new Promise((resolve, reject) => {
      this._httpService
        .get(API_VERSION.V2, requestPath)
        .then(rawRoles => {
          resolve(rawRoles.map(rawRole => RoleDefinition.deserialize(rawRole)));
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  /**
   * Fetches a listing of all defined resource types.
   *
   * @returns {Promise<Array<ResourceTypeResponse>>} A listing of
   * `ResourceTypeResponse` objects
   */
  // TODO(vedant, pablo): add type checking for the returned resourceTypes array
  @autobind
  getResourceTypes(): Promise<$ReadOnlyArray<ResourceTypeResponse>> {
    return new Promise((resolve, reject) => {
      this._httpService
        .get(API_VERSION.V2, 'resource-type')
        .then(data => {
          resolve(data);
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  /**
   * Creates a role with a given label and a list of tools selected.
   *
   * @returns {Promise<$ReadyOnlyArray<QueryPolicy>>} A promise when completed
   * successfully will return all query policies for the deployment.
   */
  @autobind
  getQueryPolicies(): Promise<$ReadOnlyArray<QueryPolicy>> {
    return new Promise((resolve, reject) => {
      // NOTE(all): per_page necessary otherwise flask defaults to 20
      this._httpService
        .get(API_VERSION.V2, 'query_policy?per_page=1000')
        .then(rawPolicies => {
          resolve(
            rawPolicies.map(rawPolicy => QueryPolicy.deserialize(rawPolicy)),
          );
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  /**
   * Creates a role with a given label and a list of tools selected.
   *
   * @param {string} uri The uri of the role.
   *
   * @returns {Promise<RoleDefinition>} A promise when completed successfully
   * will return a role with the given uri.
   */
  @autobind
  getRoleByUri(uri: string): Promise<RoleDefinition> {
    const requestPath = uri.split('api2').pop();
    return new Promise((resolve, reject) => {
      this._httpService
        .get(API_VERSION.V2, requestPath)
        .then(rawRole => resolve(RoleDefinition.deserialize(rawRole)))
        .catch(error => {
          reject(error);
        });
    });
  }

  /**
   * Creates a role with a given label and a list of tools selected.
   *
   * @param {string} label The label of the role.
   * @param {$ReadOnlyArray<RoleTools>} tools The tools this role has access to.
   *
   * @returns {Promise<void>} A promise when completed successfully will create a
   * new role with the given label and tools inputs.
   */
  @autobind
  createRole(role: RoleDefinition): Promise<void> {
    return new Promise((resolve, reject) => {
      this._httpService
        .post(API_VERSION.V2, 'role', role.serialize())
        .then(() => resolve(window.toastr.success(TEXT.createRoleSuccess)))
        .catch(error => {
          // If 409 conflict error (role name already exists), we display the
          // custom error message from the backend.
          const errorMsg = error.message;
          const status = errorMsg
            .split('"status":')[1]
            .split('}')[0]
            .replace('\n', '')
            .replace(' ', '');
          if (status === '409') {
            const newErrorMsg = I18N.text(
              'Role name "%(label)s" already exists. Please select another name.',
              'duplicateNameError',
              { label: role.label() },
            );
            window.toastr.error(newErrorMsg);
          } else {
            window.toastr.error(errorMsg);
          }
          reject(error);
        });
    });
  }

  /**
   * Creates a role with a given label and a list of tools selected.
   *
   * @param {RoleDefinition} role The label of the role.
   *
   * @returns {Promise<void>} A promise when completed successfully will update
   * a role with new properties.
   */
  @autobind
  updateRole(role: RoleDefinition): Promise<void> {
    return new Promise((resolve, reject) => {
      this._httpService
        .patch(API_VERSION.NONE, role.uri(), role.serialize())
        .then(() => resolve(window.toastr.success(TEXT.updateRoleSuccess)))
        .catch(error => reject(error));
    });
  }

  @autobind
  updateRoleUsers(
    role: RoleDefinition,
    usernames: $ReadOnlyArray<string>,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this._httpService
        .patch(API_VERSION.NONE, `${role.uri()}/users`, usernames)
        .then(() => resolve(window.toastr.success(TEXT.updateRoleUsersSuccess)))
        .catch(error => reject(error));
    });
  }

  /**
   * Deletes a role.
   *
   * @param {RoleDefinition} role to be deleted.
   *
   * @returns {Promise<void>} A promise when completed successfully will delete
   * the role.
   */
  @autobind
  deleteRole(role: RoleDefinition): Promise<void> {
    return new Promise((resolve, reject) => {
      this._httpService
        .delete(API_VERSION.NONE, role.uri())
        .then(() => resolve(window.toastr.success(TEXT.deleteRoleSuccess)))
        .catch(error => {
          reject(error);
        });
    });
  }

  /**
   * Returns the number of users associated with each role.
   *
   * @returns {{[roleName: string]: number, ...}} The number of users associated
   * with this role.
   */
  @autobind
  getRoleToNumUsersObj(): Promise<{ [roleName: string]: number, ... }> {
    return new Promise((resolve, reject) => {
      this._httpService
        .get(API_VERSION.V2, `role/num_users`)
        .then(roleNumUsersObj => resolve(roleNumUsersObj))
        .catch(error => {
          reject(error);
        });
    });
  }
}

export default (new AuthorizationService(APIService): AuthorizationService);
