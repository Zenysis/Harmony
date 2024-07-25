// @flow
import * as Zen from 'lib/Zen';
import APIToken from 'services/models/APIToken';
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
// NOTE: It seems really weird to have a backend user that can have
// optional fields (like $uri). This happens because there is a "concise user"
// schema that is sometimes returned.
// TODO: Instead of sending the serialized user multiple times,
// have a user service that operates on the $uri and retrieves the full user.
// This will let us avoid issuing multiple calls to /user and can also make it
// so we have the same user instance instead of two separate ones with half
// defined properties in each.
type SerializedUser = {
  $uri: string | void,
  acls: Array<Zen.Serialized<ItemLevelACL>>,
  active: boolean | void,
  apiTokens: Array<Zen.Serialized<APIToken>>,
  firstName: string,
  lastName: string,
  phoneNumber: string | void,
  roles: Array<Zen.Serialized<RoleDefinition>>,
  status: UserStatus,
  username: string,
};

/**
 * The User model is used by the `DirectoryService` to
 * represent an individual user.
 */
type DefaultValues = {
  /** ACLs associated with this user. */
  acls: Zen.Array<ItemLevelACL>,

  /** API Tokens associated with this user. */
  apiTokens: Zen.Array<APIToken>,

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

  /** The user's unique username. */
  username: string,
};

class User extends Zen.BaseModel<User, {}, DefaultValues>
  implements Serializable<$Shape<SerializedUser>> {
  static defaultValues: DefaultValues = {
    acls: Zen.Array.create(),
    apiTokens: Zen.Array.create(),
    firstName: '',
    lastName: '',
    phoneNumber: '',
    roles: Zen.Array.create(),
    status: USER_STATUS.PENDING,
    uri: '',
    username: '',
  };

  static deserialize(values: SerializedUser): Zen.Model<User> {
    const {
      acls,
      apiTokens,
      firstName,
      lastName,
      phoneNumber,
      status,
      username,
    } = values;
    const roles = values.roles || [];
    const deserializedACLs = acls
      ? Zen.deserializeToZenArray(ItemLevelACL, acls)
      : Zen.Array.create();
    return User.create({
      firstName,
      lastName,
      phoneNumber,
      status,
      username,
      acls: deserializedACLs,
      apiTokens: apiTokens
        ? Zen.deserializeToZenArray(APIToken, apiTokens)
        : Zen.Array.create(),
      roles: Zen.deserializeToZenArray(RoleDefinition, roles),
      uri: values.$uri,
    });
  }

  serialize(): $Shape<SerializedUser> {
    const {
      acls,
      apiTokens,
      firstName,
      lastName,
      phoneNumber,
      status,
      uri,
      username,
    } = this.modelValues();
    return {
      firstName,
      lastName,
      phoneNumber,
      status,
      username,
      $uri: uri,
      acls: Zen.serializeArray(acls),
      apiTokens: Zen.serializeArray(apiTokens),
    };
  }

  getUserFullName(): string {
    return [this._.lastName(), this._.firstName()]
      .filter(namePart => !!namePart)
      .join(', ');
  }
}

export default ((User: $Cast): Class<Zen.Model<User>>);
