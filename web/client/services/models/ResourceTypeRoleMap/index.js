// @flow
/* eslint-disable no-use-before-define */
import * as Zen from 'lib/Zen';
import Role from 'services/models/Role';
import { areStringsEqualIgnoreCase } from 'util/stringUtil';
import type { ResourceType } from 'services/AuthorizationService/types';
import type { Serializable } from 'lib/Zen';

// Model representation that we receive from the backend
type SerializedResourceTypeRoleMap = {
  resources: { [string]: $ReadOnlyArray<string>, ... },
  sitewideRoles: $ReadOnlyArray<string>,
};

const EMPTY_ZEN_ARRAY = Zen.Array.create();

export function deleteRoleFromList(
  allRoles: Zen.Array<string>,
  role: Role,
): Zen.Array<string> {
  const roleToDelete = role.roleName();
  return allRoles.findAndDelete(currentRole =>
    areStringsEqualIgnoreCase(currentRole, roleToDelete),
  );
}

interface MapUtil {
  hasRole(role: Role, map: Zen.Map<Zen.Model<ResourceTypeRoleMap>>): boolean;
  addRole(
    role: Role,
    map: Zen.Map<Zen.Model<ResourceTypeRoleMap>>,
  ): Zen.Map<Zen.Model<ResourceTypeRoleMap>>;
  deleteRole(
    role: Role,
    map: Zen.Map<Zen.Model<ResourceTypeRoleMap>>,
  ): Zen.Map<Zen.Model<ResourceTypeRoleMap>>;
  flatten(map: Zen.Map<Zen.Model<ResourceTypeRoleMap>>): Array<Role>;
}

/**
 * A model that maps resources of a specific type to roles that a user/security
 * group may hold on them in addition to representing all the sitewide roles
 * that a user/security group has for a particular resource type.
 */

type RequiredValues = {
  /**
   * The resource type associated with this role map.
   */
  resourceType: ResourceType,
};

type DefaultValues = {
  /**
   * The resource-specific role names that the user/group holds for individual
   * resources of the specified resource type.
   */
  resources: Zen.Map<Zen.Array<string>>,
  /**
   * The sitewide role names that the user/group holds for the specified
   * resource type.
   */
  sitewideRoles: Zen.Array<string>,
};

class ResourceTypeRoleMap
  extends Zen.BaseModel<ResourceTypeRoleMap, RequiredValues, DefaultValues>
  implements Serializable<SerializedResourceTypeRoleMap> {
  static defaultValues: DefaultValues = {
    resources: Zen.Map.create(),
    sitewideRoles: Zen.Array.create(),
  };

  static deserialize(
    { resources = {}, sitewideRoles = [] }: SerializedResourceTypeRoleMap,
    extraConfig: { resourceType: ResourceType },
  ): Zen.Model<ResourceTypeRoleMap> {
    const immutableSitewideRoles = Zen.Array.create(sitewideRoles);
    const immutableResources = Zen.Map.create(resources).map(value =>
      Zen.Array.create(value),
    );
    const { resourceType } = extraConfig;

    return ResourceTypeRoleMap.create({
      resources: immutableResources,
      sitewideRoles: immutableSitewideRoles,
      resourceType,
    });
  }

  /**
   * A collection of utility functions to work with a map of
   * ResourceTypeRoleMaps that map a resourceType to a ResourceTypeRoleMap. This
   * type of mapping is used in a SecurityGroup or User.
   */
  static MapUtil: MapUtil = {
    /**
     * Returns whether or not `role` exists in the given `map`.
     * @param {Role} role The `role` to look for.
     * @returns {Boolean} `true` if `role` exists in the role map and `false`
     *                    otherwise.
     */
    hasRole(role: Role, map: Zen.Map<Zen.Model<ResourceTypeRoleMap>>): boolean {
      const resourceType = role.resourceType();
      const roleMap = map.get(resourceType);
      return roleMap ? roleMap.hasRole(role) : false;
    },

    /**
     * Adds a new role to the appropriate `ResourceTypeRoleMap` in the given
     * `map`
     * @param {Role} roleToAdd The new role that is to be added to
     *                         `resourceTypeToRoleMap`
     * @returns {Zen.Map<ResourceTypeRoleMap>} An updated instance if there are
     *                      any changes or the same instance if there are none.
     */
    addRole(
      role: Role,
      map: Zen.Map<Zen.Model<ResourceTypeRoleMap>>,
    ): Zen.Map<Zen.Model<ResourceTypeRoleMap>> {
      if (ResourceTypeRoleMap.MapUtil.hasRole(role, map)) {
        return map;
      }

      const resourceType = role.resourceType();
      return map.apply(
        resourceType,
        roleMap => roleMap.addRole(role),
        ResourceTypeRoleMap.create({
          resourceType,
        }),
      );
    },

    /**
     * Deletes a role from the appropriate `ResourceTypeRoleMap` in the given
     * `map`.
     * @param {Role} roleToAdd The new role that is to be added to
     *                         `resourceTypeToRoleMap`
     * @returns {Zen.Map<ResourceTypeRoleMap>} An updated instance if there are
     *                       any changes or the same instance if there are none.
     */
    deleteRole(
      role: Role,
      map: Zen.Map<Zen.Model<ResourceTypeRoleMap>>,
    ): Zen.Map<Zen.Model<ResourceTypeRoleMap>> {
      if (!ResourceTypeRoleMap.MapUtil.hasRole(role, map)) {
        return map;
      }

      const resourceType = role.resourceType();
      return map.apply(
        resourceType,
        roleMap => (roleMap ? roleMap.deleteRole(role) : roleMap),
        ResourceTypeRoleMap.create({
          resourceType,
        }),
      );
    },

    /**
     * Flattens all the entries in the given `map`and returns them as n array of
     * `Role` instances.
     * @returns {Array<Role>} An updated instance if there are any
     *                        changes or the same instance if there are none.
     */
    flatten(map: Zen.Map<Zen.Model<ResourceTypeRoleMap>>): Array<Role> {
      return map.reduce(
        (rows, resourceRoleMap, resourceType) =>
          rows.concat(
            resourceRoleMap
              .resourceType(Zen.cast<ResourceType>(resourceType))
              .flatten(),
          ),
        [],
      );
    },
  };

  serialize(): SerializedResourceTypeRoleMap {
    const resources = {};
    this._.resources().forEach((value, key) => {
      resources[key] = value.arrayView();
    });
    return {
      resources,
      sitewideRoles: this._.sitewideRoles().arrayView(),
    };
  }

  /**
   * Returns whether or not `role` exists in the current instance.
   *
   * @param {Role} role The `role` to look for.
   *
   * @returns {Boolean} `true` if `role` exists in the role map and `false`
   *                    otherwise.
   */
  hasRole(role: Role): boolean {
    const roles = role.isSitewide()
      ? this._.sitewideRoles()
      : this._.resources().get(role.resourceName(), EMPTY_ZEN_ARRAY);

    return roles.some(currentRole =>
      areStringsEqualIgnoreCase(currentRole, role.roleName()),
    );
  }

  /**
   * Deletes `role` from the role map.
   *
   * @param {Role} role The role object to delete
   *
   * @returns {ResourceTypeRoleMap} The updated `ResourceTypeRoleMap` instance.
   */
  deleteRole(role: Role): Zen.Model<ResourceTypeRoleMap> {
    if (!this.hasRole(role)) {
      return this._;
    }

    if (role.isSitewide()) {
      const updatedRoles = deleteRoleFromList(this._.sitewideRoles(), role);
      return this._.sitewideRoles(updatedRoles);
    }

    return this._deleteResourceRole(role);
  }

  /**
   * Adds `role` to the role map.
   *
   * @param {Role} role The role object to add
   *
   * @returns {ResourceTypeRoleMap} The updated `ResourceTypeRoleMap` instance.
   */
  addRole(role: Role): Zen.Model<ResourceTypeRoleMap> {
    if (this.hasRole(role)) {
      return this._;
    }

    if (role.isSitewide()) {
      return this.deepUpdate()
        .sitewideRoles()
        .push(role.roleName());
    }

    const resources = this._.resources().apply(
      role.resourceName(),
      roleNames => roleNames.push(role.roleName()),
      Zen.Array.create(),
    );
    return this._.resources(resources);
  }

  /**
   * Flattens all the entries in the current instance and returns them as an
   * enumeration of `Role` instances.
   *
   * @returns {Array<Role>} An updated instance if there are any
   *                                changes or the same instance if there are
   *                                none.
   */
  flatten(): Array<Role> {
    const rows = [];
    const resourceType: ResourceType = this._.resourceType();
    this._.sitewideRoles().forEach(roleName => {
      const sitewideRole = Role.create({
        resourceType,
        roleName,
        resourceName: '',
      });
      rows.push(sitewideRole);
    });

    const resources = this._.resources();
    resources.keys().forEach(resourceName => {
      const resourceSpecificRoles = resources.forceGet(resourceName);
      resourceSpecificRoles.forEach(roleName => {
        const resourceRole = Role.create({
          resourceType,
          roleName,
          resourceName,
        });
        rows.push(resourceRole);
      });
    });

    return rows;
  }

  _deleteResourceRole(role: Role): Zen.Model<ResourceTypeRoleMap> {
    const resources = this._.resources().apply(
      role.resourceName(),
      roleNames => deleteRoleFromList(roleNames, role),
      Zen.Array.create(),
    );
    return this._.resources(resources);
  }
}

export default ((ResourceTypeRoleMap: $Cast): Class<
  Zen.Model<ResourceTypeRoleMap>,
>);
