// @flow
import * as React from 'react';

import CheckboxControl from 'components/visualizations/common/controls/CheckboxControl';
import Group from 'components/ui/Group';
import MultipleFieldSelectionControl from 'components/visualizations/common/controls/MultipleFieldSelectionControl';
import ResultLimitControl from 'components/visualizations/common/controls/ResultLimitControl';
import SingleFieldSelectionControl from 'components/visualizations/common/controls/SingleFieldSelectionControl';
import SortOrderControl from 'components/visualizations/common/controls/SortOrderControl';
import type { ControlsBlockProps } from 'components/visualizations/common/types/controlsBlockProps';

type Props = ControlsBlockProps<'HEATTILES'>;

const TXT_CONTROLS = t('query_result.controls');
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
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.useEthiopianDates()}
        label={TXT_CONTROLS.et_checkbox}
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
        onValueChange={onControlsSettingsChange}
        value={controls.firstYaxisSelections()}
        fields={fields}
      />
    );
  }

  maybeRenderResultLimitDropdown(): React.Node {
    const { controls, onControlsSettingsChange, groupBySettings} = this.props;

    if (groupBySettings.hasOnlyDateGrouping()) {
      return null
    }
    return (
      <ResultLimitControl
        controlKey="resultLimit"
        onValueChange={onControlsSettingsChange}
        value={controls.resultLimit()}
        resultLimitOptions={RESULT_LIMIT_OPTIONS}
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
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.selectedField()}
        fields={this.props.fields}
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
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.sortOn()}
        label={TXT_CONTROLS.sort_on}
        fields={this.props.fields}
      />
    );
  }

  renderInvertColorationControl(): React.Node {
    return (
      <CheckboxControl
        controlKey="invertColoration"
        value={this.props.controls.invertColoration()}
        onValueChange={this.props.onControlsSettingsChange}
        label={TXT_CONTROLS.invert_coloration}
      />
    );
  }

  renderLogScalingControl(): React.Node {
    return (
      <CheckboxControl
        controlKey="logScaling"
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.logScaling()}
        label={TXT_CONTROLS.log_checkbox}
      />
    );
  }

  renderDivergentColorationControl(): React.Node {
    return (
      <CheckboxControl
        controlKey="divergentColoration"
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.divergentColoration()}
        label={TXT_CONTROLS.divergent_coloration}
      />
    );
  }

  renderSortOrder(): React.Node {
    return (
      <SortOrderControl
        controlKey="sortOrder"
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.sortOrder()}
        includeAlphabetical
      />
    );
  }

  renderTimeControl(): React.Node {
    return (
      <CheckboxControl
        controlKey="showTimeOnYAxis"
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.showTimeOnYAxis()}
        label={TXT_CONTROLS.value_display_time_checkbox}
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
