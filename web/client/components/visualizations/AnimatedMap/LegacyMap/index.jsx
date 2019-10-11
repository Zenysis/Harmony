// HACK(stephen, toshi): Preserve the pre-QueryResultState Map visualization
// implementation so that AnimatedMap can use it. This is to prevent breaking
// the AnimatedMap viz and allow us more time to migrate that viz to
// QueryResultState.
import PropTypes from 'prop-types';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

import InputText from 'components/ui/InputText';
import LegacyGeoLocDisclaimer from 'components/visualizations/AnimatedMap/LegacyMap/LegacyGeoLocDisclaimer';
import LegacyLegend from 'components/visualizations/AnimatedMap/LegacyMap/LegacyLegend';
import LegacyMapHoverWindow, {
  MAX_HOVER_WINDOW_WIDTH_PX,
  MOBILE_MAX_HOVER_WINDOW_WIDTH_PX,
  MAX_HOVER_WINDOW_HEIGHT_PX,
} from 'components/visualizations/AnimatedMap/LegacyMap/LegacyMapHoverWindow';
import LegacyQueryResultData from 'components/visualizations/common/legacy/models/LegacyQueryResultData';
import ProgressBar from 'components/ui/ProgressBar';
import PropDefs from 'util/PropDefs';
import Query from 'components/visualizations/common/legacy/Query';
import Visualization from 'components/visualizations/common/Visualization';
import withScriptLoader from 'components/common/withScriptLoader';
import { BACKEND_GRANULARITIES } from 'components/QueryResult/timeSeriesUtil';
import { VENDOR_SCRIPTS } from 'vendor/registry';
import { autobind } from 'decorators';
import { getColorForValue } from 'components/visualizations/Map/util';
import { passesFilter } from 'components/QueryResult/resultUtil';
import { selectionsChanged } from 'components/visualizations/common/legacy/util';
import { visualizationPropDefs } from 'components/visualizations/common/commonPropDefs';

// Default bubble size without being scaled.
const DEFAULT_MARKER_SIZE_PX = 7;

// Location of GeoJson tiles to load, if they exist for this config
const GEOJSON_TILE_URL = window.__JSON_FROM_BACKEND.mapOverlayGeoJson;
const GEO_FIELD_ORDERING = window.__JSON_FROM_BACKEND.geoFieldOrdering;

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

// HACK(stephen): Try to issue only one geojson tile request per page
let OUTSTANDING_GEOJSON_TILE_REQUEST = null;

function getFeatureMetadata(dimObj) {
  return {
    dimObj,
    textSearchKey: dimObj.geoKey,
  };
}

const propDefs = PropDefs.create('baseMap')
  .addGroup(
    visualizationPropDefs
      .propTypes({
        queryResult: LegacyQueryResultData.type(),
      })
      .defaultProps({
        queryResult: LegacyQueryResultData.create(),
      }),
  )
  .propTypes({
    // eslint-disable-next-line max-len
    onControlsSettingsChange: PropTypes.func.isRequired, // f(controlType, value)

    additionalFooterContent: PropTypes.node,
    dateGranularity: PropTypes.oneOf(Object.values(BACKEND_GRANULARITIES)),
    getMarkerValue: PropTypes.func, // f(dimObj, fieldId) => number
    getMarkerSize: PropTypes.func, // f(dimObj) => number
  })
  .defaultProps({
    additionalFooterContent: undefined,
    dateGranularity: undefined,
    getMarkerValue: (dimObj, fieldId) => dimObj[`yValue_${fieldId}`],
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

// Build a geo key that is only based on the geographical dimensions.
function getGeoShapeKey(dimensions) {
  return GEO_FIELD_ORDERING.map(dimension => dimensions[dimension] || '')
    .join('__')
    .toLowerCase();
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

function getGeoJsonTiles() {
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
      return {};
    })
    .fail((jqxhr, textStatus, error) => {
      console.error('Cannot process GeoJson data');
      console.error(`{Error: ${error}}`);
      return {};
    });
  /* eslint-enable no-console */
  return OUTSTANDING_GEOJSON_TILE_REQUEST;
}

function buildGeoShapeCacheIfNeeded(callback) {
  if (Object.keys(geoShapeCache).length) {
    callback();
    return;
  }

  getGeoJsonTiles().then(callback);
}

function getGeoShape(dimObj) {
  return geoShapeCache[getGeoShapeKey(dimObj)];
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

function isLocationFilteredOut(dimObj, filters) {
  // HACK(stephen): Always exclude the Nation as Region result from Map.
  if (dimObj.geoKey === 'nation______') {
    return true;
  }

  const fieldFilters = Object.keys(filters);
  if (fieldFilters.length === 0) {
    return false;
  }

  // NOTE(stephen): Since filters don't operate on timeseries data right now,
  // we are ok just accessing the total value for each field.
  return fieldFilters.some(
    fieldId => !passesFilter(filters, fieldId, dimObj[`yValue_${fieldId}`]),
  );
}

function isLocationMappable(dimObj, displayingShapeTiles = false) {
  if (displayingShapeTiles) {
    return !!getGeoShape(dimObj);
  }
  return dimObj.lat && dimObj.lng;
}

export class LegacyMap extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      baseLayer: undefined,
      dataLayer: undefined,
      overlayLayer: undefined,
      invalidLocations: [],
    };
    this._mapRef = undefined;
    this.baseLayers = getBaseLayers();
    this.overlayLayers = getAdminLayers();
    this.layerControl = undefined;
  }

  componentDidMount() {
    this.fetchData(this.props);
    this.setupMap();
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
      // changed. Currently that is only invalidLocations. Ignore layer changes
      // since those are committed directly to Leaflet.
      if (diffStateKeys.includes('invalidLocations')) {
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

  componentDidUpdate(prevProps) {
    const prevControls = prevProps.controls;
    const curControls = this.props.controls;
    if (
      selectionsChanged(this.props.selections, prevProps.selections) ||
      this.props.dateGranularity !== prevProps.dateGranularity
    ) {
      this.fetchData(this.props);
    }

    if (
      prevProps.queryResult !== this.props.queryResult ||
      shouldDisplayShapeTiles(prevControls) !==
        shouldDisplayShapeTiles(curControls)
    ) {
      this.updateDataLayer();
    }

    if (prevControls.baseLayer !== curControls.baseLayer) {
      this.setBaseLayer();
    }

    if (prevControls.selectedGeoTiles !== curControls.selectedGeoTiles) {
      this.setOverlayLayer();
    }

    if (prevProps.filters !== this.props.filters) {
      this.updateInvalidLocations();
    }

    this.updateFeatures();
  }

  componentWillUnmount() {
    // Cancel any outstanding promises
    if (this._queryPromise && this._queryPromise.isPending()) {
      this._queryPromise.cancel();
    }

    this.teardownMap();
  }

  fetchData(props) {
    this.props.onQueryDataStartLoading();

    // HACK(stephen): This won't be needed when I finish the map refactor. But
    // until user's of the BaseMap pass in the exact geo shapes to draw, we
    // still need to handle querying here. This is to support AnimatedMap.
    const { dateGranularity } = props;
    const granularities = dateGranularity ? [dateGranularity] : undefined;

    // Run the query and store the promise so that we can
    // clean it up later if needed
    this._queryPromise = new Query()
      .buildRequest(props.selections, granularities)
      .run()
      .then(result => this.props.onQueryDataLoad(result))
      .catch(console.error); // eslint-disable-line no-console
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
    const invalidLocations = this.props.queryResult
      .series()
      .filter(
        dimObj =>
          !isLocationMappable(dimObj, displayingShapeTiles) &&
          !isLocationFilteredOut(dimObj, this.props.filters),
      );
    this.setState({ invalidLocations });
  }

  updateDataLayer() {
    if (shouldDisplayShapeTiles(this.props.controls)) {
      this.addGeoJsonLayer();
    } else {
      this.addMarkerLayer();
    }
  }

  addMarkerLayer() {
    const markers = this.buildGeoMarkers();
    if (!markers.length) {
      return;
    }

    const dataLayer = L.geoJson(markers, {
      onEachFeature: this.onEachFeature,
      style: this.featureStyle,
      pointToLayer: (feature, latlng) => L.circleMarker(latlng),
    });

    this.setDataLayer(dataLayer);
  }

  addGeoJsonLayer() {
    buildGeoShapeCacheIfNeeded(() => {
      // TODO(moriah): GeoMap does not yet support the addition of geoshapes
      const features = [];
      this.props.queryResult.series().forEach(dimObj => {
        const feature = getGeoShape(dimObj);
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

      this.setDataLayer(layer);
    });
  }

  setDataLayer(newDataLayer) {
    this.updateLayer('dataLayer', newDataLayer);
    this.updateInvalidLocations();
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
        maxZoom: 11,
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
      this.props.onControlsSettingsChange('baseLayer', layer.name);
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
      <LegacyMapHoverWindow
        seriesObjects={seriesObjectsArray}
        geoObj={layer.feature.dimObj}
        getMarkerValue={this.props.getMarkerValue}
      />,
    );
  }

  buildGeoMarkers() {
    return this.props.queryResult.series().map(dimObj => ({
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
  }

  getFillColor(dimObj) {
    if (dimObj.color) {
      return dimObj.color;
    }

    const fieldId = this.props.controls.selectedField;
    const filters = this.props.filters[fieldId]
      ? this.props.filters[fieldId].colorFilters
      : {};

    return getColorForValue(
      filters,
      this.props.getMarkerValue(dimObj, fieldId),
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
    const val = this.props.getMarkerValue(dimObj, selectedField);
    if (Number.isNaN(val)) {
      return false;
    }

    // Check if this value has been filtered out.
    return !isLocationFilteredOut(dimObj, this.props.filters);
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
    const markerSize = this.getMarkerSize(dimObj);
    return {
      color: '#fff',
      opacity: 0.6,
      fillColor: this.getFillColor(dimObj),
      fillOpacity: 0.8,
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
      this.props.controls.baseLayer === BLANK_LAYER_ID ? 1 : 0.8;
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

  getMarkerSize(dimObj) {
    // HACK(stephen): There is still more refactoring work needed for Map. I
    // don't have a good way of applying scaled dot sizing from the base map
    // in a general way through a default prop.
    if (this.props.getMarkerSize !== undefined) {
      return this.props.getMarkerSize(dimObj);
    }

    const { currentDisplay, selectedField } = this.props.controls;
    const val = this.props.getMarkerValue(dimObj, selectedField);
    if (currentDisplay === OPTION_SCALED_DOTS) {
      const maxVal =
        this.props.queryResult.metadata().max[selectedField] ||
        DEFAULT_MARKER_SIZE_PX;
      return Math.sqrt(1000 * (val / maxVal)) + 5;
    }
    return DEFAULT_MARKER_SIZE_PX;
  }

  scaleMarkerSizeByCount(fieldId, val) {
    let maxval = this.props.queryResult.metadata().max[fieldId];
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
  }

  maybeRenderLegend() {
    if (!this.props.legendSettings.showLegend()) {
      return null;
    }

    const { controls, filters, legendSettings, seriesSettings } = this.props;
    return (
      <LegacyLegend
        fontSize={legendSettings.legendFontSize()}
        seriesObject={seriesSettings.seriesObjects()[controls.selectedField]}
        seriesFilters={filters[controls.selectedField]}
      />
    );
  }

  maybeRenderFooter() {
    if (this.props.isMobile || this.props.isPresentMode) {
      return null;
    }

    return (
      <div>
        <LegacyGeoLocDisclaimer
          badGeoObjs={this.state.invalidLocations}
          currentDisplay={this.props.controls.currentDisplay}
        />
        {this.props.additionalFooterContent}
      </div>
    );
  }

  renderSearchBox() {
    /* eslint-disable jsx-a11y/label-has-associated-control */
    return (
      <div className="form-group map-search-box hide-on-export">
        <label htmlFor="search">
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

PropDefs.setComponentProps(LegacyMap, propDefs);

export default withScriptLoader(LegacyMap, {
  scripts: [VENDOR_SCRIPTS.mapbox],
  loadingNode: <ProgressBar enabled />,
});
