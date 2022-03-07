// @flow
import * as Zen from 'lib/Zen';
import Role from 'services/models/Role';
import { areStringsEqualIgnoreCase } from 'util/stringUtil';
import type { ResourceType } from 'services/AuthorizationService/types';
import type { Serializable } from 'lib/Zen';

type BackendIdentityRoleMap = { [string]: $ReadOnlyArray<string>, ... };

type SerializedIdentityRoleMap = {
  backendRoleMap: BackendIdentityRoleMap,
  resourceName: string,
  resourceType: ResourceType,
};

const EMPTY_ZEN_ARRAY: Zen.Array<Role> = Zen.Array.create();

/**
 * The `IdentityRoleMap` model is used to represent the roles held by either an
 * individual user or security group (referred to as `identities`) for a given
 * `AuthorizationResource`.
 */
type DefaultValues = {
  /**
   * The name of the specific `AuthorizationResource` that this role map
   * corresponds to.
   */
  resourceName: string,

  /**
   * The mapping of `identityName` to individual roles that individual
   * `identities` hold on the the given `AuthorizationResource` by default.
   */
  roles: Zen.Map<Zen.Array<Role>>,
};

class IdentityRoleMap extends Zen.BaseModel<IdentityRoleMap, {}, DefaultValues>
  implements Serializable<BackendIdentityRoleMap> {
  static defaultValues: DefaultValues = {
    resourceName: '',
    roles: Zen.Map.create(),
  };

  static deserialize({
    backendRoleMap,
    resourceType,
    resourceName,
  }: SerializedIdentityRoleMap): Zen.Model<IdentityRoleMap> {
    const roles: Zen.Map<Zen.Array<Role>> = Object.keys(backendRoleMap).reduce(
      (newRoles: Zen.Map<Zen.Array<Role>>, identityName: string) => {
        const roleNames: $ReadOnlyArray<string> = backendRoleMap[identityName];
        const identityRoles: Zen.Array<Role> = Zen.Array.create(
          roleNames.map(roleName =>
            Role.create({
              resourceType,
              resourceName,
              roleName,
            }),
          ),
        );
        return newRoles.set(identityName, identityRoles);
      },
      Zen.Map.create(),
    );

    return IdentityRoleMap.create({
      resourceName,
      roles,
    });
  }

  serialize(): BackendIdentityRoleMap {
    const output: BackendIdentityRoleMap = {};
    this._.roles()
      .keys()
      .forEach((identityName: string) => {
        const roles: Zen.Array<Role> = this._.roles().forceGet(identityName);
        const roleNames: $ReadOnlyArray<string> = roles
          .map((role: Role) => role.roleName())
          .arrayView();
        output[identityName] = roleNames;
      });
    return output;
  }

  /**
   * Adds `role` to the role map.
   *
   * @param {Role} role The role object to add
   *
   * @returns {IdentityRoleMap} The updated `IdentityRoleMap` instance.
   */
  addRole(identityName: string, role: Role): Zen.Model<IdentityRoleMap> {
    if (this.hasRole(identityName, role)) {
      return this._;
    }

    let identityRoles: Zen.Array<Role> = this._.roles().get(
      identityName,
      EMPTY_ZEN_ARRAY,
    );
    identityRoles = identityRoles.push(role);
    const roles = this._.roles().set(identityName, identityRoles);
    return this._.roles(roles);
  }

  /**
   * Deletes `role` from the role map for `identityName` (if it exists).
   *
   * @param {string} identityName Depending on what the current instance
   *                              corresponds to, either a username or
   *                              security group name for whom the role listing
   *                              is desired.
   *
   * @param {Role} role The role object to delete
   *
   * @returns {IdentityRoleMap} The updated `IdentityRoleMap` instance.
   */
  deleteRole(identityName: string, role: Role): Zen.Model<IdentityRoleMap> {
    if (
      !this.hasRole(identityName, role) ||
      !this._.roles().has(identityName)
    ) {
      return this._;
    }

    const roleName = role.roleName();
    const identityRoles = this._.roles()
      .forceGet(identityName)
      .findAndDelete(currentRole =>
        areStringsEqualIgnoreCase(currentRole.roleName(), roleName),
      );
    const roles = this._.roles().set(identityName, identityRoles);
    return this._.roles(roles);
  }

  /**
   * Gets all the `Role` instances associated with `identityName` from the role
   * map.
   *
   * @param {string} identityName Depending on what the current instance
   *                              corresponds to, either a username or
   *                              security group name for whom the role listing
   *                              is desired.
   *
   * @returns {Zen.Array<Role>} A listing of all the `Role` instances associated
   *                           with `identityName`. If there are no `Role`
   *                           instances, the output array will be empty.
   */
  getRoles(identityName: string): Zen.Array<Role> {
    return this._.roles().get(identityName, EMPTY_ZEN_ARRAY);
  }

  /**
   * Deletes ALL the `Role` instances held by `identityName` (if any) from the
   * role map.
   *
   * @param {string} identityName Depending on what the current instance
   *                              corresponds to, either a username or
   *                              security group name for whom the role listing
   *                              is desired.
   *
   * @returns {IdentityRoleMap} The updated `IdentityRoleMap` instance.
   */
  deleteAllRoles(identityName: string): Zen.Model<IdentityRoleMap> {
    if (!this._.roles().has(identityName)) {
      return this._;
    }
    const roles = this._.roles().delete(identityName);
    return this._.roles(roles);
  }

  /**
   * Returns whether or not `role` exists in the current instance.
   *
   * @param {Role} role The `role` to look for.
   *
   * @returns {Boolean} `true` if `role` exists in the role map and `false`
   *                    otherwise.
   */
  hasRole(identityName: string, role: Role): boolean {
    if (!this._.roles().has(identityName)) {
      return false;
    }

    const identityRoles: Zen.Array<Role> = this._.roles().get(
      identityName,
      EMPTY_ZEN_ARRAY,
    );

    return identityRoles.some(currentRole =>
      areStringsEqualIgnoreCase(role.roleName(), currentRole.roleName()),
    );
  }
}

export default ((IdentityRoleMap: $Cast): Class<Zen.Model<IdentityRoleMap>>);
