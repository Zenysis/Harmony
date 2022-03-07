// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import EntityLayerModel from 'models/GeoMappingApp/EntityLayerModel';
import GISMapSettings from 'models/GeoMappingApp/GISMapSettings';
import IndicatorLayerModel from 'models/GeoMappingApp/IndicatorLayerModel';
import type {
  GeoLayers,
  GeoLayerSelectionType,
} from 'components/GeoMappingApp/types';
import type { Serializable } from 'lib/Zen';
import type { SerializedIndicatorLayerModelForDashboard } from 'models/GeoMappingApp/IndicatorLayerModel';

type RequiredValues = {};

type DefaultValues = {
  /**
   * Stores a mapping of layer IDs to entity layers, WITHOUT data.
   */
  entityLayers: Zen.Map<EntityLayerModel>,

  /**
   * A placeholder property to represent new properties that we want to
   * persist to the dashboard without unecessary upgrades yet
   */
  generalSettings: GISMapSettings,

  /** Stores a mapping of layer IDs to indicator layers */
  indicatorLayers: Zen.Map<IndicatorLayerModel>,

  /** List of selected layer IDs (and type of layer) for this item. */
  selectedLayerIds: $ReadOnlyArray<GeoLayerSelectionType>,
};

type DerivedValues = {
  /** NOTE(nina): A union of all layers, regardless of type. We don't
   * want to serialize this, because it is only intended to be used
   * when rendering the container for this item in a dashboard */
  allLayers: GeoLayers,
};

// NOTE(nina): ZenMaps aren't supported by JSON (only object-as-maps)
// Model representation that we receive from the backend
type SerializedDashboardGISItem = {
  entityLayers: {
    [layerId: string]: Zen.Serialized<EntityLayerModel>,
  },
  indicatorLayers: {
    [layerId: string]: SerializedIndicatorLayerModelForDashboard,
  },
  generalSettings: Zen.Serialized<GISMapSettings>,
  selectedLayerIds: $ReadOnlyArray<GeoLayerSelectionType>,
  type: 'GIS_ITEM',
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
    entityLayers: Zen.Map.create(),
    generalSettings: GISMapSettings.create({}),
    indicatorLayers: Zen.Map.create(),
    selectedLayerIds: [],
  };

  static derivedConfig: Zen.DerivedConfig<DashboardGISItem, DerivedValues> = {
    allLayers: [
      Zen.hasChanged<DashboardGISItem>('entityLayers', 'indicatorLayers'),
      gisItem =>
        gisItem
          .indicatorLayers()
          .merge(gisItem.entityLayers())
          .objectView(),
    ],
  };

  static deserializeAsync(
    values: SerializedDashboardGISItem,
  ): Promise<Zen.Model<DashboardGISItem>> {
    const {
      entityLayers,
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
      const deserializedEntityLayers = Zen.deserializeMap(
        EntityLayerModel,
        entityLayers,
      );

      return DashboardGISItem.create({
        selectedLayerIds,
        entityLayers: Zen.Map.create(deserializedEntityLayers),
        generalSettings: GISMapSettings.deserialize(generalSettings),
        indicatorLayers: Zen.Map.fromArray(deserializedIndicatorLayers, 'id'),
      });
    });
  }

  serialize(): SerializedDashboardGISItem {
    const {
      entityLayers,
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
      entityLayers: Zen.serializeMap(entityLayers),
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
