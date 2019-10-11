// @flow
import * as Zen from 'lib/Zen';
import ResourceTypeRoleMap from 'services/models/ResourceTypeRoleMap';
import User from 'services/models/User';
import type { Serializable } from 'lib/Zen';

// Model representation that we receive from the backend
type BackendSecurityGroup = {
  $uri: string,
  name: string,
  users: Array<Zen.Serialized<User>>,

  // TODO(pablo, vedant): is this type correct? BackendResourceTypeRoleMap
  // includes a `resourceType` key, but in `deserialize` we treat is as if
  // that key is missing
  roles: { [string]: Zen.Serialized<ResourceTypeRoleMap> },
};

/**
 * The SecurityGroup model is used by the `DirectoryService` to
 * represent a Group of Users and Roles.
 */

type DefaultValues = {
  /**
   *  The unique name of the group.
   */
  name: string,
  /**
   *  The users in the group
   */
  users: Zen.Array<User>,
  /**
   * The roles held by this group
   */
  roles: Zen.Map<ResourceTypeRoleMap>,
  /**
   * @readonly
   * The unique uri that can be used to locate this group on the server
   */
  uri: Zen.ReadOnly<string>,
};

class SecurityGroup extends Zen.BaseModel<SecurityGroup, {}, DefaultValues>
  implements Serializable<$Shape<BackendSecurityGroup>> {
  static defaultValues = {
    name: '',
    users: Zen.Array.create(),
    roles: Zen.Map.create(),
    uri: '',
  };

  static deserialize(values: BackendSecurityGroup): Zen.Model<SecurityGroup> {
    const users = Zen.Array.create(values.users).map(user =>
      User.deserialize(user),
    );
    const { name, roles } = values;

    return SecurityGroup.create({
      name,
      users,
      roles: Zen.deserializeToZenMap(
        ResourceTypeRoleMap,
        roles,
        resourceType => ({
          resourceType,
        }),
      ),
      uri: values.$uri,
    });
  }

  serialize(): $Shape<BackendSecurityGroup> {
    const { name } = this.modelValues();
    return { name };
  }
}

export default ((SecurityGroup: any): Class<Zen.Model<SecurityGroup>>);
