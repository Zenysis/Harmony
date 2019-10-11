// @flow
import * as Zen from 'lib/Zen';
import DefaultIdentityRoleMap from 'services/models/DefaultIdentityRoleMap';
import DefaultRole from 'services/models/Role/DefaultRole';
import IdentityRoleMap from 'services/models/IdentityRoleMap';
import Role from 'services/models/Role';
import SecurityGroup from 'services/models/SecurityGroup';
import User from 'services/models/User';
import type { ResourceType } from 'services/AuthorizationService';
import type { Serializable } from 'lib/Zen';

// Model representation that we receive from the backend
type BackendResourceRoleMap = {
  defaultRoles: Zen.Serialized<DefaultIdentityRoleMap>,
  userRoles: Zen.Serialized<IdentityRoleMap>,
  groupRoles: Zen.Serialized<IdentityRoleMap>,
};

type SerializedResourceRoleMap = {
  backendResourceRoleMap: BackendResourceRoleMap,
  resourceName: string,
  resourceType: ResourceType,
};

/**
 * A role map that represents ALL the roles held on an `AuthorizationResource`
 * by:
 *  1 - Individual users
 *  2 - Individual security groups
 *  3 - ALL registered users (and potentially, unregistered users)
 */

type DefaultValues = {
  /**
   * The role map corresponding to which roles ALL registered users (and
   * potentially, unregistered users) hold on the authorization resource.
   */
  defaultRoles: DefaultIdentityRoleMap,
  /**
   * @readonly
   * The resource type that this role map corresponds to
   */
  resourceName: Zen.ReadOnly<string>,
  /**
   * @readonly
   * The name of the specific `AuthorizationResource` that this role map
   * corresponds to.
   */
  securityGroupRoles: IdentityRoleMap,
  /**
   * The role map corresponding to which roles individual security groups hold
   * on the authorization resource.
   */
  userRoles: IdentityRoleMap,
};

class ResourceRoleMap extends Zen.BaseModel<ResourceRoleMap, {}, DefaultValues>
  implements Serializable<BackendResourceRoleMap> {
  static defaultValues = {
    defaultRoles: DefaultIdentityRoleMap.create({}),
    resourceName: '',
    securityGroupRoles: IdentityRoleMap.create({}),
    userRoles: IdentityRoleMap.create({}),
  };

  static deserialize({
    backendResourceRoleMap,
    resourceType,
    resourceName,
  }: SerializedResourceRoleMap): Zen.Model<ResourceRoleMap> {
    const { userRoles, groupRoles, defaultRoles } = backendResourceRoleMap;

    return ResourceRoleMap.create({
      defaultRoles: DefaultIdentityRoleMap.deserialize({
        backendRoleMap: defaultRoles || {},
        resourceType,
        resourceName,
      }),
      resourceName,
      securityGroupRoles: IdentityRoleMap.deserialize({
        backendRoleMap: groupRoles || {},
        resourceType,
        resourceName,
      }),
      userRoles: IdentityRoleMap.deserialize({
        backendRoleMap: userRoles || {},
        resourceType,
        resourceName,
      }),
    });
  }

  serialize(): BackendResourceRoleMap {
    const { userRoles, securityGroupRoles, defaultRoles } = this.modelValues();

    return {
      userRoles: userRoles.serialize(),
      groupRoles: securityGroupRoles.serialize(),
      defaultRoles: defaultRoles.serialize(),
    };
  }

  addUserRole(user: User, role: Role): Zen.Model<ResourceRoleMap> {
    const userRoles = this._.userRoles().addRole(user.username(), role);
    return this._.userRoles(userRoles);
  }

  addSecurityGroupRole(
    group: SecurityGroup,
    role: Role,
  ): Zen.Model<ResourceRoleMap> {
    const securityGroupRoles = this._.securityGroupRoles().addRole(
      group.name(),
      role,
    );
    return this._.securityGroupRoles(securityGroupRoles);
  }

  addDefaultRole(role: DefaultRole): Zen.Model<ResourceRoleMap> {
    const defaultRoles = this._.defaultRoles().addRole(role);
    return this._.defaultRoles(defaultRoles);
  }

  deleteUserRole(user: User, role: Role): Zen.Model<ResourceRoleMap> {
    const userRoles = this._.userRoles().deleteRole(user.username(), role);
    return this._.userRoles(userRoles);
  }

  deleteSecurityGroupRole(
    group: SecurityGroup,
    role: Role,
  ): Zen.Model<ResourceRoleMap> {
    const securityGroupRoles = this._.securityGroupRoles().deleteRole(
      group.name(),
      role,
    );
    return this._.securityGroupRoles(securityGroupRoles);
  }

  deleteDefaultRole(role: DefaultRole): Zen.Model<ResourceRoleMap> {
    const defaultRoles = this._.defaultRoles().deleteRole(role);
    return this._.defaultRoles(defaultRoles);
  }

  allUsersHaveRole(role: DefaultRole): boolean {
    return this._.defaultRoles().hasRole(role);
  }

  userHasRole(user: User, role: Role): boolean {
    return this._.userRoles().hasRole(user.username(), role);
  }

  securityGroupHasRole(group: SecurityGroup, role: Role): boolean {
    return this._.securityGroupRoles().hasRole(group.name(), role);
  }
}

export default ((ResourceRoleMap: any): Class<Zen.Model<ResourceRoleMap>>);
