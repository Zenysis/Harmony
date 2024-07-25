// @flow
import * as Zen from 'lib/Zen';
import ResourceRoleMap from 'services/models/ResourceRoleMap';
import { defaultValues as resourceDefaultValues } from 'services/models/Resource';
import type Resource, {
  DefaultValues as ResourceDefaultValuesType,
  RequiredValues as ResourceRequiredValuesType,
} from 'services/models/Resource';
import type SecurityGroup from 'services/models/SecurityGroup';
import type User from 'services/models/User';

type BackendAuthorizationResource = {
  ...Zen.Serialized<Resource>,
  groups: Array<$Shape<Zen.Serialized<SecurityGroup>>>,
  roles: Zen.Serialized<ResourceRoleMap>,
  users: Array<$Shape<Zen.Serialized<User>>>,
};

const EMPTY_BACKEND_ROLES: Zen.Serialized<ResourceRoleMap> = {
  groupRoles: {},
  sitewideResourceAcl: {
    registeredResourceRole: '',
    unregisteredResourceRole: '',
  },
  userRoles: {},
};

type DefaultValues = {
  ...ResourceDefaultValuesType,
  /**
   * The detailed mapping of roles to individual users, security groups and the
   * default roles assigned to registered (and potentially unregistered) users
   * for this resource.
   */
  roles: ResourceRoleMap,
};

type RequiredValues = {
  ...ResourceRequiredValuesType,
};

class AuthorizationResource extends Zen.BaseModel<
  AuthorizationResource,
  RequiredValues,
  DefaultValues,
> {
  static defaultValues: DefaultValues = {
    ...resourceDefaultValues,
    roles: ResourceRoleMap.create({}),
  };

  static deserialize(
    values: BackendAuthorizationResource,
  ): Zen.Model<AuthorizationResource> {
    const { $uri, label, name, resourceType } = values;

    const roles: Zen.Serialized<ResourceRoleMap> = values.roles
      ? values.roles
      : EMPTY_BACKEND_ROLES;

    return AuthorizationResource.create({
      label,
      name,
      resourceType,
      roles: ResourceRoleMap.deserialize({
        resourceType,
        backendResourceRoleMap: roles,
        resourceName: name,
      }),
      uri: $uri,
    });
  }
}

export default ((AuthorizationResource: $Cast): Class<
  Zen.Model<AuthorizationResource>,
>);
