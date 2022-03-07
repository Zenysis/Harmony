// @flow
import * as Zen from 'lib/Zen';
import type { EntityFilterValueMap } from 'models/GeoMappingApp/types';
import type { Feature } from 'components/ui/visualizations/MapCore/types';
import type { Serializable } from 'lib/Zen';

type RequiredValues = {
  /** List of features */
  entityFeatures: $ReadOnlyArray<Feature>,

  /** A collection of all possible filter values, grouped by category */
  filterOptionsMap: EntityFilterValueMap,
};

type SerializedGeoEntityLayerData = {
  entityFeatures: $ReadOnlyArray<Feature>,
  filterOptionsMap: EntityFilterValueMap,
};

/**
 * The GeoEntityLayerData stores raw data such as all the features in this
 * layer, as well as all possible filter selections. This is a lot
 * of information, so we should avoid persisting this anywhere as
 * much as possible.
 */
class GeoEntityLayerData
  extends Zen.BaseModel<GeoEntityLayerData, RequiredValues>
  implements Serializable<SerializedGeoEntityLayerData> {
  static deserialize(
    values: SerializedGeoEntityLayerData,
  ): Zen.Model<GeoEntityLayerData> {
    return GeoEntityLayerData.create(values);
  }

  serialize(): SerializedGeoEntityLayerData {
    return this.modelValues();
  }
}

export default ((GeoEntityLayerData: $Cast): Class<
  Zen.Model<GeoEntityLayerData>,
>);
