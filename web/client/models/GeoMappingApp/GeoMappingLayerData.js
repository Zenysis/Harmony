// @flow
import * as Zen from 'lib/Zen';
import type { FilterCategoryHierarchy } from 'models/GeoMappingApp/types';
import type { Serializable } from 'lib/Zen';

type RequiredValues = {
  id: string,
  metadata: $ReadOnlyArray<{
    label: string,
    isFilterable: boolean,
    showKey: boolean,
  }>,
  name: string,
  propertyHierarchy: FilterCategoryHierarchy,
  url: string,
};

type SerializedGeoMappingLayerData = {
  id: string,
  metadata: $ReadOnlyArray<{
    label: string,
    isFilterable: boolean,
    showKey: boolean,
  }>,
  name: string,
  propertyHierarchy: FilterCategoryHierarchy,
  url: string,
};

class GeoMappingLayerData
  extends Zen.BaseModel<GeoMappingLayerData, RequiredValues>
  implements Serializable<SerializedGeoMappingLayerData> {
  static deserialize(
    values: SerializedGeoMappingLayerData,
  ): Zen.Model<GeoMappingLayerData> {
    return GeoMappingLayerData.create({ ...values });
  }

  serialize(): SerializedGeoMappingLayerData {
    return {
      id: this._.id(),
      metadata: this._.metadata(),
      name: this._.name(),
      propertyHierarchy: this._.propertyHierarchy(),
      url: this._.url(),
    };
  }
}

export default ((GeoMappingLayerData: $Cast): Class<
  Zen.Model<GeoMappingLayerData>,
>);
