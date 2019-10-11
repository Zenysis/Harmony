// @flow
import * as React from 'react';

import CheckboxControl from 'components/visualizations/common/controls/CheckboxControl';
import ControlsGroup from 'components/visualizations/common/controls/ControlsGroup';
import MultipleFieldSelectionControl from 'components/visualizations/common/controls/MultipleFieldSelectionControl';
import ResultLimitControl from 'components/visualizations/common/controls/ResultLimitControl';
import SingleFieldSelectionControl from 'components/visualizations/common/controls/SingleFieldSelectionControl';
import SortOrderControl from 'components/visualizations/common/controls/SortOrderControl';
import { SORT_DESCENDING } from 'components/QueryResult/graphUtil';
import type { ControlsBlockProps } from 'components/visualizations/common/commonTypes';
import type { ViewTypeConfig } from 'models/core/QueryResultSpec/VisualizationSettings';

type Props = ControlsBlockProps<'HEATTILES'>;
type Controls = $PropertyType<Props, 'controls'>;

const DEFAULT_RESULT_LIMIT = 100;
const TXT_CONTROLS = t('query_result.controls');

export default class HeatTilesControlsBlock extends React.PureComponent<Props> {
  static getDefaultControls(viewTypeConfig: ViewTypeConfig): Controls {
    const { fields } = viewTypeConfig;
    return {
      showTimeOnYAxis: true,
      logScaling: true,
      sortOn: fields[0],
      selectedField: fields[0],
      resultLimit: DEFAULT_RESULT_LIMIT,
      sortOrder: SORT_DESCENDING,
      firstYaxisSelections: fields,
      useEthiopianDates: false,
      invertColoration: false,
      divergentColoration: true,
    };
  }

  maybeRenderEthiopianDatesControl() {
    if (
      !window.__JSON_FROM_BACKEND.timeseriesUseEtDates ||
      !this.props.controls.showTimeOnYAxis
    ) {
      return null;
    }

    return (
      <CheckboxControl
        controlKey="useEthiopianDates"
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.useEthiopianDates}
        label={TXT_CONTROLS.et_checkbox}
        colsLabel={3}
        colsControl={9}
      />
    );
  }

  maybeRenderFieldOptions() {
    const { controls, fields, onControlsSettingsChange } = this.props;
    if (controls.showTimeOnYAxis || fields.length <= 1) {
      return null;
    }

    return (
      <MultipleFieldSelectionControl
        controlKey="firstYaxisSelections"
        onValueChange={onControlsSettingsChange}
        value={controls.firstYaxisSelections}
        fields={fields}
      />
    );
  }

  maybeRenderResultLimitDropdown() {
    const {
      controls,
      selections,
      onControlsSettingsChange,
      queryResult,
    } = this.props;
    if (selections.granularity === 'nation') {
      return null;
    }

    const resultLimitOptions = [20, 50, 100, 250, 500];
    return (
      <ResultLimitControl
        controlKey="resultLimit"
        onValueChange={onControlsSettingsChange}
        value={controls.resultLimit}
        maxResults={queryResult.data().length}
        resultLimitOptions={resultLimitOptions}
      />
    );
  }

  maybeRenderSelectedField() {
    if (!this.props.controls.showTimeOnYAxis) {
      return null;
    }

    return (
      <SingleFieldSelectionControl
        controlKey="selectedField"
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.selectedField}
        fields={this.props.fields}
      />
    );
  }

  maybeRenderSortOn() {
    if (this.props.controls.showTimeOnYAxis) {
      return null;
    }

    return (
      <SingleFieldSelectionControl
        controlKey="sortOn"
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.sortOn}
        label={TXT_CONTROLS.sort_on}
        fields={this.props.fields}
      />
    );
  }

  renderInvertColorationControl() {
    return (
      <CheckboxControl
        controlKey="invertColoration"
        value={this.props.controls.invertColoration}
        onValueChange={this.props.onControlsSettingsChange}
        label={TXT_CONTROLS.invert_coloration}
        colsLabel={3}
        colsControl={9}
      />
    );
  }

  renderLogScalingControl() {
    return (
      <CheckboxControl
        controlKey="logScaling"
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.logScaling}
        label={TXT_CONTROLS.log_checkbox}
        colsLabel={3}
        colsControl={9}
      />
    );
  }

  renderDivergentColorationControl() {
    return (
      <CheckboxControl
        controlKey="divergentColoration"
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.divergentColoration}
        label={TXT_CONTROLS.divergent_coloration}
        colsLabel={3}
        colsControl={9}
      />
    );
  }

  renderSortOrder() {
    return (
      <SortOrderControl
        controlKey="sortOrder"
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.sortOrder}
        includeAlphabetical
      />
    );
  }

  renderTimeControl() {
    return (
      <CheckboxControl
        controlKey="showTimeOnYAxis"
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.showTimeOnYAxis}
        label={TXT_CONTROLS.value_display_time_checkbox}
        colsLabel={3}
        colsControl={9}
      />
    );
  }

  render() {
    return (
      <div>
        <ControlsGroup>
          {this.maybeRenderSelectedField()}
          {this.maybeRenderFieldOptions()}
          {this.maybeRenderSortOn()}
          {this.renderSortOrder()}
          {this.maybeRenderResultLimitDropdown()}
        </ControlsGroup>
        <ControlsGroup>
          {this.renderTimeControl()}
          {this.maybeRenderEthiopianDatesControl()}
          {this.renderLogScalingControl()}
          {this.renderInvertColorationControl()}
          {this.renderDivergentColorationControl()}
        </ControlsGroup>
      </div>
    );
  }
}
