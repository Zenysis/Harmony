// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import type { Serializable } from 'lib/Zen';

type RequiredValues = {};

type DefaultValues = {
  /** Stores a mapping of layer IDs to indicator layers */
  indicatorLayers: Zen.Map<IndicatorLayerModel>,

  /** List of selected layer IDs (and type of layer) for this item. */
  selectedLayerIds: $ReadOnlyArray<GeoLayerSelectionType>,
};

type DerivedValues = {
  /** NOTE: A union of all layers, regardless of type. We don't
   * want to serialize this, because it is only intended to be used
   * when rendering the container for this item in a dashboard */
  allLayers: GeoLayers,
};

/**
 * The DashboardGISItem holds all the information needed to render a GIS tile
 * from settings exported from the GIS App.
 */
class DashboardGISItem
  extends Zen.BaseModel<
    DashboardGISItem,
    RequiredValues,
    DefaultValues,
    DerivedValues,
  >
  implements Serializable<SerializedDashboardGISItem> {
  +tag: 'GIS_ITEM' = 'GIS_ITEM';

  static defaultValues: DefaultValues = {
    indicatorLayers: Zen.Map.create(),
    selectedLayerIds: [],
  };

  static derivedConfig: Zen.DerivedConfig<DashboardGISItem, DerivedValues> = {
    allLayers: [
      Zen.hasChanged<DashboardGISItem>('indicatorLayers'),
      gisItem =>
        gisItem
          .indicatorLayers()
          .objectView(),
    ],
  };

  static deserializeAsync(
    values: SerializedDashboardGISItem,
  ): Promise<Zen.Model<DashboardGISItem>> {
    const {
      generalSettings,
      indicatorLayers,
      selectedLayerIds,
    } = values;
    return Promise.all(
      Object.keys(indicatorLayers).map(layerId =>
        IndicatorLayerModel.deserializeAsyncFromDashboard(
          indicatorLayers[layerId],
        ),
      ),
    ).then(deserializedIndicatorLayers => {

      return DashboardGISItem.create({
        selectedLayerIds,
        indicatorLayers: Zen.Map.fromArray(deserializedIndicatorLayers, 'id'),
      });
    });
  }

  serialize(): SerializedDashboardGISItem {
    const {
      generalSettings,
      indicatorLayers,
      selectedLayerIds,
    } = this.modelValues();
    const serializedIndicatorLayers = {};
    indicatorLayers.keys().forEach(layerId => {
      serializedIndicatorLayers[layerId] = indicatorLayers
        .forceGet(layerId)
        .serializeForDashboard();
    });

    return {
      generalSettings: generalSettings.serialize(),
      indicatorLayers: serializedIndicatorLayers,
      // We do not want to store indicatorLayerData, if any
      selectedLayerIds: selectedLayerIds.map(({ layerId, layerType }) => ({
        layerId,
        layerType,
      })),
      type: this.tag,
    };
  }
}

export default ((DashboardGISItem: $Cast): Class<Zen.Model<DashboardGISItem>>);
