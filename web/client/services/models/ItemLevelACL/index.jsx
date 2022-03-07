// @flow
import * as Zen from 'lib/Zen';
import Resource from 'services/models/Resource';
import ResourceRole from 'services/models/ResourceRole';
import type { Serializable } from 'lib/Zen';

// Model representation that we receive from the backend
type SerializedItemLevelACL = {
  $uri: string,
  resource: Zen.Serialized<Resource>,
  resourceRole: Zen.Serialized<ResourceRole>,
};

type RequiredValues = {
  resource: Resource,
  resourceRole: ResourceRole,
};

type DefaultValues = {
  uri: string,
};

class ItemLevelACL
  extends Zen.BaseModel<ItemLevelACL, RequiredValues, DefaultValues>
  implements Serializable<SerializedItemLevelACL> {
  static defaultValues: DefaultValues = {
    uri: '',
  };

  static deserialize(values: SerializedItemLevelACL): Zen.Model<ItemLevelACL> {
    const { $uri, resource, resourceRole } = values;
    return ItemLevelACL.create({
      uri: $uri,
      resource: Resource.deserialize(resource),
      resourceRole: ResourceRole.deserialize(resourceRole),
    });
  }

  serialize(): SerializedItemLevelACL {
    const { uri, resource, resourceRole } = this.modelValues();
    return {
      $uri: uri,
      resource: resource.serialize(),
      resourceRole: resourceRole.serialize(),
    };
  }
}

export default ((ItemLevelACL: $Cast): Class<Zen.Model<ItemLevelACL>>);
