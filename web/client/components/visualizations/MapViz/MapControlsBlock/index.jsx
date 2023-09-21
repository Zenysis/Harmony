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
  MAP_LAYER_OPTIONS,
} from 'components/ui/visualizations/MapCore/defaults';
import { GEO_FIELD_ORDERING } from 'components/visualizations/MapViz/QueryResultLayer/defaults';
import { getFullDimensionName } from 'models/core/wip/Dimension';
import type { ColorPickerValueType } from 'components/visualizations/common/controls/commonTypes';
import type { ControlsBlockProps } from 'components/visualizations/common/types/controlsBlockProps';

type Props = ControlsBlockProps<'MAP'>;

const SHAPE_OUTLINE_WIDTH_OPTIONS = Object.keys(SHAPE_OUTLINE_WIDTHS).map(
  width => (
    <Option key={width} value={width}>
      {SHAPE_OUTLINE_WIDTHS[width]}
    </Option>
  ),
);
const ADMIN_BOUNDARIES_WIDTH_OPTIONS = Object.keys(ADMIN_BOUNDARIES_WIDTHS).map(
  width => (
    <Option key={width} value={width}>
      {ADMIN_BOUNDARIES_WIDTHS[width]}
    </Option>
  ),
);

// Location of GeoJson tiles to load, if they exist for this config
const GEOJSON_TILE_URL = window.__JSON_FROM_BACKEND.mapOverlayGeoJson;
const DEPLOYMENT_NAME = window.__JSON_FROM_BACKEND.deploymentName;

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

  // NOTE: Opacity of shapes should be controlled through a slider not
  // an input. We also shouldn't be passing a callback that is generated every
  // time and should instead bind a function. And we shouldn't rebuild the
  // option list every time. Just wanted to keep everything in a single method.
  // $CycloneIdaiHack
  maybeRenderOpacityControl(): React.Node {
    return null;
  }

  // TODO: We've removed the font family control for now because
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
      tooltipFontColor,
      tooltipFontSize,
    } = this.props.controls.modelValues();

    // TODO: The tooltip background color is a frustrating
    // property. We set the opacity separately from the primary color. However,
    // we have to ensure that one does not override the unchanged parts of the
    // other (i.e. setting background color does not override the opacity set).
    // On top of this, we have to keep everything split out as an RGBA object.
    // NOTE: Throwing this conversion in to workaround issues where
    // a few users have a string value cached here. This should be removed after
    // 2020-02-01.
    const tooltipBackgroundPrimaryColor = {
      ...maybeConvertColorValue(tooltipBackgroundColor),
      a: undefined,
    };

    return (
      <Group.Vertical className="map-label-settings" padding="l" spacing="l">
        <MapLabelSelectionControl
          onValueChange={this.props.onControlsSettingsChange}
          selectedLabelsToDisplay={this.props.controls.selectedLabelsToDisplay()}
          seriesSettings={this.props.seriesSettings}
        />
        <div className="map-label-settings__font-settings">
          <FontSizeControl
            buttonMinWidth={115}
            controlKey="tooltipFontSize"
            label={I18N.text('Font Size')}
            maxFontSize={32}
            minFontSize={8}
            onValueChange={this.props.onControlsSettingsChange}
            value={tooltipFontSize}
          />
          <ColorControl
            controlKey="tooltipFontColor"
            enableNoColor={false}
            label={I18N.text('Font Color')}
            onValueChange={this.props.onControlsSettingsChange}
            value={tooltipFontColor}
          />
          <ColorControl
            controlKey="tooltipBackgroundColor"
            enableNoColor={false}
            includeTransparent
            label={I18N.textById('Background color')}
            onValueChange={this.onTooltipBackgroundPrimaryColorChange}
            value={tooltipBackgroundPrimaryColor}
          />
          <CheckboxControl
            controlKey="tooltipBold"
            label={I18N.text('Bold Text')}
            onValueChange={this.props.onControlsSettingsChange}
            value={this.props.controls.tooltipBold()}
          />
          <BackgroundOpacityControl
            controlKey="tooltipBackgroundColor"
            includeTransparent
            label={I18N.text('Background opacity')}
            onValueChange={this.onTooltipBackgroundOpacityChange}
            value={tooltipBackgroundColor}
          />
        </div>
      </Group.Vertical>
    );
  }

  maybeRenderShowLabelsControl(): React.Node {
    return (
      <CheckboxControl
        controlKey="showLabels"
        label={I18N.text('Display Map Labels', 'displayMapLabels')}
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.showLabels()}
      />
    );
  }

  maybeRenderAdminBoundaryControl(): React.Node {
    if (!GEOJSON_TILE_URL || GEOJSON_TILE_URL.length === 0) {
      return null;
    }
    const { controls, onControlsSettingsChange } = this.props;

    // NOTE: To avoid introducing a new config variable right now, use
    // the GEO_FIELD_ORDERING constant to determine the possible admin
    // boundaries that can be displayed. Exclude the most granular geo dimension
    // since it is normally too granular to be included in a shapefile.
    // TODO: Find a better way to determine this once different sites
    // start using the admin boundaries option. Previously, ET was the only
    // site where it was supported before the map was refactored to use
    // MapboxGL.
    const geoTileOptions = GEO_FIELD_ORDERING.slice(0, -1).map(dimension => (
      <Option key={dimension} value={dimension}>
        {getFullDimensionName(dimension)}
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
          label={I18N.text(
            'Show administrative boundaries',
            'showAdminBoundaries',
          )}
          onValueChange={onControlsSettingsChange}
          value={showAdminBoundaries}
        />
        {showAdminBoundaries && (
          <Group.Item className="map-admin-boundary-settings" padding="l">
            <DropdownControl
              buttonMinWidth={115}
              controlKey="selectedGeoTiles"
              label={I18N.text('Level')}
              onValueChange={onControlsSettingsChange}
              value={controls.selectedGeoTiles()}
            >
              {geoTileOptions}
            </DropdownControl>
            <DropdownControl
              buttonMinWidth={115}
              controlKey="adminBoundariesWidth"
              label={I18N.text('Boundary Thickness')}
              menuWidth="auto"
              onValueChange={onControlsSettingsChange}
              value={controls.adminBoundariesWidth()}
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
            direction="vertical"
            onChange={val =>
              onPlaybackSettingsChange(playbackSettings.playbackSpeed(val))
            }
            value={playbackSettings.playbackSpeed()}
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
      <Option value="tiles">
        <I18N>Colored tiles</I18N>
      </Option>
    );

    const showShapeWidthControl = currentDisplay === 'tiles';
    return (
      <Group.Vertical spacing="l">
        <DropdownControl
          buttonMinWidth={115}
          controlKey="currentDisplay"
          label={I18N.text('Display')}
          menuWidth="auto"
          onValueChange={onControlsSettingsChange}
          value={currentDisplay}
        >
          <Option value="dots">
            <I18N>Dots</I18N>
          </Option>
          <Option value="scaled-dots">
            <I18N>Scaled dots</I18N>
          </Option>
          <Option value="heatmap">
            <I18N.Ref id="Heatmap" />
          </Option>
          {GEOJSON_TILE_URL ? tileOption : null}
        </DropdownControl>
        {showShapeWidthControl && (
          <DropdownControl
            buttonMinWidth={115}
            controlKey="shapeOutlineWidth"
            label={I18N.textById('Boundary Thickness')}
            menuWidth="auto"
            onValueChange={onControlsSettingsChange}
            value={controls.shapeOutlineWidth()}
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
    const layerOptions = Object.keys(MAP_LAYER_OPTIONS).map(layer => (
      <Option key={layer} value={layer}>
        {MAP_LAYER_OPTIONS[layer]}
      </Option>
    ));

    return (
      <DropdownControl
        buttonMinWidth={115}
        controlKey="baseLayer"
        label="Layer Options"
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.baseLayer()}
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
