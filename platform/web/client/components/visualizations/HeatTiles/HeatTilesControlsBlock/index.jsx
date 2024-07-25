// @flow
import * as React from 'react';

import CheckboxControl from 'components/visualizations/common/controls/CheckboxControl';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import MultipleFieldSelectionControl from 'components/visualizations/common/controls/MultipleFieldSelectionControl';
import ResultLimitControl from 'components/visualizations/common/controls/ResultLimitControl';
import SingleFieldSelectionControl from 'components/visualizations/common/controls/SingleFieldSelectionControl';
import SortOrderControl from 'components/visualizations/common/controls/SortOrderControl';
import type { ControlsBlockProps } from 'components/visualizations/common/types/controlsBlockProps';

type Props = ControlsBlockProps<'HEATTILES'>;

const RESULT_LIMIT_OPTIONS = [20, 50, 100, 250, 500];
export default class HeatTilesControlsBlock extends React.PureComponent<Props> {
  maybeRenderEthiopianDatesControl(): React.Node {
    if (
      !window.__JSON_FROM_BACKEND.timeseriesUseEtDates ||
      !this.props.controls.showTimeOnYAxis()
    ) {
      return null;
    }

    return (
      <CheckboxControl
        controlKey="useEthiopianDates"
        label={I18N.textById('showEthiopianDates')}
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.useEthiopianDates()}
      />
    );
  }

  maybeRenderFieldOptions(): React.Node {
    const { controls, fields, onControlsSettingsChange } = this.props;
    if (controls.showTimeOnYAxis() || fields.length <= 1) {
      return null;
    }

    return (
      <MultipleFieldSelectionControl
        controlKey="firstYaxisSelections"
        fields={fields}
        onValueChange={onControlsSettingsChange}
        value={controls.firstYaxisSelections()}
      />
    );
  }

  maybeRenderResultLimitDropdown(): React.Node {
    const { controls, groupBySettings, onControlsSettingsChange } = this.props;

    if (groupBySettings.hasOnlyDateGrouping()) {
      return null;
    }
    return (
      <ResultLimitControl
        controlKey="resultLimit"
        onValueChange={onControlsSettingsChange}
        resultLimitOptions={RESULT_LIMIT_OPTIONS}
        value={controls.resultLimit()}
      />
    );
  }

  maybeRenderSelectedField(): React.Node {
    if (!this.props.controls.showTimeOnYAxis()) {
      return null;
    }

    return (
      <SingleFieldSelectionControl
        controlKey="selectedField"
        fields={this.props.fields}
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.selectedField()}
      />
    );
  }

  maybeRenderSortOn(): React.Node {
    if (this.props.controls.showTimeOnYAxis()) {
      return null;
    }

    return (
      <SingleFieldSelectionControl
        controlKey="sortOn"
        fields={this.props.fields}
        label={I18N.textById('Sort by')}
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.sortOn()}
      />
    );
  }

  renderInvertColorationControl(): React.Node {
    return (
      <CheckboxControl
        controlKey="invertColoration"
        label={I18N.text('Invert Coloration')}
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.invertColoration()}
      />
    );
  }

  renderLogScalingControl(): React.Node {
    return (
      <CheckboxControl
        controlKey="logScaling"
        label={I18N.text('Logarithmic Scaling')}
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.logScaling()}
      />
    );
  }

  renderDivergentColorationControl(): React.Node {
    return (
      <CheckboxControl
        controlKey="divergentColoration"
        label={I18N.text('Divergent Coloration')}
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.divergentColoration()}
      />
    );
  }

  renderSortOrder(): React.Node {
    return (
      <SortOrderControl
        controlKey="sortOrder"
        includeAlphabetical
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.sortOrder()}
      />
    );
  }

  renderTimeControl(): React.Node {
    return (
      <CheckboxControl
        controlKey="showTimeOnYAxis"
        label={I18N.text('Show Time on Y-Axis', 'timeOnYAxis')}
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.showTimeOnYAxis()}
      />
    );
  }

  render(): React.Node {
    return (
      <Group.Vertical spacing="l">
        {this.maybeRenderSelectedField()}
        {this.maybeRenderFieldOptions()}
        {this.maybeRenderSortOn()}
        {this.renderSortOrder()}
        {this.maybeRenderResultLimitDropdown()}
        {this.renderTimeControl()}
        {this.maybeRenderEthiopianDatesControl()}
        {this.renderLogScalingControl()}
        {this.renderInvertColorationControl()}
        {this.renderDivergentColorationControl()}
      </Group.Vertical>
    );
  }
}
