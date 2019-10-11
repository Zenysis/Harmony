import PropTypes from 'prop-types';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

import Dropdown from 'components/ui/Dropdown';
import GeoLocDisclaimer from 'components/visualizations/Map/GeoLocDisclaimer';
import InputText from 'components/ui/InputText';
import Legend from 'components/visualizations/Map/Legend';
import MapHoverWindow, {
  MAX_HOVER_WINDOW_WIDTH_PX,
  MOBILE_MAX_HOVER_WINDOW_WIDTH_PX,
  MAX_HOVER_WINDOW_HEIGHT_PX,
} from 'components/visualizations/Map/MapHoverWindow';
import MapQueryResultData from 'components/visualizations/Map/models/MapQueryResultData';
import MapTimeline from 'components/visualizations/AnimatedMap/MapTimeline';
import ProgressBar from 'components/ui/ProgressBar';
import PropDefs from 'util/PropDefs';
import Visualization from 'components/visualizations/common/Visualization';
import memoizeOne from 'decorators/memoizeOne';
import withScriptLoader from 'components/common/withScriptLoader';
import { BACKEND_GRANULARITIES } from 'components/QueryResult/timeSeriesUtil';
import { DEFAULT_BUBBLE_COLOR } from 'components/visualizations/Map/util';
import { PRIMARY_COLORS } from 'components/QueryResult/graphUtil';
import { VENDOR_SCRIPTS } from 'vendor/registry';
import { autobind } from 'decorators';
import { visualizationPropDefs } from 'components/visualizations/common/commonPropDefs';

// Default bubble size without being scaled.
const DEFAULT_MARKER_SIZE_PX = 7;

// Location of GeoJson tiles to load, if they exist for this config
const GEOJSON_TILE_URL = window.__JSON_FROM_BACKEND.mapOverlayGeoJson;
const GEO_FIELD_ORDERING = (
  window.__JSON_FROM_BACKEND.geoFieldOrdering || []
).slice();

// Location of static geo data, if they exist
const STATIC_GEO_URL = window.__JSON_FROM_BACKEND.geoDataOverlay;

// A dictionary containing the dimensions for the static geo data since
// geojson is a flat dictionary.
const STATIC_GEO_DIMENSIONS = window.__JSON_FROM_BACKEND.geoDataDimensions;
const STATIC_GEO_DATA_LABELS = window.__JSON_FROM_BACKEND.geoDataLabels;
const ENTITY_LEGEND_COLORS = [];
Object.keys(PRIMARY_COLORS).forEach(colorKey => {
  if (colorKey !== 'ZA_BLUE') {
    ENTITY_LEGEND_COLORS.push(PRIMARY_COLORS[colorKey]);
  }
});

// HACK(stephen): Huge hack for mozambique. Need a way to include a metadata
// dimension as a mappable dimension.
// $CycloneIdaiHack
if (window.__JSON_FROM_BACKEND.deploymentName === 'mz') {
  GEO_FIELD_ORDERING.push('BairroName');
}

// Admin boundaries based on user selection of granularity.
const ADMIN_BOUNDS_URLS = window.__JSON_FROM_BACKEND.mapboxAdminURLS;

// Access token for mapbox.
const MAPBOX_ACCESS_TOKEN = window.__JSON_FROM_BACKEND.mapboxAccessToken;

// Values for map display options.
const OPTION_SCALED_DOTS = 'scaled-dots';
const OPTION_TILES = 'tiles';

// TODO(stephen): Translate this.
const ADMIN_LAYER_CONTROL_TITLE = 'Administrative';
const BLANK_LAYER_ID = 'Blank';

// Lookup from geokey to shape object to be populated once
// on geojson load
const geoShapeCache = {};

// Cache for static geo data.
const staticGeoShapeCache = {};

// HACK(stephen): Try to issue only one geojson tile request per page
let OUTSTANDING_GEOJSON_TILE_REQUEST = null;
let OUTSTANDING_STATIC_GEO_REQUEST = null;
let GEO_JSON_FULL_DATA;
let STATIC_GEOJSON_FULL_DATA;

const VISIBLE_LABEL_OPACITY = 1;
const INVISIBLE_LABEL_OPACITY = 0;

function hideLabel(label) {
  // $CycloneIdaiHack
  // eslint-disable-next-line no-param-reassign
  label.labelObject.style.opacity = INVISIBLE_LABEL_OPACITY;
}

function showLabel(label) {
  // $CycloneIdaiHack
  // eslint-disable-next-line no-param-reassign
  label.labelObject.style.opacity = VISIBLE_LABEL_OPACITY;
}

// Build a geo key that is only based on the geographical dimensions.
function getGeoShapeKey(dimensions) {
  return GEO_FIELD_ORDERING.map(dimension => dimensions[dimension] || '')
    .join('__')
    .toLowerCase();
}

function getFeatureMetadata(dimObj) {
  return {
    dimObj,
    textSearchKey: getGeoShapeKey(dimObj.dimensions),
  };
}

const propDefs = PropDefs.create('baseMap')
  .addGroup(
    visualizationPropDefs
      .propTypes({
        queryResult: MapQueryResultData.type(),
      })
      .defaultProps({
        queryResult: MapQueryResultData.create(),
      }),
  )
  .propTypes({
    // eslint-disable-next-line max-len
    onControlsSettingsChange: PropTypes.func.isRequired, // f(controlType, value)

    additionalFooterContent: PropTypes.node,
    dateGranularity: PropTypes.oneOf(Object.values(BACKEND_GRANULARITIES)),
    enableMapLayering: PropTypes.bool,
    getMarkerValue: PropTypes.func, // f(metrics, fieldId) => number
    getMarkerSize: PropTypes.func, // f(metrics) => number
  })
  .defaultProps({
    additionalFooterContent: undefined,
    dateGranularity: undefined,
    enableMapLayering: true,
    getMarkerValue: (metrics, fieldId) => metrics[fieldId],
    getMarkerSize: undefined,
  });

// NOTE(stephen): These functions should all be moved into a utility file so
// that the component is easier to read.

// TODO(vinh, stephen): Centralize the mapbox tile layer references into a
// utility that all map visualizations can reference.
// NOTE(stephen): Even though this function doesn't depend on "this", we need
// it to live inside the component class since the Leaflet object might not be
// defined.
/* eslint-disable max-len */

function getBaseLayers() {
  return {
    Satellite: L.tileLayer(
      `https://{s}.tiles.mapbox.com/v4/mapbox.streets-satellite/{z}/{x}/{y}.png?access_token=${MAPBOX_ACCESS_TOKEN}`,
    ),
    Streets: L.tileLayer(
      `https://{s}.tiles.mapbox.com/v4/mapbox.streets/{z}/{x}/{y}.png?access_token=${MAPBOX_ACCESS_TOKEN}`,
    ),
    Light: L.tileLayer(
      `https://{s}.tiles.mapbox.com/styles/v1/ianw/cixmhlc18001z2ro71bu7qrqv/tiles/256/{z}/{x}/{y}?access_token=${MAPBOX_ACCESS_TOKEN}`,
    ),
    [BLANK_LAYER_ID]: L.tileLayer('/images/map/white.jpg'),
  };
}

/* eslint-enable max-len */

function getAdminLayers() {
  const output = {};
  Object.keys(ADMIN_BOUNDS_URLS).forEach(granularity => {
    const layer = L.tileLayer(
      `${ADMIN_BOUNDS_URLS[granularity]}?access_token=${MAPBOX_ACCESS_TOKEN}`,
    );
    // Store granularity on the layer object so we can easily detect which
    // layer is being shown. Instead of displaying all admin layer options at
    // the same time, we show a single 'Administrative' checkbox and swap in
    // which layer it refers to based on the settings modal selection.
    layer.id = granularity;
    output[granularity] = layer;
  });
  return output;
}
// Process the raw GeoJSON data and store it in the global geoShapeCache.
function processGeoJsonResult(geoJsonData) {
  geoJsonData.features.forEach(geoShape => {
    const shapeKey = getGeoShapeKey(geoShape.properties);
    if (geoShapeCache[shapeKey]) {
      // eslint-disable-next-line no-console
      console.error('Overwriting existing shape for key:', shapeKey);
    }
    geoShapeCache[shapeKey] = geoShape;
  });

  // Make the cache immutable
  Object.freeze(geoShapeCache);
}

function maybeGetStaticData() {
  if (Object.keys(staticGeoShapeCache).length !== 0) {
    return Promise.resolve(STATIC_GEOJSON_FULL_DATA);
  }

  if (OUTSTANDING_STATIC_GEO_REQUEST) {
    return OUTSTANDING_STATIC_GEO_REQUEST;
  }

  /* eslint-disable no-console */
  OUTSTANDING_STATIC_GEO_REQUEST = $.getJSON(STATIC_GEO_URL)
    .done(data => {
      if (!data.features || data.features.length === 0) {
        console.error('No data returned');
        return {};
      }
      STATIC_GEOJSON_FULL_DATA = data;
      return data;
    })
    .fail((jqxhr, textStatus, error) => {
      console.error(`{Error: ${textStatus}}`);
      console.error('Cannot process GeoJson data');
      console.error(`{Error: ${error}}`);
      return {};
    });
  /* eslint-enable no-console */
  return OUTSTANDING_STATIC_GEO_REQUEST;
}

function getGeoJsonTiles() {
  if (Object.keys(geoShapeCache).length !== 0) {
    return Promise.resolve(GEO_JSON_FULL_DATA);
  }

  if (OUTSTANDING_GEOJSON_TILE_REQUEST) {
    return OUTSTANDING_GEOJSON_TILE_REQUEST;
  }

  /* eslint-disable no-console */
  OUTSTANDING_GEOJSON_TILE_REQUEST = $.getJSON(GEOJSON_TILE_URL)
    .done(data => {
      if (!data.features || data.features.length === 0) {
        console.error('No data returned');
        return {};
      }
      processGeoJsonResult(data);
      GEO_JSON_FULL_DATA = data;
      return data;
    })
    .fail((jqxhr, textStatus, error) => {
      console.error('Cannot process GeoJson data');
      console.error(`{Error: ${error}}`);
      return {};
    });
  /* eslint-enable no-console */
  return OUTSTANDING_GEOJSON_TILE_REQUEST;
}

function getGeoShape(dimensions) {
  return geoShapeCache[getGeoShapeKey(dimensions)];
}

function getChangedProps(props, nextProps) {
  return Object.keys(props).filter(k => props[k] !== nextProps[k]);
}

function isPoint(feature) {
  return feature.geometry.type === 'Point';
}

function shouldDisplayShapeTiles(controls) {
  return GEOJSON_TILE_URL && controls.currentDisplay === OPTION_TILES;
}

function updateLayerControl(newOverlayLayer, layerControl) {
  // Leaflet does not provide an easy way to *change* the layer for an overlay
  // option. You can only add and remove. Access the internal _layers array
  // so we can properly remove the old admin layer before setting the new one.
  layerControl._layers.forEach(layerControlOption => {
    if (
      layerControlOption.overlay &&
      layerControlOption.name === ADMIN_LAYER_CONTROL_TITLE
    ) {
      layerControl.removeLayer(layerControlOption.layer);
    }
  });

  layerControl.addOverlay(newOverlayLayer, ADMIN_LAYER_CONTROL_TITLE);
}

function isLocationFilteredOut({ dimensions }) {
  // HACK(toshi): Filtering for 'All': we should probably display the lat lng
  // as the centroid of the whole nation
  // HACK(stephen): Always exclude the Nation as Region result from Map.
  if (dimensions.RegionName === 'Nation') {
    return true;
  }

  return false;
}

function isLocationMappable(dimObj, displayingShapeTiles = false) {
  if (displayingShapeTiles) {
    return !!getGeoShape(dimObj.dimensions);
  }
  return dimObj.lat && dimObj.lng;
}

// $CycloneIdaiHack
const WATER_SOURCE_COLORS = {
  Barragem: '#fee0b6',
  'Centro de Tratamento': '#998ec3',
  'Coletor de Água de Chuva': '#b35806',
  Fosso: '#000',
  Foça: '#542788',
  Furo: '#fee090',
  Poço: '#f1a340',
  Tanque: '#c51b7d',
};

function tooltipControlsChanged(prevControls, curControls) {
  if (
    prevControls.showLabels !== curControls.showLabels ||
    prevControls.tooltipFontColor !== curControls.tooltipFontColor ||
    prevControls.tooltipFontSize !== curControls.tooltipFontSize ||
    prevControls.tooltipFontFamily !== curControls.tooltipFontFamily ||
    prevControls.tooltipBackgroundColor !==
      curControls.tooltipBackgroundColor ||
    prevControls.tooltipBold !== curControls.tooltipBold ||
    prevControls.selectedField !== curControls.selectedField
  ) {
    return true;
  }
  return false;
}

// $CycloneIdaiHack
function buildWaterSourceLayers(geoJsonData) {
  const waterSources = {};
  geoJsonData.features.forEach(geoShape => {
    const { source } = geoShape.properties;
    if (source === undefined) {
      return;
    }
    if (waterSources[source] === undefined) {
      waterSources[source] = [];
    }
    waterSources[source].push(geoShape);
  });

  const waterLayers = {};
  Object.keys(waterSources).forEach(source => {
    waterLayers[source] = L.geoJson(waterSources[source], {
      onEachFeature: ({ properties }, layer) => {
        layer.bindPopup(() =>
          ReactDOMServer.renderToStaticMarkup(
            <React.Fragment>
              <b>{properties.source}</b>
              <div>{properties.name}</div>
            </React.Fragment>,
          ),
        );
      },
      style: {
        color: '#fff',
        fillColor: WATER_SOURCE_COLORS[source],
        fillOpacity: 1,
        radius: 6,
        weight: 1,
        className: 'geo-json-layer',
      },
      pointToLayer: (feature, latlng) => L.circleMarker(latlng),
    });
  });
  return waterLayers;
}

function buildDropDowns(entities) {
  const result = {};
  Object.keys(entities).forEach(entityKey => {
    entities[entityKey].forEach(entityVal => {
      const key = entityKey.concat('__', entityVal).replace(/ {2}/g, '');
      result[key] = {
        value: entityVal,
        entityType: entityKey,
      };
    });
  });
  return result;
}

function buildEntityDimensions(entities, entityDim) {
  const entityDimensions = entityDim;
  // TODO(nina): the value for each entityDimensions entry will later be
  // replaced with a list of selected filters, but for right now assuming that
  // you can only choose one filter per category
  Object.keys(entities).forEach(entityKey => {
    const entityValues = entities[entityKey];
    // Just a list of values
    if (Array.isArray(entityValues)) {
      entityDimensions[entityKey] = '';
    }
    // A dictionary of child types and list of values
    else {
      entityDimensions[entityKey] = '';
      buildEntityDimensions(entityValues, entityDimensions);
    }
  });

  return entityDimensions;
}

export class BaseMap extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      baseLayer: undefined,
      dataLayer: undefined,
      dateIndex: 0,
      entityMarkers: undefined,
      overlayLayer: undefined,
      invalidLocations: [],
      selectedEntityFilter: t('query_result.map.sidebar.no_selections'),
      entityDimensions: buildEntityDimensions(STATIC_GEO_DIMENSIONS, {}),
      // other layers to show on the map, extracted from GEO_JSON_FULL_DATA
      otherLayers: undefined,
    };
    this._labelEngine = undefined;
    this._mapRef = undefined;
    this.baseLayers = getBaseLayers();
    this.overlayLayers = getAdminLayers();
    this.entityLayers = buildDropDowns(STATIC_GEO_DIMENSIONS);
    this.layerControl = undefined;
  }

  componentDidMount() {
    this.setupMap();
    this.updateDataLayer();
  }

  // componentDidUpdate will restyle all markers each time it is called. This is
  // the easiest way to handle the multiple different ways marker styling can
  // be changed (both by this component and by parent components through
  // undetectable changes to the values provided by props getMarkerValue and
  // getMarkerSize). We can prevent a lot of unnecessary redraws by detecting
  // when specific common state/props changes are made that will not effect
  // marker styling and sizing.
  shouldComponentUpdate(nextProps, nextState) {
    // Check for state changes first.

    if (this.state !== nextState) {
      const diffStateKeys = getChangedProps(this.state, nextState);

      // Detect if any state values that are used by react-controlled UI have
      // changed. Currently that is only invalidLocations and dateIndex.
      // Ignore layer changes since those are committed directly to Leaflet.
      if (
        diffStateKeys.includes('invalidLocations') ||
        diffStateKeys.includes('dateIndex')
      ) {
        return true;
      }

      if (
        nextProps.queryResult.data().length === 1 &&
        nextState.dateIndex > 0
      ) {
        return true;
      }

      if (this.state.selectedEntityFilter !== nextState.selectedEntityFilter) {
        return true;
      }
    }
    if (this.props === nextProps) {
      return false;
    }

    // If there are more changes than just controls, we need to update.
    const diffPropKeys = getChangedProps(this.props, nextProps);
    if (diffPropKeys.length === 0) {
      return false;
    }

    if (diffPropKeys.length > 1 || diffPropKeys[0] !== 'controls') {
      return true;
    }

    const diffControlKeys = getChangedProps(
      this.props.controls,
      nextProps.controls,
    );

    // Avoid rerendering if the only thing changing is map positioning.
    // Currently, this can only be changed by interacting with the map and
    // cannot be changed through the settings modal.
    const controlsRequiringUpdate = diffControlKeys.filter(
      controlKey => !(controlKey === 'mapCenter' || controlKey === 'zoomLevel'),
    );

    return controlsRequiringUpdate.length > 0;
  }

  componentDidUpdate(prevProps, prevState) {
    const prevControls = prevProps.controls;
    const curControls = this.props.controls;
    if (
      this.props.queryResult.data().length === 1 &&
      this.state.dateIndex > 0
    ) {
      // Change index back to 0 to account for removal of date grouping
      this.resetDateIndex();
    } else {
      if (
        this.state.dateIndex !== prevState.dateIndex ||
        prevProps.queryResult !== this.props.queryResult ||
        shouldDisplayShapeTiles(prevControls) !==
          shouldDisplayShapeTiles(curControls) ||
        tooltipControlsChanged(prevControls, curControls)
      ) {
        this.updateDataLayer();
      }

      if (prevControls.baseLayer !== curControls.baseLayer) {
        this.setBaseLayer();
      }

      if (prevControls.selectedGeoTiles !== curControls.selectedGeoTiles) {
        this.setOverlayLayer();
      }

      if (prevProps.dataFilters !== this.props.dataFilters) {
        this.updateInvalidLocations();
      }

      this.updateFeatures();
    }
  }

  componentWillUnmount() {
    this.teardownMap();
  }

  teardownMap() {
    if (!this._map) {
      // Doesn't exist yet.
      return;
    }
    this._map.off();
    this._map.remove();
  }

  updateInvalidLocations() {
    const displayingShapeTiles = shouldDisplayShapeTiles(this.props.controls);
    const { dateIndex } = this.state;

    if (this.props.queryResult.data().length === 0) {
      return;
    }

    // get all the locations that are not mappable but that are *not* being
    // filtered out
    const invalidLocations = this.props.queryResult
      .data()
      [dateIndex].datedData.filter(
        dimObj =>
          !isLocationMappable(dimObj, displayingShapeTiles) &&
          !isLocationFilteredOut(dimObj),
      );
    this.setState({ invalidLocations });
  }

  resetDateIndex() {
    this.setState({ dateIndex: 0 }, this.updateDataLayer);
  }

  updateDataLayer() {
    if (shouldDisplayShapeTiles(this.props.controls)) {
      this.addGeoJsonLayer();
    } else {
      this.addMarkerLayer();
    }
    if (STATIC_GEO_URL) {
      this.addEntityMarkerLayer();
    }
  }

  @autobind
  filterEntityMarkers(feature) {
    const { entityDimensions } = this.state;
    let result = true;
    if (Object.keys(entityDimensions).every(key => !entityDimensions[key])) {
      return false;
    }

    Object.keys(entityDimensions).forEach(key => {
      if (
        feature.properties[key] !== entityDimensions[key] &&
        entityDimensions[key] !== ''
      ) {
        result = false;
      }
    });
    return result;
  }

  addEntityMarkerLayer() {
    if (!this.props.enableMapLayering) {
      return null;
    }
    return maybeGetStaticData();
  }

  addMarkerLayer() {
    const markers = this.buildGeoMarkers();
    const dataLayer = L.geoJson(markers, {
      onEachFeature: this.onEachFeature,
      style: this.featureStyle,
      pointToLayer: (feature, latlng) => L.circleMarker(latlng),
    });

    this.setDataLayer('dataLayer', dataLayer);
  }

  addGeoJsonLayer() {
    getGeoJsonTiles().then(fullGeoJSONData => {
      // $CycloneIdaiHack
      // HACK(pablo): This is so hacky omg. But we only had a few
      // hours to add MZ water sources to a map for a report to the UN.
      // Clean this up ASAP and find a more generic way to compute extra
      // metadata layers.
      if (
        window.__JSON_FROM_BACKEND.deploymentName === 'mz' &&
        this.state.otherLayers === undefined
      ) {
        const waterLayers = buildWaterSourceLayers(fullGeoJSONData);
        this.setState({ otherLayers: waterLayers }, () => {
          // Sort the water layers alphabetically to make the layer control
          // easier to use.
          Object.keys(waterLayers)
            .sort()
            .forEach(source => {
              this.layerControl.addOverlay(waterLayers[source], source);
            });
        });
      }

      // TODO(moriah): GeoMap does not yet support the addition of geoshapes
      const features = [];
      const { dateIndex } = this.state;
      this.props.queryResult.data()[dateIndex].datedData.forEach(dimObj => {
        const feature = getGeoShape(dimObj.dimensions);
        if (feature === undefined) {
          return;
        }

        const newFeature = { ...feature, ...getFeatureMetadata(dimObj) };
        features.push(newFeature);
      });

      const layer = L.geoJson(features, {
        onEachFeature: this.onEachFeature,
        style: this.featureStyle,
      }).bringToBack();

      this.setDataLayer('dataLayer', layer);
    });
  }

  setDataLayer(layerName, newDataLayer) {
    this.updateLayer(layerName, newDataLayer);
    this.updateInvalidLocations();
    this.addLabels(newDataLayer);
  }

  setBaseLayer() {
    const newBaseLayer = this.baseLayers[this.props.controls.baseLayer];
    this.updateLayer('baseLayer', newBaseLayer);
  }

  setOverlayLayer() {
    const { selectedGeoTiles, showAdminBoundaries } = this.props.controls;
    const newOverlayLayer = this.overlayLayers[selectedGeoTiles];
    this.updateLayer('overlayLayer', newOverlayLayer, showAdminBoundaries);

    if (newOverlayLayer !== undefined) {
      updateLayerControl(newOverlayLayer, this.layerControl);
    }
  }

  updateLayer(layerName, newLayer, addLayerToMap = true) {
    const currentLayer = this.state[layerName];
    if (currentLayer !== undefined) {
      this._map.removeLayer(currentLayer);
    }
    if (addLayerToMap && newLayer !== undefined) {
      newLayer.addTo(this._map);
    }
    this.setState({ [layerName]: newLayer });
  }

  setupMap() {
    const { mapCenter, zoomLevel } = this.props.controls;
    // TODO(Pablo): This should come from MapControlsBlock
    // See: https://phab.zenysis.com/T3381
    const newZoomLevel = this.props.isMobile ? zoomLevel - 1 : zoomLevel;

    this._map = L.mapbox
      .map(this._mapRef, null, {
        maxZoom: 15,
        minZoom: 1,
        zoomDelta: 0.5,
        zoomSnap: 0.1,
        wheelPxPerZoomLevel: 250,
        attributionControl: false,
      })
      .setView(mapCenter, newZoomLevel);

    // Disable scroll wheel by default, unless you select the app.
    this._map.scrollWheelZoom.disable();
    this._map.on('mousedown', () => {
      this._map.scrollWheelZoom.enable();
    });
    this._map.on('mouseout', () => {
      this._map.scrollWheelZoom.disable();
    });

    this.layerControl = L.control.layers(this.baseLayers).addTo(this._map);

    // track map changes in the controls
    // TODO(pablo): add these to the settings modal as well
    this._map.on('baselayerchange', layer => {
      // Only register a change if the base layer's name changes. Sometimes the
      // leaflet layer object will change but the name will not.
      if (layer.name !== this.props.controls.baseLayer) {
        this.props.onControlsSettingsChange('baseLayer', layer.name);
      }
    });

    this._map.on('moveend', leafletEvent => {
      const { lat, lng } = leafletEvent.target.getCenter();
      this.props.onControlsSettingsChange('mapCenter', [lat, lng]);
    });

    this._map.on('zoomend', leafletEvent => {
      this.props.onControlsSettingsChange(
        'zoomLevel',
        leafletEvent.target.getZoom(),
      );
    });

    // TODO(stephen): Currently, this option is only changeable through the
    // Leaflet control directly on the map. This should be replicated in the
    // settings modal.
    // HACK(stephen): Because we can change the overlay layer via the settings
    // modal, this will trigger the `overlayadd` and `overlayremove` listeners.
    // We only want to change the controls setting if the user *directly*
    // clicked the checkbox on the layer control. To do this, we access the
    // internal variable _handlingClick to determine if the event listener was
    // called based on a click event or on a programmatic add/remove of a layer.
    this._map.on('overlayadd', () => {
      if (this.layerControl._handlingClick) {
        this.props.onControlsSettingsChange('showAdminBoundaries', true);
      }
    });

    this._map.on('overlayremove', () => {
      if (this.layerControl._handlingClick) {
        this.props.onControlsSettingsChange('showAdminBoundaries', false);
      }
    });

    // Set the initial base and overlay layers.
    this.setBaseLayer();
    this.setOverlayLayer();
  }

  setupLabelEngine() {
    // $CycloneIdaiHack
    /* eslint-disable new-cap */
    if (this._labelEngine === undefined) {
      this._labelEngine = new window.labelgun.default(hideLabel, showLabel);
    }
    this._labelEngine.reset();
  }

  @autobind
  buildPopup(layer) {
    const {
      seriesOrder,
      seriesObjects,
    } = this.props.seriesSettings.modelValues();
    const seriesObjectsArray = seriesOrder.map(
      seriesId => seriesObjects[seriesId],
    );
    return ReactDOMServer.renderToStaticMarkup(
      <MapHoverWindow
        seriesObjects={seriesObjectsArray}
        geoObj={layer.feature.dimObj}
        getMarkerValue={this.props.getMarkerValue}
      />,
    );
  }

  @autobind
  buildLabelTooltip(layer) {
    const {
      selectedField,
      tooltipFontSize,
      tooltipFontColor,
      tooltipFontFamily,
      tooltipBackgroundColor,
      tooltipBold,
    } = this.props.controls;
    const { r, g, b, a } = tooltipBackgroundColor;

    const style = {
      color: tooltipFontColor,
      fontFamily: tooltipFontFamily,
      fontSize: tooltipFontSize,
      backgroundColor: `rgba(${r}, ${g}, ${b}, ${a})`,
      fontWeight: tooltipBold ? 700 : 400,
    };
    const { metrics, key } = layer.feature.dimObj;
    const metricValue = metrics[selectedField];
    return ReactDOMServer.renderToStaticMarkup(
      <div style={style} className="map-tooltip">
        {key} <br /> {metricValue}
      </div>,
    );
  }

  buildGeoMarkers() {
    const { dateIndex } = this.state;
    if (this.props.queryResult.data().length === 0) {
      return [];
    }
    return this.props.queryResult.data()[dateIndex].datedData.map(dimObj => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        // GeoJson features swap coordinate pairs to be longitude,latititude
        coordinates: [dimObj.lng, dimObj.lat],
      },
      ...getFeatureMetadata(dimObj),
    }));
  }

  updateFeatures() {
    if (!this.state.dataLayer) {
      return;
    }

    this.state.dataLayer.eachLayer(layer => {
      layer.setStyle(this.featureStyle(layer.feature));
    });
    this.addLabels(this.state.dataLayer);
  }

  /**
   * Restructure the data to a columnar format so we can easily get the array
   * of all values per field
   */
  @memoizeOne
  getDataPerField(queryResult) {
    const columns = {};
    const { dateIndex } = this.state;
    queryResult.data()[dateIndex].datedData.forEach(dataObj => {
      const { metrics } = dataObj;
      Object.keys(metrics).forEach(key => {
        if (columns[key] === undefined) {
          columns[key] = [];
        }
        columns[key].push(metrics[key]);
      });
    });
    return columns;
  }

  getFillColor(dimObj) {
    if (dimObj.color) {
      return dimObj.color;
    }

    const { controls, colorFilters, queryResult, getMarkerValue } = this.props;
    const fieldId = controls.selectedField;
    const colorFilter = colorFilters.get(fieldId);

    if (colorFilter === undefined) {
      return DEFAULT_BUBBLE_COLOR;
    }

    return colorFilter.getValueColor(
      getMarkerValue(dimObj.metrics, fieldId),
      this.getDataPerField(queryResult)[fieldId],
      DEFAULT_BUBBLE_COLOR,
    );
  }

  shouldDisplayFeature(feature) {
    // Hide this feature if it does not have a valid lat/lon.
    if (isPoint(feature)) {
      const [lng, lat] = feature.geometry.coordinates;
      if (!lng || !lat) {
        return false;
      }
    }

    // If this feature doesn't have a value for the currently selected field,
    // hide it.
    const { dimObj } = feature;
    const { selectedField } = this.props.controls;
    const val = this.props.getMarkerValue(dimObj.metrics, selectedField);
    if (Number.isNaN(val)) {
      return false;
    }

    // Check if this value has been filtered out.
    return !isLocationFilteredOut(dimObj);
  }

  @autobind
  featureStyle(feature) {
    if (!this.shouldDisplayFeature(feature)) {
      return {
        fillOpacity: 0,
        opacity: 0,
      };
    }

    if (isPoint(feature)) {
      return this.markerStyle(feature);
    }
    return this.geoJsonFeatureStyle(feature);
  }

  markerStyle(feature) {
    const { dimObj } = feature;
    const markerSize = this.getMarkerSize(dimObj.metrics);
    return {
      color: '#fff',
      opacity: 0.6,
      fillColor: this.getFillColor(dimObj),
      fillOpacity: this.props.controls.fillOpacity,
      radius: markerSize,
      weight: 1,
      // Largest circles on bottom.
      zIndexOffset: -1 * markerSize,
      className: 'geo-json-layer',
    };
  }

  geoJsonFeatureStyle(feature) {
    const { dimObj } = feature;
    const fillOpacity =
      this.props.controls.baseLayer === BLANK_LAYER_ID
        ? 1
        : this.props.controls.fillOpacity;
    return {
      fillColor: this.getFillColor(dimObj),
      // stroke: false,    // No border outline.
      color: '#000',
      weight: 1,
      opacity: 1,
      fillOpacity,
      className: 'geo-json-layer',
    };
  }

  getMarkerSize(metrics) {
    // HACK(stephen): There is still more refactoring work needed for Map. I
    // don't have a good way of applying scaled dot sizing from the base map
    // in a general way through a default prop.
    if (this.props.getMarkerSize !== undefined) {
      return this.props.getMarkerSize(metrics);
    }

    const { currentDisplay, selectedField } = this.props.controls;
    const { dateIndex } = this.state;
    const val = this.props.getMarkerValue(metrics, selectedField);
    if (currentDisplay === OPTION_SCALED_DOTS) {
      const maxVal =
        this.props.queryResult.fieldMaximum(selectedField, dateIndex) ||
        DEFAULT_MARKER_SIZE_PX;
      return Math.sqrt(1000 * (val / maxVal)) + 5;
    }
    return DEFAULT_MARKER_SIZE_PX;
  }

  scaleMarkerSizeByCount(fieldId, val) {
    const { dateIndex } = this.state;
    let maxval = this.props.queryResult.fieldMaximum(fieldId, dateIndex);
    if (!maxval) {
      maxval = DEFAULT_MARKER_SIZE_PX;
    }
    return Math.sqrt(1000 * (val / maxval)) + 5;
  }

  @autobind
  filterMarkersByUserInputChange(value) {
    if (!this.state.dataLayer) {
      return;
    }
    const filterStr = value.toLowerCase();
    this.state.dataLayer.getLayers().forEach(marker => {
      const { feature } = marker;
      const markerStyle = marker.getElement().style;
      if (!feature.textSearchKey.includes(filterStr)) {
        markerStyle.display = 'none';
      } else {
        markerStyle.display = '';
      }
    });
  }

  addLabels(layer) {
    const { showLabels } = this.props.controls;
    if (showLabels) {
      this.setupLabelEngine();
      Object.keys(layer._layers).forEach(layerId =>
        this.addLabel(layerId, layer._layers[layerId]),
      );
      this._labelEngine.update();
    }
  }

  addLabel(layerId, layer) {
    // This is ugly but there is no getContainer method on the tooltip :(
    // We need the bounding rectangle of the label itself
    const tooltipControl = layer.getTooltip();
    if (!tooltipControl) {
      return;
    }

    const label = tooltipControl._source._tooltip._container;
    if (label) {
      const rect = label.getBoundingClientRect();

      // We convert the container coordinates (screen space) to Lat/lng
      const bottomLeft = this._map.containerPointToLatLng([
        rect.left,
        rect.bottom,
      ]);
      const topRight = this._map.containerPointToLatLng([rect.right, rect.top]);
      const boundingBox = {
        bottomLeft: [bottomLeft.lng, bottomLeft.lat],
        topRight: [topRight.lng, topRight.lat],
      };

      const { key, metricValue } = layer._tooltip.options.metadata;
      // Ingest the label into labelgun itself
      this._labelEngine.ingestLabel(
        boundingBox,
        layerId,
        metricValue, // Weight
        label,
        key,
        false,
      );

      // If the label hasn't been added to the map already
      // add it and set the added flag to true
      if (!layer.added) {
        layer.addTo(this._map);
        // eslint-disable-next-line no-param-reassign
        layer.added = true;
      }
    }
  }

  chooseEntityMarkerColor(options, properties) {
    let markerColor = null;
    STATIC_GEO_DATA_LABELS.forEach(label => {
      const val = properties[label];
      const idx = options.indexOf(val);
      if (idx !== -1) {
        markerColor = ENTITY_LEGEND_COLORS[idx];
      }
    });

    return markerColor;
  }

  getEntityMarkers(entityDimensionOptions) {
    return L.geoJson(STATIC_GEOJSON_FULL_DATA, {
      onEachFeature: ({ properties }, layer) => {
        layer.bindPopup(() =>
          ReactDOMServer.renderToStaticMarkup(
            <React.Fragment>
              <b>{properties.Name}</b>
              {STATIC_GEO_DATA_LABELS.map(label => {
                let val = t('visualizations.common.noData');
                if (properties[label]) {
                  val = properties[label];
                }
                return (
                  <div>
                    {val} ({label})
                  </div>
                );
              })}
            </React.Fragment>,
          ),
        );
      },
      filter: this.filterEntityMarkers,
      style: ({ properties }) => ({
        color: '#fff',
        fillColor: this.chooseEntityMarkerColor(
          entityDimensionOptions,
          properties,
        ),
        opacity: 0.5,
        fillOpacity: 0.6,
        radius: 6,
        weight: 1,
        className: 'geo-json-layer',
      }),
      pointToLayer: (feature, latlng) => L.circleMarker(latlng),
    }).bringToFront();
  }

  @autobind
  onEachFeature(feature, layer) {
    // Pass a callback to buildPopup so that popup html generation is deferred
    // until a popup is actually needed. This also allows popups to remain
    // dynamic (can handle prop and state changes) without needing to clear out
    // and build new popups.
    layer.bindPopup(this.buildPopup, {
      autoPan: true, // Move to view the popup.
      maxWidth: this.props.isMobile
        ? MOBILE_MAX_HOVER_WINDOW_WIDTH_PX
        : MAX_HOVER_WINDOW_WIDTH_PX,
      maxHeight: MAX_HOVER_WINDOW_HEIGHT_PX,
    });

    const { selectedField, showLabels } = this.props.controls;

    if (!showLabels) {
      return;
    }

    const { dimObj } = feature;
    const { metrics, key } = dimObj;

    const metricValue = metrics[selectedField];

    layer.bindTooltip(this.buildLabelTooltip, {
      permanent: true,
      opacity: showLabels ? VISIBLE_LABEL_OPACITY : INVISIBLE_LABEL_OPACITY,
      direction: 'center',
      // $CycloneIdaiHack
      metadata: {
        key,
        metricValue,
      },
    });
  }

  @autobind
  onAddEntity(entityObj) {
    const { entityDimensions, selectedEntityFilter } = this.state;

    const nextSelectedEntityFilter = entityObj.entityType;
    // User has selected a filter from this particular
    // (nextSelectedEntityFilter) dropdown
    entityDimensions[nextSelectedEntityFilter] = entityObj.value;

    // Automatically sets the 'Choose Data to Color' value if previously
    // 'No selections'
    const entityFilter =
      selectedEntityFilter !== t('query_result.map.sidebar.no_selections')
        ? selectedEntityFilter
        : nextSelectedEntityFilter;

    const entityDimensionOptions = Object.values(this.entityLayers)
      .filter(entity => entity.entityType === entityFilter)
      .map(entity => entity.value);
    const dataLayer = this.getEntityMarkers(entityDimensionOptions);
    this.setDataLayer('entityMarkers', dataLayer);
    this.setState({
      entityDimensions,
      selectedEntityFilter: entityFilter,
    });
  }

  @autobind
  onChangeColorFilter(selectedEntityFilter) {
    this.state.selectedEntityFilter = selectedEntityFilter;
    const entityDimensionOptions = STATIC_GEO_DIMENSIONS[selectedEntityFilter];
    const dataLayer = this.getEntityMarkers(entityDimensionOptions);
    this.setDataLayer('entityMarkers', dataLayer);
    this.setState({ selectedEntityFilter });
  }

  @autobind
  onDateChange(dateIndex) {
    this.setState({ dateIndex });
  }

  maybeRenderLegend() {
    const {
      queryResult,
      controls,
      colorFilters,
      legendSettings,
      seriesSettings,
    } = this.props;
    if (!legendSettings.showLegend()) {
      return null;
    }

    if (queryResult.data().length === 0) {
      return null;
    }

    if (queryResult.data().length === 1 && this.state.dateIndex > 0) {
      return null;
    }

    const { selectedField } = controls;
    return (
      <Legend
        fontSize={legendSettings.legendFontSize()}
        seriesObject={seriesSettings.seriesObjects()[controls.selectedField]}
        colorFilters={colorFilters}
        selectedField={selectedField}
        allValues={this.getDataPerField(queryResult)[selectedField]}
      />
    );
  }

  maybeRenderFooter() {
    return this.props.isMobile || this.props.isPresentMode ? null : (
      <div>
        <GeoLocDisclaimer
          badGeoObjs={this.state.invalidLocations}
          currentDisplay={this.props.controls.currentDisplay}
        />
        {this.props.additionalFooterContent}
        {this.renderAdditionalFooterContent()}
      </div>
    );
  }

  maybeRenderEntityLegend() {
    if (
      !this.props.enableMapLayering ||
      this.state.selectedEntityFilter ===
        t('query_result.map.sidebar.no_selections')
    ) {
      return null;
    }

    // TODO(nina, vinh): maybe change font size to rely on something unique
    // to this particular legend
    const { legendSettings } = this.props;
    const { selectedEntityFilter } = this.state;
    const entityObject = {};
    entityObject[selectedEntityFilter] =
      STATIC_GEO_DIMENSIONS[selectedEntityFilter];
    return (
      <Legend
        fontSize={legendSettings.legendFontSize()}
        entityObject={entityObject}
      />
    );
  }

  maybeRenderEntitySidebar() {
    // TODO(nina): NACOSA (and eventually other deployments)
    if (this.props.enableMapLayering && STATIC_GEO_URL) {
      const entityBlocks = [];
      const dropDowns = [];
      const colorDropdownOptions = [];

      const { entityLayers } = this;
      const entityKeys = new Set(
        Object.keys(entityLayers).map(key => key.split('__')[0]),
      );
      entityKeys.forEach(entityKey => {
        colorDropdownOptions.push(
          <Dropdown.Option value={entityKey}>{entityKey}</Dropdown.Option>,
        );
        const options = [];
        options.push(
          <Dropdown.Option value={{ entityType: entityKey, value: '' }}>
            {t('query_result.map.sidebar.no_selections')}
          </Dropdown.Option>,
        );
        Object.keys(entityLayers).forEach(entity => {
          if (entityLayers[entity].entityType === entityKey) {
            options.push(
              <Dropdown.Option value={entityLayers[entity]}>
                {entityLayers[entity].value}
              </Dropdown.Option>,
            );
          }
        });

        dropDowns.push(
          <div>
            <label htmlFor="entityKey">{entityKey}</label>
            <Dropdown
              defaultDisplayContent={t(
                'query_result.map.sidebar.no_selections',
              )}
              value={this.state.entityDimensions[entityKey][0]}
              buttonWidth="100%"
              menuWidth="100%"
              onSelectionChange={this.onAddEntity}
            >
              {options}
            </Dropdown>
          </div>,
        );
      });

      const addEntitiesBlock = (
        <div className="entity-sidebar__item">
          <label htmlFor="add_entities">
            {' '}
            {t('query_result.map.sidebar.add_entities')}
          </label>
          {dropDowns}
        </div>
      );

      entityBlocks.push(addEntitiesBlock);

      const chooseColorBlock = (
        <div className="entity-sidebar__item">
          <label htmlFor="choose_data">
            {' '}
            {t('query_result.map.sidebar.choose_data')}
          </label>
          <Dropdown
            defaultDisplayContent={this.state.selectedEntityFilter}
            value={this.state.selectedEntityFilter}
            buttonWidth="100%"
            menuWidth="100%"
            onSelectionChange={this.onChangeColorFilter}
          >
            {colorDropdownOptions}
          </Dropdown>
        </div>
      );

      entityBlocks.push(chooseColorBlock);

      return <div className="entity-sidebar">{entityBlocks}</div>;
    }
    return null;
  }

  renderAdditionalFooterContent() {
    if (this.props.queryResult.data().length < 2) {
      return null;
    }
    const dates = this.props.queryResult.data().map(datedObj => datedObj.date);
    return <MapTimeline dates={dates} onDateChange={this.onDateChange} />;
  }

  renderSearchBox() {
    /* eslint-disable jsx-a11y/label-has-associated-control */
    return (
      <div className="form-group map-search-box hide-on-export">
        <label>
          {t('query_result.map.filter_map_bubbles')}
          <InputText.Uncontrolled
            className="input-xs"
            debounce
            debounceTimeoutMs={50}
            initialValue=""
            onChange={this.filterMarkersByUserInputChange}
          />
        </label>
      </div>
    );
    /* eslint-enable jsx-a11y/label-has-associated-control */
  }

  renderVisualization() {
    return (
      <div
        className="map-container"
        ref={ref => {
          this._mapRef = ref;
        }}
      >
        {this.renderSearchBox()}
        <div className="entity-container">
          {this.maybeRenderEntitySidebar()}
          {this.maybeRenderEntityLegend()}
        </div>
        {this.maybeRenderLegend()}
      </div>
    );
  }

  render() {
    return (
      <Visualization
        loading={this.props.loading}
        className="map-visualization"
        footer={this.maybeRenderFooter()}
      >
        {this.renderVisualization()}
      </Visualization>
    );
  }
}

PropDefs.setComponentProps(BaseMap, propDefs);

/* eslint-disable new-cap */
export default withScriptLoader(BaseMap, {
  scripts: [VENDOR_SCRIPTS.mapbox, VENDOR_SCRIPTS.labelgun],
  loadingNode: <ProgressBar enabled />,
});
