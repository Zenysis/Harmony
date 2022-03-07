// @flow
import * as Zen from 'lib/Zen';
import type { ResourceType } from 'services/AuthorizationService/types';

/**
 * The Role model is used by the `AuthorizationService` to represent an
 * association between a role definition and either:
 *  1 - All resources of a given type
 *  2 - A specific resource AND resource type.
 *
 * It can apply either to `SecurityGroup` or an individual `User`.
 */

export type Values = {
  /**
   * The type of resource that this role corresponds to.
   */
  resourceType: ResourceType,
  /**
   * The unique name of the resource that this role corresponds to.
   * This will be an empty string if this is a sitewide role association.
   */
  resourceName: string,
  /**
   * The name of the role.
   */
  roleName: string,
};

class Role extends Zen.BaseModel<Role, Values> {
  static createDefault(): Zen.Model<Role> {
    return Role.create({
      resourceType: 'USER',
      resourceName: 'DEFAULT',
      roleName: 'DEFAULT',
    });
  }

  /**
   * Returns whether or not the role is a sitewide role or only applies to a
   * specific resource.
   */
  // TODO(stephen, anyone): There is a very pervasive and *implicit*
  // that components who use Roles follow where this test is applied inline
  // and not by using a function. This should be cleaned up.
  isSitewide(): boolean {
    return this._.resourceName() === '';
  }
}

export default ((Role: $Cast): Class<Zen.Model<Role>>);
