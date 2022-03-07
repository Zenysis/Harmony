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
  users: Array<$Shape<Zen.Serialized<User>>>,
  groups: Array<$Shape<Zen.Serialized<SecurityGroup>>>,
  roles: Zen.Serialized<ResourceRoleMap>,
};

const EMPTY_BACKEND_ROLES: Zen.Serialized<ResourceRoleMap> = {
  userRoles: {},
  groupRoles: {},
  sitewideResourceAcl: {
    registeredResourceRole: '',
    unregisteredResourceRole: '',
  },
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
    const { label, name, resourceType, $uri } = values;

    const roles: Zen.Serialized<ResourceRoleMap> = values.roles
      ? values.roles
      : EMPTY_BACKEND_ROLES;

    return AuthorizationResource.create({
      name,
      label,
      resourceType,
      roles: ResourceRoleMap.deserialize({
        backendResourceRoleMap: roles,
        resourceType,
        resourceName: name,
      }),
      uri: $uri,
    });
  }
}

export default ((AuthorizationResource: $Cast): Class<
  Zen.Model<AuthorizationResource>,
>);
