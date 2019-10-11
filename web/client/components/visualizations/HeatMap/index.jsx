import React from 'react';
import PropTypes from 'prop-types';
import pluralize from 'pluralize';

import LegacyQueryResultData from 'components/visualizations/common/legacy/models/LegacyQueryResultData';
import ProgressBar from 'components/ui/ProgressBar';
import PropDefs from 'util/PropDefs';
import Query from 'components/visualizations/common/legacy/Query';
import Visualization from 'components/visualizations/common/Visualization';
import withScriptLoader from 'components/common/withScriptLoader';
import { VENDOR_SCRIPTS } from 'vendor/registry';
import {
  applyFilters,
  selectionsChanged,
} from 'components/visualizations/common/legacy/util';
import { capitalize } from 'util/stringUtil';
import { visualizationPropDefs } from 'components/visualizations/common/commonPropDefs';
import { memoizeOne } from 'decorators';

// The default max value to load into the heatmap. Only needed while the
// query is being executed.
const DEFAULT_MAX = 50;

// Where the map is centered at first.
const DEFAULT_VIEW_LAT_LNG = window.__JSON_FROM_BACKEND.mapDefaultLatLng;

// How the map is zoomed at first.
const DEFAULT_VIEW_ZOOM_LEVEL = window.__JSON_FROM_BACKEND.mapDefaultZoom;

// Access token for mapbox.
const MAPBOX_ACCESS_TOKEN = window.__JSON_FROM_BACKEND.mapboxAccessToken;

const propDefs = PropDefs.create('heatMap').addGroup(
  visualizationPropDefs
    .propTypes({
      queryResult: PropTypes.instanceOf(LegacyQueryResultData),
    })
    .defaultProps({
      queryResult: LegacyQueryResultData.create(),
    }),
);

class HeatMap extends React.PureComponent {
  @memoizeOne
  filterSeries = applyFilters;

  constructor(props) {
    super(props);
    this.enableMapZoom = this.enableMapZoom.bind(this);
    this.disableMapZoom = this.disableMapZoom.bind(this);
    this._mapRef = undefined;
  }

  componentDidMount() {
    this.fetchData(this.props);
    this.setupMap();
  }


  componentDidUpdate(prevProps) {
    if (selectionsChanged(this.props.selections, prevProps.selections)) {
      this.fetchData(this.props);
    }
    this.maybeTeardownMap();
    this.setupMap();
  }

  componentWillUnmount() {
    // Cancel any outstanding promises
    if (this._queryPromise && this._queryPromise.isPending()) {
      this._queryPromise.cancel();
    }

    this.maybeTeardownMap();
  }

  fetchData(props) {
    this.props.onQueryDataStartLoading();

    // Run the query and store the promise so that we can
    // clean it up later if needed
    this._queryPromise = new Query()
      .buildRequest(props.selections)
      .run()
      .then(result => this.props.onQueryDataLoad(result))
      .catch(console.error); // eslint-disable-line no-console
  }

  maybeTeardownMap() {
    if (!this._map) {
      // Doesn't exist yet.
      return;
    }
    this._map.remove();
    this._map.off('mousedown', this.enableMapZoom);
    this._map.off('mouseout', this.disableMapZoom);
  }

  setupMap() {
    const mapElt = this._mapRef;
    this._map = L.mapbox
      .map(mapElt, null, {
        maxZoom: 19,
        minZoom: 4,
        zoomDelta: 0.1,
        zoomSnap: 0.1,
        wheelPxPerZoomLevel: 250,
      })
      .setView(DEFAULT_VIEW_LAT_LNG, DEFAULT_VIEW_ZOOM_LEVEL);

    // TODO(vinh, stephen): Centralize the mapbox tile layer references into a
    // utility that all map visualizations can reference.
    /* eslint-disable max-len */
    const baseLayers = {
      // Streets: L.mapbox.tileLayer('mapbox.streets'),
      // Satellite: L.mapbox.tileLayer('mapbox.streets-satellite'),
      Satellite: L.tileLayer(
        `https://{s}.tiles.mapbox.com/v4/mapbox.streets-satellite/{z}/{x}/{y}.png?access_token=${MAPBOX_ACCESS_TOKEN}`,
      ),
      Streets: L.tileLayer(
        `https://{s}.tiles.mapbox.com/v4/mapbox.streets/{z}/{x}/{y}.png?access_token=${MAPBOX_ACCESS_TOKEN}`,
      ),
      Light: L.tileLayer(
        `https://api.mapbox.com/styles/v1/ianw/cixmhlc18001z2ro71bu7qrqv/tiles/256/{z}/{x}/{y}?access_token=${MAPBOX_ACCESS_TOKEN}`,
      ),
      Blank: L.tileLayer('/images/map/white.jpg'),
    };

    const overlayLayers = {
      Administrative: L.tileLayer(
        `https://{s}.tiles.mapbox.com/v4/ianw.8d7c392a/{z}/{x}/{y}.png?access_token=${MAPBOX_ACCESS_TOKEN}`,
      ),
    };
    /* eslint-disable max-len */

    const selectedBaseLayer = baseLayers[this.props.controls.baseLayer];
    const selectedOverlayLayers = overlayLayers.Administrative;
    L.layerGroup([selectedBaseLayer, selectedOverlayLayers]).addTo(this._map);
    L.control.layers(baseLayers, overlayLayers).addTo(this._map);

    const fieldId = this.props.controls.selectedField;

    // Loop through each series and set it up.
    const latlngPoints = [];
    this.getSeries().forEach(geoObj => {
      const { lat, lng } = geoObj;
      // Catch unmappable locations
      if ((lat === 0 && lng === 0) || !lat || !lng) {
        return;
      }

      // Produce heat for each field.
      const val = geoObj[`yValue_${fieldId}`];
      latlngPoints.push([lat, lng, val]);
    }); // end series forEach

    // Create heat map.
    L.heatLayer(latlngPoints, {
      radius: 38,
      maxZoom: DEFAULT_VIEW_ZOOM_LEVEL,
      max: this.props.queryResult.metadata().max[fieldId] || DEFAULT_MAX,
    }).addTo(this._map);

    // Disable scroll wheel by default, unless you select the app.
    this._map.scrollWheelZoom.disable();
    this._map.on('mousedown', this.enableMapZoom);
    this._map.on('mouseout', this.disableMapZoom);
  }

  enableMapZoom() {
    this._map.scrollWheelZoom.enable();
  }

  disableMapZoom() {
    this._map.scrollWheelZoom.disable();
  }

  getSeries() {
    return this.filterSeries(
      this.props.queryResult.series(),
      this.props.filters,
    );
  }

  getTitle() {
    const indicatorText = this.props.selections.fields.map(field =>
      this.props.seriesSettings.seriesObjects()[field.id()].label(),
    );
    const firstLine = `${pluralize(
      capitalize(this.props.selections.granularity),
    )} by ${indicatorText[0]}`;
    return firstLine;
  }

  renderLegend() {
    if (this.getSeries().length === 0 || this.props.fields.length < 2) {
      return null;
    }

    const max = this.getSeries().reduce((currentMax, geoObj) => {
      const val = geoObj[`yValue_${this.props.controls.selectedField}`];
      return val ? Math.max(val, currentMax) : currentMax;
    }, 0);

    const height = 300;
    const heightStyle = { height: `${height}px` };

    const maxStr = Math.ceil(max).toString();
    let step = 10 ** (maxStr.length - 1);
    if (Number(maxStr.charAt(0)) < 2) {
      step /= 5;
    } else if (Number(maxStr.charAt(0)) < 5) {
      step /= 2;
    }

    const labels = [Math.floor(max / step) * step];
    while (labels[labels.length - 1] > step) {
      const value = (labels[labels.length - 1] - step).toFixed(3);
      labels.push(value);
    }

    const stepHeight = height / labels.length;
    const floorStyle = {
      lineHeight: '0px',
      visibility: 'hidden',
    };

    const labelDivs = labels.map(label => {
      const style = {
        height: stepHeight,
      };
      return (
        <div key={label} style={style}>
          {label}
        </div>
      );
    });

    return (
      <div className="heatmap-legend">
        <div className="heatmap-legend-colorbar" style={heightStyle} />
        <div className="heatmap-legend-text">
          {labelDivs}
          <div style={floorStyle}>.</div>
        </div>
      </div>
    );
  }

  render() {
    // TODO(stephen): Convert BaseMap into using composition vs inheritance
    return (
      <Visualization className="map-visualization" loading={this.props.loading}>
        <div
          className="map-container"
          ref={ref => {
            this._mapRef = ref;
          }}
        >
          {this.renderLegend()}
        </div>
      </Visualization>
    );
  }
}

PropDefs.setComponentProps(HeatMap, propDefs);

export default withScriptLoader(HeatMap, {
  scripts: [VENDOR_SCRIPTS.leafletHeat],
  loadingNode: <ProgressBar enabled />,
});
