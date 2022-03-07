// @flow
import * as Zen from 'lib/Zen';
import IdentityRoleMap from 'services/models/IdentityRoleMap';
import Role from 'services/models/Role';
import SecurityGroup from 'services/models/SecurityGroup';
import User from 'services/models/User';
import type { ResourceType } from 'services/AuthorizationService/types';
import type { Serializable } from 'lib/Zen';

/**
 * Represents the SitewideAcl for a given resource
 */
export type SitewideResourceAcl = {
  registeredResourceRole: string,
  unregisteredResourceRole: string,
};

// Model representation that we receive from the backend
type BackendResourceRoleMap = {
  userRoles: Zen.Serialized<IdentityRoleMap>,
  groupRoles: Zen.Serialized<IdentityRoleMap>,
  sitewideResourceAcl: SitewideResourceAcl,
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
 *  3 - Sitewide Users (Including unregistered users)
 */
type DefaultValues = {
  /** The resource type that this role map corresponds to */
  resourceName: string,

  /** Values from sitewideAcl. */
  sitewideResourceAcl: SitewideResourceAcl,

  /**
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
  static defaultValues: DefaultValues = {
    resourceName: '',
    sitewideResourceAcl: {
      registeredResourceRole: '',
      unregisteredResourceRole: '',
    },
    securityGroupRoles: IdentityRoleMap.create({}),
    userRoles: IdentityRoleMap.create({}),
  };

  static deserialize({
    backendResourceRoleMap,
    resourceType,
    resourceName,
  }: SerializedResourceRoleMap): Zen.Model<ResourceRoleMap> {
    const {
      userRoles,
      groupRoles,
      sitewideResourceAcl,
    } = backendResourceRoleMap;

    return ResourceRoleMap.create({
      resourceName,
      sitewideResourceAcl,
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
    const {
      userRoles,
      securityGroupRoles,
      sitewideResourceAcl,
    } = this.modelValues();

    return {
      sitewideResourceAcl,
      groupRoles: securityGroupRoles.serialize(),
      userRoles: userRoles.serialize(),
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

  userHasRole(user: User, role: Role): boolean {
    return this._.userRoles().hasRole(user.username(), role);
  }

  securityGroupHasRole(group: SecurityGroup, role: Role): boolean {
    return this._.securityGroupRoles().hasRole(group.name(), role);
  }
}

export default ((ResourceRoleMap: $Cast): Class<Zen.Model<ResourceRoleMap>>);
