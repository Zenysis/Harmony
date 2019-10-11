// @flow
import * as Zen from 'lib/Zen';
import ResourceRoleMap from 'services/models/ResourceRoleMap';
import type SecurityGroup from 'services/models/SecurityGroup';
import type User from 'services/models/User';
import type { ResourceType } from 'services/AuthorizationService';

type BackendAuthorizationResource = {
  resourceType: ResourceType,
  name: string,
  label: string,
  users: Array<$Shape<Zen.Serialized<User>>>,
  groups: Array<$Shape<Zen.Serialized<SecurityGroup>>>,
  roles: Zen.Serialized<ResourceRoleMap>,
  $uri: string,
};

const EMPTY_BACKEND_ROLES: Zen.Serialized<ResourceRoleMap> = {
  userRoles: {},
  groupRoles: {},
  defaultRoles: {},
};

/**
 * The Resource model is used by the `AuthorizationService` to represent an
 * 'entity' on the site for which access is controlled.
 */
type RequiredValues = {
  /**
   * @readonly
   * The specific type of resource that this instance refers to.
   */
  resourceType: Zen.ReadOnly<ResourceType>,
};

type DefaultValues = {
  /**
   * @readonly
   * The human-readable name of the resource.
   */
  label: Zen.ReadOnly<string>,
  /**
   * @readonly
   * The unique string representation of the resource in the system.
   */
  name: Zen.ReadOnly<string>,
  /**
   * The detailed mapping of roles to individual users, security groups and the
   * default roles assigned to registered (and potentially unregistered) users
   * for this resource.
   */
  roles: ResourceRoleMap,
  /**
   * @readonly
   * The unique uri that can be used to locate this authorization resource on
   * the server.
   */
  uri: Zen.ReadOnly<string>,
};

class AuthorizationResource extends Zen.BaseModel<
  AuthorizationResource,
  RequiredValues,
  DefaultValues,
> {
  static defaultValues = {
    label: '',
    name: '',
    roles: ResourceRoleMap.create({}),
    uri: '',
  };

  static deserialize(
    values: BackendAuthorizationResource,
  ): Zen.Model<AuthorizationResource> {
    const { label, name, resourceType, $uri } = values;

    const roles: Zen.Serialized<ResourceRoleMap> = values.roles
      ? values.roles
      : EMPTY_BACKEND_ROLES;

    return AuthorizationResource.create({
      name,
      label,
      resourceType,
      roles: ResourceRoleMap.deserialize({
        backendResourceRoleMap: roles,
        resourceType,
        resourceName: name,
      }),
      uri: $uri,
    });
  }
}

export default ((AuthorizationResource: any): Class<
  Zen.Model<AuthorizationResource>,
>);
