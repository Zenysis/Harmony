// @flow
import * as React from 'react';

import ColorControl from 'components/visualizations/common/controls/ColorControl';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import InputControl from 'components/visualizations/common/controls/InputControl';
import MultipleFieldSelectionControl from 'components/visualizations/common/controls/MultipleFieldSelectionControl';
import PivotedDimensionsControl from 'components/visualizations/common/controls/PivotedDimensionsControl';
import RadioControl from 'components/visualizations/common/controls/RadioControl';
import RadioGroup from 'components/ui/RadioGroup';
import ToggleSwitchControl from 'components/visualizations/common/controls/ToggleSwitchControl';
import type { ControlsBlockProps } from 'components/visualizations/common/types/controlsBlockProps';

type Props = ControlsBlockProps<'TABLE'>;
const DEPLOYMENT = window.__JSON_FROM_BACKEND.deploymentName;

// NOTE: Hiding Min and Max column inputs to finalize on their treatment
const DISPLAY_MIN_MAX_INPUTS = false;

export default class TableControlsBlock extends React.PureComponent<Props> {
  maybeRenderInvertedIndicatorsDropdown(): React.Node {
    const { controls, fields, onControlsSettingsChange } = this.props;
    if (controls.tableFormat() !== 'scorecard') {
      return null;
    }

    return (
      <MultipleFieldSelectionControl
        controlKey="invertedFields"
        fields={fields}
        label={I18N.text('Invert coloration')}
        onValueChange={onControlsSettingsChange}
        value={controls.invertedFields()}
      />
    );
  }

  // $CycloneIdaiHack
  maybeRenderTotalRowToggle(): React.Node {
    return null;
  }

  maybeRenderAlternateBackgroundControl(section: string): React.Node {
    if (section !== 'row') {
      return null;
    }

    const alternateBackgroundControl = 'AlternateBackground';
    return (
      <ColorControl
        controlKey={`${section}${alternateBackgroundControl}`}
        enableNoColor={false}
        label={I18N.text('Alternating Background Color')}
        labelClassName="wrap-label-text"
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls[`${section}${alternateBackgroundControl}`]()}
      />
    );
  }

  maybeRenderMaxColumnWidthInput(): React.Node {
    const { controls, onControlsSettingsChange } = this.props;
    if (!DISPLAY_MIN_MAX_INPUTS) {
      return null;
    }

    if (controls.fitWidth()) {
      return null;
    }

    return (
      <InputControl
        controlKey="maxColumnWidth"
        initialValue={controls.maxColumnWidth()}
        label={I18N.text('Maximum Column Width')}
        onValueChange={onControlsSettingsChange}
        type="number"
      />
    );
  }

  maybeRenderMinColumnWidthInput(): React.Node {
    const { controls, onControlsSettingsChange } = this.props;
    if (!DISPLAY_MIN_MAX_INPUTS) {
      return null;
    }

    if (controls.fitWidth()) {
      return null;
    }

    return (
      <InputControl
        controlKey="minColumnWidth"
        initialValue={controls.minColumnWidth()}
        label={I18N.text('Minimum Column Width')}
        onValueChange={onControlsSettingsChange}
        type="number"
      />
    );
  }

  renderEnableAutoExpandToggle(): React.Node {
    return (
      <ToggleSwitchControl
        controlKey="enableAutoExpand"
        label={I18N.text('Auto-expand tile to display all rows on dashboards')}
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.enableAutoExpand()}
      />
    );
  }

  renderFitWidthToggle(): React.Node {
    const { controls, onControlsSettingsChange } = this.props;
    return (
      <ToggleSwitchControl
        controlKey="fitWidth"
        label={I18N.text('Fit Width')}
        onValueChange={onControlsSettingsChange}
        value={controls.fitWidth()}
      />
    );
  }

  renderMergeCellsToggle(): React.Node {
    const { controls, onControlsSettingsChange } = this.props;

    return (
      <ToggleSwitchControl
        controlKey="mergeTableCells"
        label={I18N.text('Merge Table Cells')}
        onValueChange={onControlsSettingsChange}
        value={controls.mergeTableCells()}
      />
    );
  }

  renderWrapColumnTitlesToggle(): React.Node {
    const { controls, onControlsSettingsChange } = this.props;
    return (
      <ToggleSwitchControl
        controlKey="wrapColumnTitles"
        label={I18N.text('Wrap Column Titles')}
        onValueChange={onControlsSettingsChange}
        value={controls.wrapColumnTitles()}
      />
    );
  }

  renderTableFormatSelector(): React.Node {
    return (
      <RadioControl
        controlKey="tableFormat"
        label={I18N.text('Table type')}
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.tableFormat()}
      >
        <RadioGroup.Item value="table">
          {I18N.textById('Table')}
        </RadioGroup.Item>
        <RadioGroup.Item value="scorecard">
          {I18N.textById('Scorecard')}
        </RadioGroup.Item>
      </RadioControl>
    );
  }

  renderPaginationToggle(): React.Node {
    return (
      <ToggleSwitchControl
        activated={!this.props.controls.enableAutoExpand()}
        controlKey="enablePagination"
        label={I18N.text('Paginate results')}
        onValueChange={(controlKey, value) => {
          this.props.onControlsSettingsChange(
            controlKey,
            !this.props.controls.enableAutoExpand() && value,
          );
        }}
        value={this.props.controls.enablePagination()}
      />
    );
  }

  renderPivotedDimensionControl(): React.Node {
    const {
      controls,
      groupBySettings,
      isUsingCustomTheme,
      setDefaultTheme,
    } = this.props;
    const dimensions = groupBySettings.groupings().values();
    return (
      <PivotedDimensionsControl
        controlKey="pivotedDimensions"
        dimensions={dimensions}
        isUsingCustomTheme={isUsingCustomTheme}
        label={I18N.text('Pivot Table By')}
        onValueChange={this.props.onControlsSettingsChange}
        setDefaultTheme={setDefaultTheme}
        value={controls.pivotedDimensions()}
      />
    );
  }

  render(): React.Node {
    return (
      <Group.Vertical spacing="l">
        {this.renderTableFormatSelector()}
        {this.maybeRenderInvertedIndicatorsDropdown()}
        {this.renderPaginationToggle()}
        {this.renderEnableAutoExpandToggle()}
        {this.renderFitWidthToggle()}
        {this.renderWrapColumnTitlesToggle()}
        {this.renderMergeCellsToggle()}
        {this.maybeRenderMinColumnWidthInput()}
        {this.maybeRenderMaxColumnWidthInput()}
        {this.maybeRenderTotalRowToggle()}
        {this.renderPivotedDimensionControl()}
      </Group.Vertical>
    );
  }
}
