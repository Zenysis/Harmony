// @flow
import * as Zen from 'lib/Zen';
import ResourceTypeRoleMap from 'services/models/ResourceTypeRoleMap';
import type { Serializable } from 'lib/Zen';

export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
};

export type UserStatus = 'active' | 'inactive' | 'pending';

// Model representation that we receive from the backend
// NOTE(stephen): It seems really weird to have a backend user that can have
// optional fields (like $uri). This happens because there is a "concise user"
// schema that is sometimes returned.
// TODO(stephen, anyone): Instead of sending the serialized user multiple times,
// have a user service that operates on the $uri and retrieves the full user.
// This will let us avoid issuing multiple calls to /user and can also make it
// so we have the same user instance instead of two separate ones with half
// defined properties in each.
type BackendUser = {
  $uri: string | void,
  firstName: string,
  lastName: string,
  username: string,
  phoneNumber: string | void,
  active: boolean | void,
  status: UserStatus | void,
  roles: { [string]: Zen.Serialized<ResourceTypeRoleMap> } | void,
};

/**
 * The User model is used by the `DirectoryService` to
 * represent an individual user.
 */

type DefaultValues = {
  /**
   * The user's unique username.
   */
  username: string,
  /**
   * The user's first name.
   */
  firstName: string,
  /**
   * The user's last name.
   */
  lastName: string,
  /**
   * The user's phone number.
   */
  phoneNumber: string,
  /**
   * The roles held by this user.
   */
  roles: Zen.Map<ResourceTypeRoleMap>,
  /**
   * The user's current status.
   */
  status: UserStatus | void,
  /**
   * @readonly
   * The unique uri that can be used to locate this user on the server.
   */
  uri: Zen.ReadOnly<string>,
};

class User extends Zen.BaseModel<User, {}, DefaultValues>
  implements Serializable<$Shape<BackendUser>> {
  static defaultValues = {
    username: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    roles: Zen.Map.ofType(ResourceTypeRoleMap).create(),
    status: undefined,
    uri: '',
  };

  static deserialize(values: BackendUser): Zen.Model<User> {
    const { firstName, lastName, phoneNumber, username, status } = values;
    const roles = values.roles || {};
    return User.create({
      firstName,
      lastName,
      phoneNumber,
      username,
      status,
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

  serialize(): $Shape<BackendUser> {
    const {
      firstName,
      lastName,
      phoneNumber,
      username,
      status,
    } = this.modelValues();
    return { firstName, lastName, phoneNumber, username, status };
  }

  getUserFullName(): string {
    return [this._.lastName(), this._.firstName()]
      .filter(namePart => !!namePart)
      .join(', ');
  }
}

export default ((User: any): Class<Zen.Model<User>>);
