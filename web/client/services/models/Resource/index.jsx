// @flow
import * as Zen from 'lib/Zen';
import type { ResourceType } from 'services/AuthorizationService/types';
import type { Serializable } from 'lib/Zen';

type SerializedResource = {
  $uri: string,
  label: string,
  name: string,
  resourceType: ResourceType,
};

export type DefaultValues = {
  /** The human-readable name of the resource. */
  label: string,

  /** The unique string representation of the resource in the system. */
  name: string,

  /**
   * The unique uri that can be used to locate this authorization resource on
   * the server.
   */
  uri: string,
};

export type RequiredValues = {
  /**
   * The specific type of resource that this instance refers to.
   */
  resourceType: ResourceType,
};

export const defaultValues: DefaultValues = {
  label: '',
  name: '',
  uri: '',
};

class Resource extends Zen.BaseModel<Resource, RequiredValues, DefaultValues>
  implements Serializable<SerializedResource> {
  static defaultValues: DefaultValues = defaultValues;

  static deserialize({
    $uri,
    label,
    name,
    resourceType,
  }: SerializedResource): Zen.Model<Resource> {
    return Resource.create({
      label,
      name,
      resourceType,
      uri: $uri,
    });
  }

  serialize(): SerializedResource {
    const { label, name, resourceType, uri } = this.modelValues();
    return {
      label,
      name,
      resourceType,
      $uri: uri,
    };
  }
}

export default ((Resource: $Cast): Class<Zen.Model<Resource>>);
