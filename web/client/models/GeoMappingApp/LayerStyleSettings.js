// @flow
import * as Zen from 'lib/Zen';
import MapLabelSettings from 'models/GeoMappingApp/MapLabelSettings';
import { SERIES_COLORS } from 'components/QueryResult/graphUtil';
import type {
  LegendPositionType,
  ShapeLayerOutlineWidthType,
} from 'models/GeoMappingApp/types';
import type { Serializable } from 'lib/Zen';

type RequiredValues = {
  /** Name of layer */
  name: string,
};

type DefaultValues = {
  /**
   * In order to preserve the order of the selected layers, we track the layer
   * that should always display above this layer, if any.
   *
   * TODO(nina): Perform a dashboard upgrade and make this property a required
   * property. Every layer needs to point to an ID in order to preserve the
   * ordering of all layers (which we enforce very strictly), so we shouldn't
   * leave this to a default value. That can cause issues where multiple layers
   * have this value set to 'undefined'. For mapbox, this means that the layer
   * is just placed underneath all other layers. But for us, we use this
   * value to determine which layer should actually be at the very top.
   */
  beforeLayerId: string | void,

  /** The default color for markers that are not assigned any other color */
  defaultColor: string,

  /** Label settings for this layer */
  labelSettings: MapLabelSettings,

  /** Legend position setting for this layer */
  // NOTE(sophie): this setting is not enabled yet because we still need to
  // properly handle the interaction between the per-layer legend placement and
  // the global legend placement
  legendPosition: LegendPositionType,

  // TODO(nina): We should rename this, since not all
  // representations can be described as markers
  /** The visual representation of data for this layer */
  markerType: 'dots' | 'symbols' | 'scaled-dots' | 'tiles' | 'heatmap',

  /** The thickness of the layer when it is drawn using tiles */
  shapeOutlineWidth: ShapeLayerOutlineWidthType,

  /** Hide/show this layer on map */
  showLayer: boolean,

  /** Hide/show legend for this layer */
  showLegend: boolean,

  /** When a user clicks a marker, show/don't show a popup */
  showPopups: boolean,
};

type SerializedLayerStyleSettings = {
  beforeLayerId: string | void,
  defaultColor: string,
  labelSettings: Zen.Serialized<MapLabelSettings>,
  legendPosition: LegendPositionType,
  markerType: 'dots' | 'symbols' | 'scaled-dots' | 'tiles' | 'heatmap',
  name: string,
  shapeOutlineWidth: ShapeLayerOutlineWidthType,
  showLayer: boolean,
  showLegend: boolean,
  showPopups: boolean,
};

/**
 * The LayerStyleSettings ZenModel is responsible for holding settings
 * information about a layer. By 'settings', we are referring to properties
 * that a user can change and should be persisted.
 */
class LayerStyleSettings
  extends Zen.BaseModel<LayerStyleSettings, RequiredValues, DefaultValues>
  implements Serializable<SerializedLayerStyleSettings> {
  static defaultValues: DefaultValues = {
    beforeLayerId: undefined,
    defaultColor: SERIES_COLORS[0],
    labelSettings: MapLabelSettings.create({}),
    legendPosition: 'TOP_LEFT',
    markerType: 'dots',
    shapeOutlineWidth: 'normal',
    showLayer: true,
    showLegend: true,
    showPopups: true,
  };

  static deserialize(
    values: SerializedLayerStyleSettings,
  ): Zen.Model<LayerStyleSettings> {
    const { labelSettings, ...passThroughValues } = values;
    return LayerStyleSettings.create({
      ...passThroughValues,
      labelSettings: MapLabelSettings.deserialize(labelSettings),
    });
  }

  serialize(): SerializedLayerStyleSettings {
    return {
      beforeLayerId: this._.beforeLayerId(),
      defaultColor: this._.defaultColor(),
      labelSettings: this._.labelSettings().serialize(),
      legendPosition: this._.legendPosition(),
      markerType: this._.markerType(),
      name: this._.name(),
      shapeOutlineWidth: this._.shapeOutlineWidth(),
      showLayer: this._.showLayer(),
      showLegend: this._.showLegend(),
      showPopups: this._.showPopups(),
    };
  }
}

export default ((LayerStyleSettings: $Cast): Class<
  Zen.Model<LayerStyleSettings>,
>);
