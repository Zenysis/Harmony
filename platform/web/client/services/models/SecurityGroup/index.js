// @flow
import * as Zen from 'lib/Zen';
import ItemLevelACL from 'services/models/ItemLevelACL';
import RoleDefinition from 'services/models/RoleDefinition';
import User from 'services/models/User';
import type { Serializable } from 'lib/Zen';

// Model representation that we receive from the backend
type SerializedSecurityGroup = {
  $uri: string,
  acls: Array<Zen.Serialized<ItemLevelACL>>,
  name: string,
  roles: Array<Zen.Serialized<RoleDefinition>>,
  users: Array<Zen.Serialized<User>>,
};

/**
 * The SecurityGroup model is used by the `DirectoryService` to
 * represent a Group of Users and Roles.
 */

type DefaultValues = {
  acls: Zen.Array<ItemLevelACL>,
  /**
   *  The unique name of the group.
   */
  name: string,
  /**
   * The roles held by this group
   */
  roles: Zen.Array<RoleDefinition>,

  /** The unique uri that can be used to locate this group on the server */
  uri: string,

  /**
   *  The users in the group
   */
  users: Zen.Array<User>,
};

class SecurityGroup extends Zen.BaseModel<SecurityGroup, {}, DefaultValues>
  implements Serializable<SerializedSecurityGroup> {
  static defaultValues: DefaultValues = {
    acls: Zen.Array.create(),
    name: '',
    roles: Zen.Array.create(),
    uri: '',
    users: Zen.Array.create(),
  };

  static deserialize(
    values: SerializedSecurityGroup,
  ): Zen.Model<SecurityGroup> {
    const { $uri, acls, name, roles, users } = values;
    return SecurityGroup.create({
      name,
      acls: Zen.deserializeToZenArray(ItemLevelACL, acls),
      roles: Zen.deserializeToZenArray(RoleDefinition, roles),
      uri: $uri,
      users: Zen.deserializeToZenArray(User, users),
    });
  }

  serialize(): SerializedSecurityGroup {
    const { acls, name, roles, uri, users } = this.modelValues();
    return {
      name,
      $uri: uri,
      acls: Zen.serializeArray(acls),
      roles: Zen.serializeArray(roles),
      users: Zen.serializeArray(users),
    };
  }
}

export default ((SecurityGroup: $Cast): Class<Zen.Model<SecurityGroup>>);
