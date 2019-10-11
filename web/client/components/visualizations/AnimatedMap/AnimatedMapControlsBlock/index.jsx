// @flow
import * as React from 'react';

import ControlsGroup from 'components/visualizations/common/controls/ControlsGroup';
import DropdownControl, {
  Option,
} from 'components/visualizations/common/controls/DropdownControl';
import SingleFieldSelectionControl from 'components/visualizations/common/controls/SingleFieldSelectionControl';
import type { ControlsBlockProps } from 'components/visualizations/common/commonTypes';
import type { ViewTypeConfig } from 'models/core/QueryResultSpec/VisualizationSettings';

type Props = ControlsBlockProps<'ANIMATED_MAP'>;
type Controls = $PropertyType<Props, 'controls'>;

const TXT_CONTROLS = t('query_result.controls');
const TXT_MAP = t('query_result.map');

// Where the map is centered at first.
const DEFAULT_VIEW_LAT_LNG = window.__JSON_FROM_BACKEND.mapDefaultLatLng;

// Location of GeoJson tiles to load, if they exist for this config
const GEOJSON_TILE_URL = window.__JSON_FROM_BACKEND.mapOverlayGeoJson;

// How the map is zoomed at first.
const DEFAULT_VIEW_ZOOM_LEVEL =
  $(window).width() > 500
    ? window.__JSON_FROM_BACKEND.mapDefaultZoom
    : window.__JSON_FROM_BACKEND.mapDefaultZoom - 1;
const DEFAULT_VIEW_ZOOM_LEVEL_SMALL_MODE = DEFAULT_VIEW_ZOOM_LEVEL - 2;

const OPTION_TILES = 'tiles';
const OPTION_DOTS = 'dots';

export default class AnimatedMapControlsBlock extends React.PureComponent<Props> {
  // TODO(pablo): add controls for baseLayer and overlayLayers
  static getDefaultControls(viewTypeConfig: ViewTypeConfig): Controls {
    const { fields, groupingDimension, smallMode } = viewTypeConfig;
    // Default to a Tiles view if tiles are supported.
    // NOTE(stephen): Requires a color setting to be applied to be useful. I'm
    // ok with this right now.
    const currentDisplay = GEOJSON_TILE_URL ? OPTION_TILES : OPTION_DOTS;
    const overlayLayers =
      currentDisplay === OPTION_TILES ? [] : ['Administrative'];
    return {
      currentDisplay,
      selectedField: fields[0],
      selectedGeoTiles: groupingDimension,
      baseLayer: 'Streets',
      overlayLayers,
      zoomLevel: smallMode
        ? DEFAULT_VIEW_ZOOM_LEVEL_SMALL_MODE
        : DEFAULT_VIEW_ZOOM_LEVEL,
      mapCenter: DEFAULT_VIEW_LAT_LNG,
    };
  }

  renderTileOptions() {
    const tileOption = (
      <Option value="tiles">{TXT_MAP.display_option_tiles}</Option>
    );

    return (
      <DropdownControl
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.currentDisplay}
        controlKey="currentDisplay"
        label={TXT_CONTROLS.display_title}
        buttonMinWidth={115}
      >
        <Option value="dots">{TXT_MAP.display_option_dots}</Option>
        <Option value="scaled-dots">
          {TXT_MAP.display_option_scaled_dots}
        </Option>
        {GEOJSON_TILE_URL ? tileOption : null}
      </DropdownControl>
    );
  }

  renderLayerOptions() {
    const layerOptions = ['Satellite', 'Streets', 'Light', 'Blank'].map(
      layer => (
        <Option value={layer} key={layer}>
          {t(`query_result.map.layers.${layer}`)}
        </Option>
      ),
    );

    return (
      <DropdownControl
        controlKey="baseLayer"
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.baseLayer}
        label="Layer Options"
      >
        {layerOptions}
      </DropdownControl>
    );
  }

  renderFieldSelector() {
    return (
      <SingleFieldSelectionControl
        controlKey="selectedField"
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.selectedField}
        fields={this.props.fields}
      />
    );
  }

  render() {
    return (
      <ControlsGroup>
        {this.renderFieldSelector()}
        {this.renderLayerOptions()}
        {this.renderTileOptions()}
      </ControlsGroup>
    );
  }
}
