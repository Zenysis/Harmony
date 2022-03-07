// @flow
import invariant from 'invariant';

import * as Zen from 'lib/Zen';
import EntityLayerProperties from 'models/visualizations/MapViz/EntityLayerProperties';
import PlaybackSettings from 'models/visualizations/MapViz/PlaybackSettings';
import { QUERY_RESULT_LAYER_ID } from 'components/visualizations/MapViz/defaults';
import type GroupBySettings from 'models/core/QueryResultSpec/GroupBySettings';
import type SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';
import type { IViewSpecificSettings } from 'models/visualizations/common/interfaces';
import type { MapLabelProperties } from 'models/visualizations/MapViz/types';
import type { Serializable } from 'lib/Zen';
import type { VisualizationType } from 'models/AdvancedQueryApp/VisualizationType/types';

type RequiredValues = {
  currentDisplay: string, // 'dots' | 'tiles' | 'scaled-dots' | 'heatmap'
  selectedField: string,
  selectedGeoTiles: string,
  zoomLevel: number,
};

type DefaultValues = {
  adminBoundariesColor: string,
  adminBoundariesWidth: string, // 'none' | 'thin' | 'normal' | 'thick'
  baseLayer: string,
  entityLayerProperties: EntityLayerProperties,
  fillOpacity: number,
  mapCenter: [number, number],
  overlayLayers: $ReadOnlyArray<string>,
  // Settings specifically for Animated Map's timeline feature
  playbackSettings: PlaybackSettings,
  selectedLabelsToDisplay: MapLabelProperties,
  shapeOutlineWidth: string, // 'none' | 'thin' | 'normal' | 'thick'
  showAdminBoundaries: boolean,
  showLabels: boolean,
  tooltipBackgroundColor: {| r: number, g: number, b: number, a?: number |},
  tooltipBold: boolean,
  tooltipFontColor: string,
  tooltipFontFamily: string,
  tooltipFontSize: string,
  /** List of ids of layers visible on the map. Such as the query result layer,
   * entity layer, etc... */
  visibleMarkerLayers: $ReadOnlyArray<string>,
};

type SerializedMapSettings = {|
  currentDisplay: string, // 'dots' | 'tiles' | 'scaled-dots' | 'heatmap'
  adminBoundariesColor: string,
  adminBoundariesWidth: string,
  baseLayer: string,
  entityLayerProperties: Zen.Serialized<EntityLayerProperties>,
  fillOpacity: number,
  mapCenter: [number, number],
  overlayLayers: $ReadOnlyArray<string>,
  playbackSettings: Zen.Serialized<PlaybackSettings>,
  selectedField: string,
  selectedGeoTiles: string,
  selectedLabelsToDisplay: MapLabelProperties,
  shapeOutlineWidth: string,
  showAdminBoundaries: boolean,
  showLabels: boolean,
  tooltipBackgroundColor: {| r: number, g: number, b: number, a?: number |},
  tooltipBold: boolean,
  tooltipFontColor: string,
  tooltipFontFamily: string,
  tooltipFontSize: string,
  visibleMarkerLayers: $ReadOnlyArray<string>,
  zoomLevel: number,
|};

// Where the map is centered at first.
const DEFAULT_VIEW_LAT_LNG = window.__JSON_FROM_BACKEND.mapDefaultLatLng || [
  0,
  0,
];

// How the map is zoomed at first.
const DEFAULT_VIEW_ZOOM_LEVEL = window.__JSON_FROM_BACKEND.mapDefaultZoom || 5;
const DEFAULT_VIEW_ZOOM_LEVEL_SMALL_MODE = DEFAULT_VIEW_ZOOM_LEVEL - 2;
const OPTION_TILES = 'tiles';
const OPTION_DOTS = 'dots';

class MapSettings
  extends Zen.BaseModel<MapSettings, RequiredValues, DefaultValues>
  implements
    Serializable<SerializedMapSettings>,
    IViewSpecificSettings<MapSettings> {
  static defaultValues: DefaultValues = {
    adminBoundariesColor: '#313234',
    adminBoundariesWidth: 'normal',
    baseLayer: 'Streets',
    entityLayerProperties: EntityLayerProperties.create({}),
    fillOpacity: 0.8,
    mapCenter: DEFAULT_VIEW_LAT_LNG,
    overlayLayers: ['Administrative'],
    playbackSettings: PlaybackSettings.create({}),
    selectedLabelsToDisplay: {},
    shapeOutlineWidth: 'normal',
    showAdminBoundaries: false,
    showLabels: false,
    tooltipBackgroundColor: { r: 255, g: 255, b: 255, a: 0.75 },
    tooltipFontColor: 'black',
    tooltipFontFamily: 'Arial',
    tooltipFontSize: '12px',
    tooltipBold: false,
    // TODO(nina): We shouldn't import this value into this file, but we do
    // want to make sure this layer is always visible
    visibleMarkerLayers: [QUERY_RESULT_LAYER_ID],
  };

  static deserialize(values: SerializedMapSettings): Zen.Model<MapSettings> {
    const {
      entityLayerProperties,
      playbackSettings,
      ...passThroughValues
    } = values;
    return MapSettings.create({
      ...passThroughValues,
      entityLayerProperties: EntityLayerProperties.deserialize(
        entityLayerProperties,
      ),
      playbackSettings: PlaybackSettings.deserialize(playbackSettings),
    });
  }

  static fromConfig(config: {
    fields: $ReadOnlyArray<string>,
    groupingDimension: string,
    smallMode: boolean,
    isHeatmap: boolean,
  }): Zen.Model<MapSettings> {
    const { fields, groupingDimension, smallMode, isHeatmap } = config;
    invariant(fields.length > 0, 'MapSettings requires at least 1 field');

    let currentDisplay = smallMode ? OPTION_TILES : OPTION_DOTS;
    if (isHeatmap) {
      currentDisplay = 'heatmap';
    }

    return MapSettings.create({
      currentDisplay,
      selectedField: fields[0],
      selectedGeoTiles: groupingDimension,
      zoomLevel: smallMode
        ? DEFAULT_VIEW_ZOOM_LEVEL_SMALL_MODE
        : DEFAULT_VIEW_ZOOM_LEVEL,
    });
  }

  serialize(): SerializedMapSettings {
    return {
      currentDisplay: this._.currentDisplay(),
      adminBoundariesColor: this._.adminBoundariesColor(),
      adminBoundariesWidth: this._.adminBoundariesWidth(),
      baseLayer: this._.baseLayer(),
      entityLayerProperties: this._.entityLayerProperties().serialize(),
      fillOpacity: this._.fillOpacity(),
      mapCenter: this._.mapCenter(),
      overlayLayers: this._.overlayLayers(),
      playbackSettings: this._.playbackSettings().serialize(),
      selectedField: this._.selectedField(),
      selectedGeoTiles: this._.selectedGeoTiles(),
      selectedLabelsToDisplay: this._.selectedLabelsToDisplay(),
      shapeOutlineWidth: this._.shapeOutlineWidth(),
      showAdminBoundaries: this._.showAdminBoundaries(),
      showLabels: this._.showLabels(),
      tooltipBackgroundColor: this._.tooltipBackgroundColor(),
      tooltipBold: this._.tooltipBold(),
      tooltipFontColor: this._.tooltipFontColor(),
      tooltipFontFamily: this._.tooltipFontFamily(),
      tooltipFontSize: this._.tooltipFontSize(),
      visibleMarkerLayers: this._.visibleMarkerLayers(),
      zoomLevel: this._.zoomLevel(),
    };
  }

  updateFromNewGroupBySettings(
    // eslint-disable-next-line no-unused-vars
    newGroupBySettings: GroupBySettings,
  ): Zen.Model<MapSettings> {
    return this._;
  }

  updateFromNewSeriesSettings(
    newSeriesSettings: SeriesSettings,
  ): Zen.Model<MapSettings> {
    const seriesOrder = newSeriesSettings.seriesOrder();
    const seriesObjects = newSeriesSettings.seriesObjects();
    const defaultFieldId = seriesOrder[0];
    let newSettings = this._;

    const selectedField = this._.selectedField();
    const selectedLabelsToDisplay = this._.selectedLabelsToDisplay();

    // If the selected field no longer exists
    if (!seriesOrder.includes(selectedField)) {
      newSettings = newSettings.selectedField(defaultFieldId);
    }

    // Take the new list of fields and copy over any pre-existing map label
    // selections. We also need to keep the labels in sync with series labels.
    const newLabelsToDisplay = {};
    seriesOrder.forEach(id => {
      if (selectedLabelsToDisplay[id] !== undefined) {
        newLabelsToDisplay[id] = {
          color: selectedLabelsToDisplay[id].color,
          label: seriesObjects[id].label(),
        };
      }
    });
    newSettings = newSettings.selectedLabelsToDisplay(newLabelsToDisplay);

    return newSettings;
  }

  getTitleField(): string {
    return this._.selectedField();
  }

  changeToVisualizationType(
    vizType: VisualizationType,
  ): Zen.Model<MapSettings> {
    switch (vizType) {
      case 'MAP':
        return this._.currentDisplay('dots');
      case 'MAP_ANIMATED':
        return this._.currentDisplay('scaled-dots');
      case 'MAP_HEATMAP':
      case 'MAP_HEATMAP_ANIMATED':
        return this._.currentDisplay('heatmap');
      default:
        throw new Error('[MapSettings] Invalid Map visualization type');
    }
  }
}

export default ((MapSettings: $Cast): Class<Zen.Model<MapSettings>>);
