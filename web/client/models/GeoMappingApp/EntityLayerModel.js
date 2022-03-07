// @flow
import * as Zen from 'lib/Zen';
import GeoEntityLayerData from 'models/GeoMappingApp/GeoEntityLayerData';
import GeoEntityLayerFilterSettings from 'models/GeoMappingApp/GeoEntityLayerFilterSettings';
import LayerStyleSettings from 'models/GeoMappingApp/LayerStyleSettings';
import type { GeoLayerModel } from 'models/GeoMappingApp/GeoLayerModel';
import type { Serializable } from 'lib/Zen';

type RequiredValues = {
  /** ID of this layer */
  id: string,

  /** Stores visual layer settings such as label style, color, etc */
  styleSettings: LayerStyleSettings,
};

type DefaultValues = {
  /**
   * Contains all features available in this layer, as well available
   * filter values
   */
  data: GeoEntityLayerData | void,

  /**
   * Stores filtering and coloring information such as a user's filter
   * selections, properties to color by, etc
   */
  filterSettings: GeoEntityLayerFilterSettings,
};

type SerializedEntityLayerModel = {
  data: Zen.Serialized<GeoEntityLayerData> | void,
  id: string,
  filterSettings: Zen.Serialized<GeoEntityLayerFilterSettings>,
  styleSettings: Zen.Serialized<LayerStyleSettings>,
};

/**
 * The EntityLayerModel model represents frontend information we want to
 * maintain about any particular layer.
 */
class EntityLayerModel
  extends Zen.BaseModel<EntityLayerModel, RequiredValues, DefaultValues>
  implements
    GeoLayerModel<EntityLayerModel, 'ENTITY'>,
    Serializable<SerializedEntityLayerModel> {
  +tag: 'ENTITY' = 'ENTITY';

  static defaultValues: DefaultValues = {
    data: undefined,
    filterSettings: GeoEntityLayerFilterSettings.create({}),
  };

  static deserialize(
    values: SerializedEntityLayerModel,
  ): Zen.Model<EntityLayerModel> {
    const { data, id, filterSettings, styleSettings } = values;
    return EntityLayerModel.create({
      id,
      data: data ? GeoEntityLayerData.deserialize(data) : undefined,
      filterSettings: GeoEntityLayerFilterSettings.deserialize(filterSettings),
      styleSettings: LayerStyleSettings.deserialize(styleSettings),
    });
  }

  getId(): string {
    return this._.id();
  }

  getLayerStyleSettings(): LayerStyleSettings {
    return this._.styleSettings();
  }

  isLayerVisible(): boolean {
    return this._.styleSettings().showLayer();
  }

  updateLayerStyleSettings(
    newStyleSettings: LayerStyleSettings,
  ): Zen.Model<EntityLayerModel> {
    return this._.styleSettings(newStyleSettings);
  }

  serialize(): SerializedEntityLayerModel {
    const data = this._.data();
    return {
      data: data ? data.serialize() : undefined,
      id: this._.id(),
      filterSettings: this._.filterSettings().serialize(),
      styleSettings: this._.styleSettings().serialize(),
    };
  }
}

export default ((EntityLayerModel: $Cast): Class<Zen.Model<EntityLayerModel>>);
