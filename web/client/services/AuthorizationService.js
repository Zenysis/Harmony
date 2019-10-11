// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import APIService, { API_VERSION } from 'services/APIService';
import AuthorizationResource from 'services/models/AuthorizationResource';
import QueryPolicy from 'services/models/QueryPolicy';
import ResourceRoleMap from 'services/models/ResourceRoleMap';
import RoleDefinition from 'services/models/RoleDefinition';
import ZenError from 'util/ZenError';
import autobind from 'decorators/autobind';
import type { HTTPService } from 'services/APIService';

// Allow our promises to be cancelable so that their handlers can be
// cleaned up if a component is unmounted before the promise resolves
Promise.config({ cancellation: true });

export type ResourceType =
  | 'DASHBOARD'
  | 'SITE'
  | 'USER'
  | 'GROUP'
  | 'QUERY_POLICY'
  | 'ALERT';

export type DashboardPermission =
  | 'view_resource'
  | 'edit_resource'
  | 'update_users'
  | 'delete_resource'
  | 'create_resource'
  | 'publish_resource';

export type AlertPermission =
  | 'view_resource'
  | 'edit_resource'
  | 'update_users'
  | 'delete_resource'
  | 'create_resource';

export type SitePermission =
  | 'view_user'
  | 'edit_user'
  | 'invite_user'
  | 'delete_user'
  | 'list_users'
  | 'list_roles'
  | 'list_resources'
  | 'view_admin_page'
  | 'view_query_form'
  | 'reset_password'
  | 'run_query';

export type AuthPermission =
  | AlertPermission
  | DashboardPermission
  | SitePermission;

// TODO(stephen, pablo): This is an incomplete definition for a backend
// resource.
export type ResourceResponse = {
  label: string,
  name: string,
};

// TODO(stephen, pablo): This is an incomplete definition for a backend
// resource type.
export type ResourceTypeResponse = {
  label: string,
  name: string,
};

export const RESOURCE_TYPES: { [string]: ResourceType } = {
  DASHBOARD: 'DASHBOARD',
  SITE: 'SITE',
  USER: 'USER',
  SECURITY_GROUP: 'GROUP',
  QUERY_POLICY: 'QUERY_POLICY',
  ALERT: 'ALERT',
};

export const RESOURCE_TYPE_VALUES: Array<ResourceType> = Object.keys(
  RESOURCE_TYPES,
).map(key => RESOURCE_TYPES[key]);

export const DASHBOARD_PERMISSIONS: { [string]: DashboardPermission } = {
  VIEW: 'view_resource',
  EDIT: 'edit_resource',
  UPDATE_USERS: 'update_users',
  DELETE: 'delete_resource',
  CREATE: 'create_resource',
  PUBLISH: 'publish_resource',
};

export const SITE_PERMISSIONS: { [string]: SitePermission } = {
  VIEW_USER: 'view_user',
  EDIT_USER: 'edit_user',
  INIVTE_USER: 'invite_user',
  DELETE_USER: 'delete_user',
  LIST_USERS: 'list_users',
  LIST_ROLES: 'list_roles',
  LIST_RESOURCES: 'list_resources',
  VIEW_ADMIN_PAGE: 'view_admin_page',
  VIEW_QUERY_FORM: 'view_query_form',
  RESET_PASSWORD: 'reset_password',
  RUN_QUERY: 'run_query',
};

// HACK(vedant): This is not sustainable, but will work for now. Figure out how
// to better support pagination.
const MAXIMUM_PAGE_SIZE = 1000;

const PER_PAGE_SUFFIX = `per_page=${MAXIMUM_PAGE_SIZE}`;

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
  getResources(resourceType?: ResourceType): Promise<Array<ResourceResponse>> {
    const requestPath = resourceType
      ? `resource?where={"resourceType":"${resourceType}"}&${PER_PAGE_SUFFIX}`
      : `resource?${PER_PAGE_SUFFIX}`;

    return new Promise((resolve, reject) => {
      this._httpService
        .get(API_VERSION.V2, requestPath)
        .then(data => {
          resolve(data);
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
              // $ZenModelReadOnlyIssue
              const roles: ResourceRoleMap = ResourceRoleMap.deserialize({
                backendResourceRoleMap,
                resourceType: resource.resourceType(),
                resourceName: resource.name(),
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
              // $ZenModelReadOnlyIssue
              const roles: ResourceRoleMap = ResourceRoleMap.deserialize({
                backendResourceRoleMap,
                resourceType: resource.resourceType(),
                resourceName: resource.name(),
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
  getRoles(resourceType?: ResourceType): Promise<Array<RoleDefinition>> {
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
   * @returns {Promise<Array<{}>>} A listing of `ResourceType` objects
   */
  // TODO(vedant, pablo): add type checking for the returned resourceTypes array
  @autobind
  getResourceTypes(): Promise<Array<{ [string]: any }>> {
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

  @autobind
  getQueryPolicies(): Promise<QueryPolicy> {
    return new Promise((resolve, reject) => {
      this._httpService
        .get(API_VERSION.V2, 'query_policy')
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
}

export default new AuthorizationService(APIService);
