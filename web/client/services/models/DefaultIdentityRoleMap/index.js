// @flow
import * as Zen from 'lib/Zen';
import DefaultRole from 'services/models/Role/DefaultRole';
import { areStringsEqualIgnoreCase } from 'util/stringUtil';
import type { ResourceType } from 'services/AuthorizationService/types';
import type { Serializable } from 'lib/Zen';

type BackendDefaultRole = {
  applyToUnregistered: boolean,
  roleName: string,
};

type BackendDefaultIdentityRoleMap = {
  [roleName: string]: BackendDefaultRole,
  ...,
};

type Values = {
  backendRoleMap: BackendDefaultIdentityRoleMap,
  resourceName: string,
  resourceType: ResourceType,
};

/**
 * The `DefaultIdentityRoleMap` model is used to represent the roles that all
 * users hold for a given `AuthorizationResource` by default (i.e. without any
 * specific delegation by an Administrator). It can optionally apply to both
 * registered users as well as unregistered users.
 */

type DefaultValues = {
  /**
   * The name of the specific `AuthorizationResource` that this role map
   * corresponds to.
   */
  resourceName: string,

  /**
   * The mapping of `roleName` to individual roles that all users hold on the
   * the given `AuthorizationResource` by default.
   */
  roles: Zen.Map<DefaultRole>,
};

class DefaultIdentityRoleMap
  extends Zen.BaseModel<DefaultIdentityRoleMap, {}, DefaultValues>
  implements Serializable<BackendDefaultIdentityRoleMap> {
  static defaultValues: DefaultValues = {
    resourceName: '',
    roles: Zen.Map.create(),
  };

  static deserialize({
    backendRoleMap,
    resourceType,
    resourceName,
  }: Values): Zen.Model<DefaultIdentityRoleMap> {
    const roles: Zen.Map<DefaultRole> = Object.keys(backendRoleMap).reduce(
      (newRoles: Zen.Map<DefaultRole>, roleName: string) => {
        const backendRole: BackendDefaultRole = backendRoleMap[roleName];
        const { applyToUnregistered } = backendRole;
        const defaultRole: DefaultRole = DefaultRole.create({
          resourceType,
          resourceName,
          roleName,
          applyToUnregistered,
        });
        return newRoles.set(roleName, defaultRole);
      },
      Zen.Map.create(),
    );

    return DefaultIdentityRoleMap.create({
      resourceName,
      roles,
    });
  }

  serialize(): BackendDefaultIdentityRoleMap {
    const output: BackendDefaultIdentityRoleMap = {};
    this._.roles()
      .keys()
      .forEach((roleName: string) => {
        const role = this._.roles().forceGet(roleName);
        const rawRole: BackendDefaultRole = {
          applyToUnregistered: role.applyToUnregistered(),
          roleName,
        };
        output[roleName] = rawRole;
      });
    return output;
  }

  /**
   * Adds `role` to the role map. Updates role if one with the same name exists
   *
   * @param {DefaultRole} role The role object to add
   *
   * @returns {DefaultIdentityRoleMap} The updated `DefaultIdentityRoleMap`
   *                                   instance.
   */
  addRole(role: DefaultRole): Zen.Model<DefaultIdentityRoleMap> {
    if (this.hasRole(role)) {
      return this._;
    }
    const applyToUnregistered: boolean =
      role instanceof DefaultRole ? role.applyToUnregistered() : false;
    const { roleName, resourceName, resourceType } = role.modelValues();
    const newRole = DefaultRole.create({
      roleName,
      resourceName,
      resourceType,
      applyToUnregistered,
    });

    return this.deepUpdate()
      .roles()
      .set(roleName, newRole);
  }

  /**
   * Deletes `role` from the role map.
   *
   * @param {DefaultRole} role The role object to delete
   *
   * @returns {DefaultIdentityRoleMap} The updated `DefaultIdentityRoleMap`
   *                                   instance.
   */
  deleteRole(role: DefaultRole): Zen.Model<DefaultIdentityRoleMap> {
    if (!this.hasRole(role)) {
      return this._;
    }

    return this.deepUpdate()
      .roles()
      .delete(role.roleName());
  }

  /**
   * Gets the `DefaultRole` object associated with `roleName` from the role
   * map (if it exists).
   *
   * @param {Role | DefaultRole} roleName The role name for which to fetch the
   *                                      `DefaultRole` object for.
   *
   * @returns {DefaultRole} The corresponding role object (if it exists) or
   *                        `undefined`.
   */
  getRole(roleName: string): DefaultRole | void {
    return this._.roles().get(roleName);
  }

  /**
   * Returns whether or not `role` exists in the current instance. All field
   * values must match.
   *
   * @param {DefaultRole} role The `role` to look for.
   *
   * @returns {Boolean} `true` if `role` exists in the role map and `false`
   *                    otherwise.
   */
  hasRole(role: DefaultRole): boolean {
    if (!this._.roles().has(role.roleName())) {
      return false;
    }

    const targetRole: DefaultRole = this._.roles().forceGet(role.roleName());

    const roleNamesMatch: boolean = areStringsEqualIgnoreCase(
      targetRole.roleName(),
      role.roleName(),
    );

    if (role instanceof DefaultRole) {
      return (
        roleNamesMatch &&
        role.applyToUnregistered() === targetRole.applyToUnregistered()
      );
    }

    return roleNamesMatch;
  }
}

export default ((DefaultIdentityRoleMap: $Cast): Class<
  Zen.Model<DefaultIdentityRoleMap>,
>);
