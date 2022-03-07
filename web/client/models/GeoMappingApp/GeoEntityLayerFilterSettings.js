// @flow
import * as Zen from 'lib/Zen';
import type { FilterValueSelections } from 'models/GeoMappingApp/types';
import type { Serializable } from 'lib/Zen';

type DefaultValues = {
  /** Selections that the user has made, by filter category */
  filterSelections: FilterValueSelections,

  /**
   * A mapping from all the values in a given filter category to their
   * corresponding colors, which the markers of this layer will then use to
   * color themselves on the map
   */
  markerColorMap: Zen.Map<string>,

  /** Property to color markers by, undefined if layer not filterable */
  // TODO(nina): We should rename this, since 'selectedEntityType' isn't
  // really a useful name.
  selectedEntityType: string | void,
};

// NOTE(nina): markerColorMap is initially defined as a ZenMap, but ZenMaps
// aren't supported by JSON (only object-as-maps)
type SerializedGeoEntityLayerFilterSettings = {
  filterSelections: FilterValueSelections,
  markerColorMap: { [categoryValue: string]: string },
  selectedEntityType: string | void,
};

/**
 * GeoEntityLayerFilterSettings represent information about
 * a given layer's filter and color settings, to then filter and color
 * the markers that are displayed on the map for this layer
 */
class GeoEntityLayerFilterSettings
  extends Zen.BaseModel<GeoEntityLayerFilterSettings, {}, DefaultValues>
  implements Serializable<SerializedGeoEntityLayerFilterSettings> {
  static defaultValues: DefaultValues = {
    filterSelections: {},
    markerColorMap: Zen.Map.create(),
    selectedEntityType: undefined,
  };

  static deserialize(
    values: SerializedGeoEntityLayerFilterSettings,
  ): Zen.Model<GeoEntityLayerFilterSettings> {
    const { markerColorMap, ...passThroughValues } = values;
    return GeoEntityLayerFilterSettings.create({
      ...passThroughValues,
      markerColorMap: Zen.Map.create(markerColorMap),
    });
  }

  serialize(): SerializedGeoEntityLayerFilterSettings {
    const serializedMarkerColorMap = {};
    const markerColorMap = this._.markerColorMap();
    markerColorMap.keys().forEach(categoryValue => {
      serializedMarkerColorMap[categoryValue] = markerColorMap.forceGet(
        categoryValue,
      );
    });

    return {
      filterSelections: this._.filterSelections(),
      markerColorMap: serializedMarkerColorMap,
      selectedEntityType: this._.selectedEntityType(),
    };
  }
}

export default ((GeoEntityLayerFilterSettings: $Cast): Class<
  Zen.Model<GeoEntityLayerFilterSettings>,
>);
