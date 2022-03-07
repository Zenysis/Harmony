// @flow
import * as Zen from 'lib/Zen';
import ItemLevelACL from 'services/models/ItemLevelACL';
import RoleDefinition from 'services/models/RoleDefinition';
import type { Serializable } from 'lib/Zen';

export type UserStatusMap = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
};

export type UserStatus = $Values<UserStatusMap>;

export const USER_STATUS: UserStatusMap = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
};

// Model representation that we receive from the backend
// NOTE(stephen): It seems really weird to have a backend user that can have
// optional fields (like $uri). This happens because there is a "concise user"
// schema that is sometimes returned.
// TODO(stephen, anyone): Instead of sending the serialized user multiple times,
// have a user service that operates on the $uri and retrieves the full user.
// This will let us avoid issuing multiple calls to /user and can also make it
// so we have the same user instance instead of two separate ones with half
// defined properties in each.
type SerializedUser = {
  acls: Array<Zen.Serialized<ItemLevelACL>>,
  $uri: string | void,
  firstName: string,
  lastName: string,
  username: string,
  phoneNumber: string | void,
  active: boolean | void,
  status: UserStatus,
  roles: Array<Zen.Serialized<RoleDefinition>>,
};

/**
 * The User model is used by the `DirectoryService` to
 * represent an individual user.
 */
type DefaultValues = {
  /** ACLs associated with this user. */
  acls: Zen.Array<ItemLevelACL>,

  /** The user's unique username. */
  username: string,

  /** The user's first name. */
  firstName: string,

  /** The user's last name. */
  lastName: string,

  /** The user's phone number. */
  phoneNumber: string,

  /** The roles held by this user. */
  roles: Zen.Array<RoleDefinition>,

  /** The user's current status. */
  status: UserStatus,

  /** The unique uri that can be used to locate this user on the server. */
  uri: string,
};

class User extends Zen.BaseModel<User, {}, DefaultValues>
  implements Serializable<$Shape<SerializedUser>> {
  static defaultValues: DefaultValues = {
    acls: Zen.Array.create(),
    username: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    roles: Zen.Array.create(),
    status: USER_STATUS.PENDING,
    uri: '',
  };

  static deserialize(values: SerializedUser): Zen.Model<User> {
    const { acls, firstName, lastName, phoneNumber, username, status } = values;
    const roles = values.roles || [];
    const deserializedACLs = acls
      ? Zen.deserializeToZenArray(ItemLevelACL, acls)
      : Zen.Array.create();
    return User.create({
      acls: deserializedACLs,
      firstName,
      lastName,
      phoneNumber,
      username,
      status,
      roles: Zen.deserializeToZenArray(RoleDefinition, roles),
      uri: values.$uri,
    });
  }

  serialize(): $Shape<SerializedUser> {
    const {
      acls,
      firstName,
      lastName,
      phoneNumber,
      username,
      status,
      uri,
    } = this.modelValues();
    return {
      firstName,
      lastName,
      phoneNumber,
      username,
      status,
      acls: Zen.serializeArray(acls),
      $uri: uri,
    };
  }

  getUserFullName(): string {
    return [this._.lastName(), this._.firstName()]
      .filter(namePart => !!namePart)
      .join(', ');
  }
}

export default ((User: $Cast): Class<Zen.Model<User>>);
