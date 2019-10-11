// @flow
import * as Zen from 'lib/Zen';
import type { ResourceType } from 'services/AuthorizationService';

type BackendPermission = {
  id: Number,
  permission: string,
};

type BackendRoleDefinition = {
  $uri: string,
  name: string,
  label: string,
  permissions: Array<BackendPermission>,
  resourceType: ResourceType,
};

/**
 * @readonly
 * The RoleDefinition model is used by the `AuthorizationService` to
 * represent a role that can be assigned to a `User` or `SecurityGroup`
 * for either a specific `resource` of a given `resourceType` or
 * all resources of a given `resourceType`. `RoleDefinition` is not directly
 * assigned to a `Resource` as it is only a template. The actual assignment
 * between `RoleDefinition` and a `Resource` (or all resources of a given type)
 * is through the `Role` class. The further assignment of that `Role` to a
 * `User` or `SecurityGroup` is through the `Zen.Map<ResourceTypeRoleMap>` of
 * an individual `User` or `SecurityGroup`.
 */

type RequiredValues = {
  /**
   * @readonly
   * The resource type this role is associated with.
   */
  resourceType: Zen.ReadOnly<ResourceType>,
};

type DefaultValues = {
  /**
   * @readonly
   * The human-readable representation of the Role Definition
   */
  label: Zen.ReadOnly<string>,
  /**
   * @readonly
   * The unique string value that is used to represent this role on the backend
   * and in user/security group permissions
   */
  name: Zen.ReadOnly<string>,
  /**
   * @readonly
   * The list of permissions indicating what activities that that users with
   * this particular role can perform.
   *
   * e.g. [ 'edit_resource', 'delete_resource', 'update_users']
   */
  permissions: Zen.ReadOnly<Zen.Array<string>>,
  /**
   * @readonly
   * The unique uri that can be used to locate this role definition on the
   * server.
   */
  uri: Zen.ReadOnly<string>,
};

class RoleDefinition extends Zen.BaseModel<
  RoleDefinition,
  RequiredValues,
  DefaultValues,
> {
  static defaultValues = {
    label: '',
    name: '',
    permissions: '',
    uri: '',
  };

  static deserialize({
    label,
    name,
    permissions,
    resourceType,
    $uri,
  }: BackendRoleDefinition): Zen.Model<RoleDefinition> {
    const _permissions = permissions.map(
      (permission: BackendPermission) => permission.permission,
    );
    return RoleDefinition.create({
      label,
      name,
      permissions: Zen.Array.create(_permissions),
      resourceType,
      uri: $uri,
    });
  }
}

export default ((RoleDefinition: any): Class<Zen.Model<RoleDefinition>>);
