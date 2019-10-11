// @flow
import * as React from 'react';

import BackgroundOpacityControl from 'components/visualizations/common/controls/BackgroundOpacityControl';
import CheckboxControl from 'components/visualizations/common/controls/CheckboxControl';
import ControlsGroup from 'components/visualizations/common/controls/ControlsGroup';
import DropdownControl, {
  Option,
} from 'components/visualizations/common/controls/DropdownControl';
import FontColorControl from 'components/visualizations/common/controls/FontColorControl';
import FontFamilyControl from 'components/visualizations/common/controls/FontFamilyControl';
import FontSizeControl from 'components/visualizations/common/controls/FontSizeControl';
import SingleFieldSelectionControl from 'components/visualizations/common/controls/SingleFieldSelectionControl';
// eslint-disable-next-line import/extensions
import { SELECT_GRANULARITY_BUTTON_ORDER } from 'backend_config.js';
import type { ControlsBlockProps } from 'components/visualizations/common/commonTypes';
import type { ViewTypeConfig } from 'models/core/QueryResultSpec/VisualizationSettings';

type Props = ControlsBlockProps<'MAP'>;
type Controls = $PropertyType<Props, 'controls'>;

const TXT_CONTROLS = t('query_result.controls');
const TXT_MAP = t('query_result.map');

// Admin boundaries based on user selection of granularity.
const ADMIN_BOUNDS_URLS = window.__JSON_FROM_BACKEND.mapboxAdminURLS;

// Location of GeoJson tiles to load, if they exist for this config
const GEOJSON_TILE_URL = window.__JSON_FROM_BACKEND.mapOverlayGeoJson;

// Where the map is centered at first.
const DEFAULT_VIEW_LAT_LNG = window.__JSON_FROM_BACKEND.mapDefaultLatLng;

// How the map is zoomed at first.
const DEFAULT_VIEW_ZOOM_LEVEL =
  $(window).width() > 500
    ? window.__JSON_FROM_BACKEND.mapDefaultZoom
    : window.__JSON_FROM_BACKEND.mapDefaultZoom - 1;
const DEFAULT_VIEW_ZOOM_LEVEL_SMALL_MODE = DEFAULT_VIEW_ZOOM_LEVEL - 2;

const OPTION_TILES = 'tiles';
const OPTION_DOTS = 'dots';

export default class MapControlsBlock extends React.PureComponent<Props> {
  // TODO(pablo): add controls for baseLayer and overlayLayers
  static getDefaultControls(viewTypeConfig: ViewTypeConfig): Controls {
    const { fields, groupingDimension, smallMode } = viewTypeConfig;
    return {
      currentDisplay: smallMode ? OPTION_TILES : OPTION_DOTS,
      selectedField: fields[0],
      selectedGeoTiles: groupingDimension,
      showAdminBoundaries: true,
      showLabels: false,
      baseLayer: 'Streets',
      overlayLayers: ['Administrative'],
      zoomLevel: smallMode
        ? DEFAULT_VIEW_ZOOM_LEVEL_SMALL_MODE
        : DEFAULT_VIEW_ZOOM_LEVEL,
      mapCenter: DEFAULT_VIEW_LAT_LNG,
      fillOpacity: 0.8,
      tooltipBackgroundColor: { r: 255, g: 255, b: 255, a: 0.75 },
      tooltipFontColor: 'black',
      tooltipFontFamily: 'Arial',
      tooltipFontSize: '12px',
      tooltipBold: false,
    };
  }

  // HACK(stephen): Opacity of shapes should be controlled through a slider not
  // an input. We also shouldn't be passing a callback that is generated every
  // time and should instead bind a function. And we shouldn't rebuild the
  // option list every time. Just wanted to keep everything in a single method.
  // $CycloneIdaiHack
  maybeRenderOpacityControl() {
    if (window.__JSON_FROM_BACKEND.deploymentName !== 'mz') {
      return null;
    }

    const opacityOptions = [];
    for (let i = 0; i <= 10; i++) {
      const displayValue = i === 10 ? '1.0' : `0.${i}`;
      opacityOptions.push(
        <Option value={i / 10} key={i}>
          {displayValue}
        </Option>,
      );
    }

    return (
      <DropdownControl
        controlKey="fillOpacity"
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.fillOpacity}
        label="Shape Opacity"
        buttonMinWidth={115}
      >
        {opacityOptions}
      </DropdownControl>
    );
  }

  maybeRenderTooltipControls() {
    if (!this.props.controls.showLabels) {
      return null;
    }
    const {
      tooltipBackgroundColor,
      tooltipFontSize,
      tooltipFontColor,
      tooltipFontFamily,
    } = this.props.controls;
    return (
      <div className="well well-lg col-xs-12">
        <FontSizeControl
          controlKey="tooltipFontSize"
          onValueChange={this.props.onControlsSettingsChange}
          value={tooltipFontSize}
          label={TXT_MAP.tooltips.font_size}
          buttonMinWidth={115}
          minFontSize={8}
          maxFontSize={32}
          colsWrapper={6}
          colsLabel={6}
          colsControl={6}
        />
        <FontFamilyControl
          controlKey="tooltipFontFamily"
          value={tooltipFontFamily}
          onValueChange={this.props.onControlsSettingsChange}
          label={TXT_MAP.tooltips.font_family}
          buttonMinWidth={115}
          colsWrapper={6}
          colsLabel={6}
          colsControl={6}
        />
        <FontColorControl
          controlKey="tooltipFontColor"
          value={tooltipFontColor}
          onValueChange={this.props.onControlsSettingsChange}
          label={TXT_MAP.tooltips.font_color}
          buttonMinWidth={115}
          colsWrapper={6}
          colsLabel={6}
          colsControl={6}
        />
        <FontColorControl
          controlKey="tooltipBackgroundColor"
          value={tooltipBackgroundColor}
          onValueChange={this.props.onControlsSettingsChange}
          label={TXT_MAP.tooltips.background_color}
          buttonMinWidth={115}
          colsWrapper={6}
          colsLabel={6}
          colsControl={6}
        />
        <CheckboxControl
          controlKey="tooltipBold"
          onValueChange={this.props.onControlsSettingsChange}
          value={this.props.controls.tooltipBold}
          label={TXT_MAP.tooltips.bold}
          colsWrapper={6}
          colsLabel={6}
          colsControl={6}
        />
        <BackgroundOpacityControl
          controlKey="tooltipBackgroundColor"
          value={tooltipBackgroundColor}
          onValueChange={this.props.onControlsSettingsChange}
          label={TXT_MAP.tooltips.background_opacity}
          buttonMinWidth={115}
          includeTransparent
          colsWrapper={6}
          colsLabel={6}
          colsControl={6}
        />
      </div>
    );
  }

  maybeRenderShowLabelsControl() {
    return (
      <CheckboxControl
        controlKey="showLabels"
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.showLabels}
        label={TXT_MAP.show_labels}
        colsWrapper={6}
        colsLabel={6}
        colsControl={6}
      />
    );
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

  renderFieldSelector() {
    return (
      <SingleFieldSelectionControl
        controlKey="selectedField"
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.selectedField}
        fields={this.props.fields}
        buttonMinWidth={115}
      />
    );
  }

  renderGeoTileOptions() {
    const geoTileOptions = SELECT_GRANULARITY_BUTTON_ORDER.filter(
      granularity => granularity in ADMIN_BOUNDS_URLS,
    ).map(granularity => (
      <Option value={granularity} key={granularity}>
        {t(`select_filter.${granularity}`)}
      </Option>
    ));

    // don't render geo tile options if there is none
    if (geoTileOptions.length === 0) return null;

    return (
      <DropdownControl
        controlKey="selectedGeoTiles"
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.selectedGeoTiles}
        label={TXT_CONTROLS.geography_options}
        buttonMinWidth={115}
      >
        {geoTileOptions}
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
        buttonMinWidth={115}
      >
        {layerOptions}
      </DropdownControl>
    );
  }

  render() {
    return (
      <ControlsGroup>
        {this.renderFieldSelector()}
        {this.renderTileOptions()}
        {this.renderGeoTileOptions()}
        {this.renderLayerOptions()}
        {this.maybeRenderShowLabelsControl()}
        {this.maybeRenderTooltipControls()}
        {this.maybeRenderOpacityControl()}
      </ControlsGroup>
    );
  }
}
