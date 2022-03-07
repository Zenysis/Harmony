// @flow
import * as React from 'react';

import BackgroundOpacityControl from 'components/visualizations/common/controls/BackgroundOpacityControl';
import Checkbox from 'components/ui/Checkbox';
import CheckboxControl from 'components/visualizations/common/controls/CheckboxControl';
import ColorControl from 'components/visualizations/common/controls/ColorControl';
import DropdownControl, {
  Option,
} from 'components/visualizations/common/controls/DropdownControl';
import FontSizeControl from 'components/visualizations/common/controls/FontSizeControl';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import MapLabelSelectionControl from 'components/visualizations/MapViz/MapControlsBlock/MapLabelSelectionControl';
import RadioGroup from 'components/ui/RadioGroup';
import SingleFieldSelectionControl from 'components/visualizations/common/controls/SingleFieldSelectionControl';
import ToggleSwitch from 'components/ui/ToggleSwitch';
import autobind from 'decorators/autobind';
import maybeConvertColorValue from 'components/visualizations/MapViz/MapControlsBlock/maybeConvertColorValue';
import {
  ADMIN_BOUNDARIES_WIDTHS,
  SHAPE_OUTLINE_WIDTHS,
} from 'components/ui/visualizations/MapCore/defaults';
import { GEO_FIELD_ORDERING } from 'components/visualizations/MapViz/QueryResultLayer/defaults';
import type { ColorPickerValueType } from 'components/visualizations/common/controls/commonTypes';
import type { ControlsBlockProps } from 'components/visualizations/common/types/controlsBlockProps';

type Props = ControlsBlockProps<'MAP'>;

const TXT_CONTROLS = t('query_result.controls');
const TXT_MAP = t('query_result.map');
const DIMENSION_TEXT = t('select_filter');
const SHAPE_OUTLINE_WIDTH_OPTIONS = SHAPE_OUTLINE_WIDTHS.map(width => (
  <Option value={width} key={width}>
    {TXT_MAP.shapeOutlineWidthOptions[width]}
  </Option>
));
const ADMIN_BOUNDARIES_WIDTH_OPTIONS = ADMIN_BOUNDARIES_WIDTHS.map(width => (
  <Option value={width} key={width}>
    {TXT_MAP.shapeOutlineWidthOptions[width]}
  </Option>
));

// Location of GeoJson tiles to load, if they exist for this config
const GEOJSON_TILE_URL = window.__JSON_FROM_BACKEND.mapOverlayGeoJson;

export default class MapControlsBlock extends React.PureComponent<Props> {
  // When the primary color of the tooltip background is changed through the
  // FontColorControl ColorBlock, we need to preserve the opacity that is set
  // separately but held in the same structure.
  @autobind
  onTooltipBackgroundPrimaryColorChange(
    controlKey: string,
    newColor: ColorPickerValueType,
  ) {
    const { controls, onControlsSettingsChange } = this.props;
    const tooltipBackgroundColor = controls.tooltipBackgroundColor();
    onControlsSettingsChange(controlKey, {
      ...maybeConvertColorValue(newColor),
      a: tooltipBackgroundColor.a,
    });
  }

  // When the opacity of the tooltip background is changed through the
  // BackgroundOpacityControl, we need to preserve the primary color that is set
  // separately but held in the same structure.
  @autobind
  onTooltipBackgroundOpacityChange(
    controlKey: string,
    newColor: ColorPickerValueType,
  ) {
    const { controls, onControlsSettingsChange } = this.props;
    const tooltipBackgroundColor = controls.tooltipBackgroundColor();
    onControlsSettingsChange(controlKey, {
      ...tooltipBackgroundColor,
      a: maybeConvertColorValue(newColor).a,
    });
  }

  maybeRenderOpacityControl(): React.Node {
    return null;
  }

  // TODO(nina): We've removed the font family control for now because
  // it does not correctly update labels on the map. This is a problem with
  // mapbox gl specifically, where we are currently unable to customize fonts
  // when rendering images (which is how we render these labels). We need
  // to look into how to properly update the control before bringing it back
  maybeRenderTooltipControls(): React.Node {
    if (!this.props.controls.showLabels()) {
      return null;
    }
    const {
      tooltipBackgroundColor,
      tooltipFontSize,
      tooltipFontColor,
    } = this.props.controls.modelValues();

    // TODO(stephen, anyone): The tooltip background color is a frustrating
    // property. We set the opacity separately from the primary color. However,
    // we have to ensure that one does not override the unchanged parts of the
    // other (i.e. setting background color does not override the opacity set).
    // On top of this, we have to keep everything split out as an RGBA object.
    // NOTE(stephen): Throwing this conversion in to workaround issues where
    // a few users have a string value cached here. This should be removed after
    // 2020-02-01.
    const tooltipBackgroundPrimaryColor = {
      ...maybeConvertColorValue(tooltipBackgroundColor),
      a: undefined,
    };

    return (
      <Group.Vertical padding="l" className="map-label-settings" spacing="l">
        <MapLabelSelectionControl
          selectedLabelsToDisplay={this.props.controls.selectedLabelsToDisplay()}
          onValueChange={this.props.onControlsSettingsChange}
          seriesSettings={this.props.seriesSettings}
        />
        <div className="map-label-settings__font-settings">
          <FontSizeControl
            controlKey="tooltipFontSize"
            onValueChange={this.props.onControlsSettingsChange}
            value={tooltipFontSize}
            label={TXT_MAP.tooltips.font_size}
            buttonMinWidth={115}
            minFontSize={8}
            maxFontSize={32}
          />
          <ColorControl
            controlKey="tooltipFontColor"
            enableNoColor={false}
            value={tooltipFontColor}
            onValueChange={this.props.onControlsSettingsChange}
            label={TXT_MAP.tooltips.font_color}
          />
          <ColorControl
            controlKey="tooltipBackgroundColor"
            enableNoColor={false}
            value={tooltipBackgroundPrimaryColor}
            onValueChange={this.onTooltipBackgroundPrimaryColorChange}
            label={TXT_MAP.tooltips.background_color}
            includeTransparent
          />
          <CheckboxControl
            controlKey="tooltipBold"
            onValueChange={this.props.onControlsSettingsChange}
            value={this.props.controls.tooltipBold()}
            label={TXT_MAP.tooltips.bold}
          />
          <BackgroundOpacityControl
            controlKey="tooltipBackgroundColor"
            value={tooltipBackgroundColor}
            onValueChange={this.onTooltipBackgroundOpacityChange}
            label={TXT_MAP.tooltips.background_opacity}
            includeTransparent
          />
        </div>
      </Group.Vertical>
    );
  }

  maybeRenderShowLabelsControl(): React.Node {
    return (
      <CheckboxControl
        controlKey="showLabels"
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.showLabels()}
        label={TXT_MAP.show_labels}
      />
    );
  }

  maybeRenderAdminBoundaryControl(): React.Node {
    if (!GEOJSON_TILE_URL || GEOJSON_TILE_URL.length === 0) {
      return null;
    }
    const { controls, onControlsSettingsChange } = this.props;

    // HACK(stephen): To avoid introducing a new config variable right now, use
    // the GEO_FIELD_ORDERING constant to determine the possible admin
    // boundaries that can be displayed. Exclude the most granular geo dimension
    // since it is normally too granular to be included in a shapefile.
    // TODO(stephen): Find a better way to determine this once different sites
    // start using the admin boundaries option. Previously, ET was the only
    // site where it was supported before the map was refactored to use
    // MapboxGL.
    const geoTileOptions = GEO_FIELD_ORDERING.slice(0, -1).map(dimension => (
      <Option value={dimension} key={dimension}>
        {DIMENSION_TEXT[dimension] || dimension}
      </Option>
    ));
    if (geoTileOptions.length === 0) {
      return null;
    }

    const showAdminBoundaries = controls.showAdminBoundaries();
    return (
      <Group.Vertical spacing="l">
        <CheckboxControl
          controlKey="showAdminBoundaries"
          label={TXT_MAP.showAdminBoundaries}
          onValueChange={onControlsSettingsChange}
          value={showAdminBoundaries}
        />
        {showAdminBoundaries && (
          <Group.Item className="map-admin-boundary-settings" padding="l">
            <DropdownControl
              buttonMinWidth={115}
              controlKey="selectedGeoTiles"
              label={TXT_MAP.adminBoundaryLevel}
              onValueChange={onControlsSettingsChange}
              value={controls.selectedGeoTiles()}
            >
              {geoTileOptions}
            </DropdownControl>
            <DropdownControl
              controlKey="adminBoundariesWidth"
              label={TXT_MAP.boundaryThickness}
              onValueChange={onControlsSettingsChange}
              value={controls.adminBoundariesWidth()}
              buttonMinWidth={115}
              menuWidth="auto"
            >
              {ADMIN_BOUNDARIES_WIDTH_OPTIONS}
            </DropdownControl>
          </Group.Item>
        )}
      </Group.Vertical>
    );
  }

  maybeRenderPlaybackSettings(): React.Node {
    const { controls, groupBySettings, onControlsSettingsChange } = this.props;

    const dateGrouping = groupBySettings
      .groupings()
      .values()
      .find(grouping => grouping.type() === 'DATE');

    if (!dateGrouping) {
      return null;
    }

    const playbackSettings = controls.playbackSettings();
    const onPlaybackSettingsChange = newPlaybackSettings =>
      onControlsSettingsChange('playbackSettings', newPlaybackSettings);

    return (
      <Group.Vertical spacing="l">
        <Checkbox
          className="settings-modal__control-label"
          label={I18N.text('Start animation from most recent date')}
          onChange={val =>
            onPlaybackSettingsChange(
              playbackSettings.startFromMostRecentDate(val),
            )
          }
          value={playbackSettings.startFromMostRecentDate()}
        />
        <Group.Vertical>
          <span className="settings-modal__control-label">
            {I18N.textById('Playback speed')}
          </span>
          <RadioGroup
            value={playbackSettings.playbackSpeed()}
            onChange={val =>
              onPlaybackSettingsChange(playbackSettings.playbackSpeed(val))
            }
            direction="vertical"
          >
            <RadioGroup.Item value="quarter">0.25</RadioGroup.Item>
            <RadioGroup.Item value="half">0.5</RadioGroup.Item>
            <RadioGroup.Item value="normal">
              {I18N.textById('Normal')}
            </RadioGroup.Item>
            <RadioGroup.Item value="double">2</RadioGroup.Item>
            <RadioGroup.Item value="quadruple">4</RadioGroup.Item>
          </RadioGroup>
        </Group.Vertical>
        <Group.Vertical>
          <span className="settings-modal__control-label">
            {I18N.textById('Playback direction')}
          </span>
          <ToggleSwitch
            displayLabels="right"
            label={I18N.textById('Play in reverse')}
            onChange={() =>
              onPlaybackSettingsChange(
                playbackSettings.reversePlayback(
                  !playbackSettings.reversePlayback(),
                ),
              )
            }
            value={playbackSettings.reversePlayback()}
          />
        </Group.Vertical>
      </Group.Vertical>
    );
  }

  renderTileOptions(): React.Node {
    const { controls, onControlsSettingsChange } = this.props;
    const currentDisplay = controls.currentDisplay();
    const tileOption = (
      <Option value="tiles">{TXT_MAP.display_option_tiles}</Option>
    );

    const showShapeWidthControl = currentDisplay === 'tiles';
    return (
      <Group.Vertical spacing="l">
        <DropdownControl
          onValueChange={onControlsSettingsChange}
          value={currentDisplay}
          controlKey="currentDisplay"
          label={TXT_CONTROLS.display_title}
          buttonMinWidth={115}
          menuWidth="auto"
        >
          <Option value="dots">{TXT_MAP.display_option_dots}</Option>
          <Option value="scaled-dots">
            {TXT_MAP.display_option_scaled_dots}
          </Option>
          <Option value="heatmap">{TXT_MAP.display_option_heatmap}</Option>
          {GEOJSON_TILE_URL ? tileOption : null}
        </DropdownControl>
        {showShapeWidthControl && (
          <DropdownControl
            onValueChange={onControlsSettingsChange}
            value={controls.shapeOutlineWidth()}
            controlKey="shapeOutlineWidth"
            label={TXT_MAP.boundaryThickness}
            buttonMinWidth={115}
            menuWidth="auto"
          >
            {SHAPE_OUTLINE_WIDTH_OPTIONS}
          </DropdownControl>
        )}
      </Group.Vertical>
    );
  }

  renderFieldSelector(): React.Node {
    return (
      <SingleFieldSelectionControl
        buttonMinWidth={115}
        controlKey="selectedField"
        fields={this.props.fields}
        onValueChange={this.props.onControlsSettingsChange}
        seriesSettings={this.props.seriesSettings}
        value={this.props.controls.selectedField()}
      />
    );
  }

  renderLayerOptions(): React.Node {
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
        value={this.props.controls.baseLayer()}
        label="Layer Options"
        buttonMinWidth={115}
      >
        {layerOptions}
      </DropdownControl>
    );
  }

  render(): React.Node {
    return (
      <Group.Vertical spacing="l">
        {this.maybeRenderPlaybackSettings()}
        {this.renderFieldSelector()}
        {this.renderTileOptions()}
        {this.maybeRenderAdminBoundaryControl()}
        {this.renderLayerOptions()}
        {this.maybeRenderShowLabelsControl()}
        {this.maybeRenderTooltipControls()}
        {this.maybeRenderOpacityControl()}
      </Group.Vertical>
    );
  }
}
