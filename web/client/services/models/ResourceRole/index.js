// @flow
import * as Zen from 'lib/Zen';
import type { ResourceType } from 'services/AuthorizationService/types';
import type { Serializable } from 'lib/Zen';

type SerializedRoleResource = {
  name: string,
  resourceType: ResourceType,
  $uri: string,
};

/**
 * Maps to the backend definition for a ResourceRole
 */

type RequiredValues = {
  /**
   * The resource type this role is associated with.
   */
  resourceType: ResourceType,
};

type DefaultValues = {
  /**
   * The unique string value that is used to represent this role on the backend
   * and in user/security group permissions
   */
  name: string,

  /**
   * The unique uri that can be used to locate this role definition on the
   * server.
   */
  uri: string,
};

class ResourceRole
  extends Zen.BaseModel<ResourceRole, RequiredValues, DefaultValues>
  implements Serializable<SerializedRoleResource> {
  static defaultValues: DefaultValues = {
    name: '',
    uri: '',
  };

  static deserialize({
    name,
    resourceType,
    $uri,
  }: SerializedRoleResource): Zen.Model<ResourceRole> {
    return ResourceRole.create({
      name,
      resourceType,
      uri: $uri,
    });
  }

  serialize(): SerializedRoleResource {
    const { name, resourceType, uri } = this.modelValues();
    return {
      name,
      resourceType,
      $uri: uri,
    };
  }
}

export default ((ResourceRole: $Cast): Class<Zen.Model<ResourceRole>>);
