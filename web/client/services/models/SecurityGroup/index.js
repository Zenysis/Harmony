// @flow
import * as Zen from 'lib/Zen';
import ItemLevelACL from 'services/models/ItemLevelACL';
import RoleDefinition from 'services/models/RoleDefinition';
import User from 'services/models/User';
import type { Serializable } from 'lib/Zen';

// Model representation that we receive from the backend
type SerializedSecurityGroup = {
  acls: Array<Zen.Serialized<ItemLevelACL>>,
  name: string,
  roles: Array<Zen.Serialized<RoleDefinition>>,
  users: Array<Zen.Serialized<User>>,
  $uri: string,
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

  /**
   *  The users in the group
   */
  users: Zen.Array<User>,

  /** The unique uri that can be used to locate this group on the server */
  uri: string,
};

class SecurityGroup extends Zen.BaseModel<SecurityGroup, {}, DefaultValues>
  implements Serializable<SerializedSecurityGroup> {
  static defaultValues: DefaultValues = {
    acls: Zen.Array.create(),
    name: '',
    roles: Zen.Array.create(),
    users: Zen.Array.create(),
    uri: '',
  };

  static deserialize(
    values: SerializedSecurityGroup,
  ): Zen.Model<SecurityGroup> {
    const { acls, name, roles, users, $uri } = values;
    return SecurityGroup.create({
      acls: Zen.deserializeToZenArray(ItemLevelACL, acls),
      name,
      roles: Zen.deserializeToZenArray(RoleDefinition, roles),
      users: Zen.deserializeToZenArray(User, users),
      uri: $uri,
    });
  }

  serialize(): SerializedSecurityGroup {
    const { acls, name, roles, users, uri } = this.modelValues();
    return {
      name,
      acls: Zen.serializeArray(acls),
      roles: Zen.serializeArray(roles),
      users: Zen.serializeArray(users),
      $uri: uri,
    };
  }
}

export default ((SecurityGroup: $Cast): Class<Zen.Model<SecurityGroup>>);
