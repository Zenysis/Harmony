// @flow
import * as Zen from 'lib/Zen';
import type { Values } from 'services/models/Role';

/**
 * The `DefaultRole` model is used by the `AuthorizationService` to represent an
 * association between a `RoleDefinition` and either:
 *  1 - All `AuthorizationResource`(s) of a given type
 *  2 - A specific `AuthorizationResource` AND resource type.
 *
 * Unlike the standard `Role` model, it can optionally apply to unregistered
 * users in ADDITION to registered users (who it applies to by default).
 */

type DefaultValues = {
  /**
   * Indicates if the `Role` only applies to registered to users. If set to
   * `false`, unregistered users will NOT recieve this role. If set to `true`,
   * BOTH registered and unregistered users will receive this role.
   */
  applyToUnregistered: boolean,
};

class DefaultRole extends Zen.BaseModel<DefaultRole, Values, DefaultValues> {
  static defaultValues: DefaultValues = {
    applyToUnregistered: false,
  };
}

export default ((DefaultRole: $Cast): Class<Zen.Model<DefaultRole>>);
