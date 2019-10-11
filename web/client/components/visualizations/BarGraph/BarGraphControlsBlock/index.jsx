// @flow
import * as React from 'react';
import moment from 'moment';

import CheckboxControl from 'components/visualizations/common/controls/CheckboxControl';
import ControlsGroup from 'components/visualizations/common/controls/ControlsGroup';
import DropdownControl, {
  Option,
} from 'components/visualizations/common/controls/DropdownControl';
import Field from 'models/core/Field';
import ResultLimitControl from 'components/visualizations/common/controls/ResultLimitControl';
import SingleFieldSelectionControl from 'components/visualizations/common/controls/SingleFieldSelectionControl';
import SortOrderControl from 'components/visualizations/common/controls/SortOrderControl';
import memoizeOne from 'decorators/memoizeOne';
import { DEFAULT_SORT_ORDER } from 'components/QueryResult/graphUtil';
import { DEFAULT_TIME_FORMAT } from 'components/visualizations/BarGraph/util';
import { ProgramAreaLookup } from 'indicator_fields';
import type BarGraphQueryResultData from 'components/visualizations/BarGraph/models/BarGraphQueryResultData';
import type { ControlsBlockProps } from 'components/visualizations/common/commonTypes';
import type { ViewTypeConfig } from 'models/core/QueryResultSpec/VisualizationSettings';

const DEFAULT_RESULT_LIMIT = 50;
const TXT_STACK_BARS = t('query_result.controls.stack_bars');
const TXT_Y2_LINE_GRAPH = t('query_result.controls.y2_line_graph');
const TXT_SORT_ON = t('query_result.controls.sort_on');
const TXT_REMOVE_BAR_SPACING = t('query_result.bar.remove_bar_spacing');
const TXT_DATE_LABEL_FORMAT = t('query_result.bar.date_label_format');
const TXT_ROTATE_X_AXIS_LABELS = t('query_result.bar.rotate_x_axis_labels');
const TXT_ROTATE_DATA_VALUE_LABELS = t(
  'query_result.bar.rotate_data_value_labels',
);
const TXT_HIDE_GRID_LINES = t('query_result.bar.hide_grid_lines');
const TXT_HIDE_DATA_VALUE_ZEROS = t('query_result.bar.hide_data_value_zeros');
const TXT_DEFAULT_DATE_FORMAT = t('query_result.bar.default_time_format');
export const TXT_NO_DATA_TO_ZERO = t('query_result.bar.no_data_to_zero_labels');

const EXAMPLE_DATE = moment('2019-01-05');
const DATE_FORMATS = [
  'YYYY-MM-DD',
  'MMM Do, YYYY',
  'Do MMM, YYYY',
  'MM/DD/YYYY',
  'DD/MM/YYYY',
  'MM/DD',
  'DD/MM',
  'M/D',
  'D/M',
];

const DATE_FORMAT_OPTIONS = [
  <Option key={DEFAULT_TIME_FORMAT} value={DEFAULT_TIME_FORMAT}>
    {TXT_DEFAULT_DATE_FORMAT}
  </Option>,
  ...DATE_FORMATS.map(format => (
    <Option key={format} value={format}>
      {EXAMPLE_DATE.format(format)}
    </Option>
  )),
];

type Props = ControlsBlockProps<'CHART'>;

type Controls = $PropertyType<Props, 'controls'>;

export default class BarGraphControlsBlock extends React.PureComponent<Props> {
  static getDefaultControls(viewTypeConfig: ViewTypeConfig): Controls {
    const { fields } = viewTypeConfig;
    return {
      // TODO(stephen): This should be a ZenMap but dashboard cannot easily
      // serialize / deserialize them when restoring settings.
      disabledFields: {},
      hideDataValueZeros: false,
      hideGridLines: false,
      removeBarSpacing: false,
      rotateXAxisLabels: true,
      rotateDataValueLabels: true,
      resultLimit: DEFAULT_RESULT_LIMIT,
      sortOn: fields[0],
      sortOrder: DEFAULT_SORT_ORDER,
      stackBars: false,
      xTickFormat: DEFAULT_TIME_FORMAT,
      y2LineGraph: false,
      noDataToZero: false,
    };
  }

  getFieldsToSort(): Array<Field> {
    const sortFields = this.props.fields.slice();
    const { queryResult } = this.props;

    if (queryResult.data().length === 0) {
      return sortFields;
    }

    // Check to see if there are any other fields available to sort on
    // TODO(stephen): Should the backend provide this for you? You could
    // imagine wanting to sort a composite indicator by one of its
    // disaggregations
    // TODO(stephen): If this is going to continue being a thing, make a
    // general utility for determining if a backend sort field exists.
    const backendSortFields = ProgramAreaLookup.BACKEND_SORT;
    if (backendSortFields) {
      // Look at the fields provided in the first result to see if
      // they can be used for sorting.
      // HACK(stephen): Abusing the program area lookup to separate out the
      // backend sort IDs
      Object.keys(queryResult.data()[0]).forEach(field => {
        if (backendSortFields[field]) {
          sortFields.push(Field.create(field));
        }
      });
    }
    return sortFields;
  }

  // Get the number of bars displayed in the bar graph
  getNumberOfBars(): number {
    return this.props.queryResult.data().length;
  }

  maybeRenderStackBarsControl() {
    // Only show the stack bar control if more than one field
    // was requested during querying.
    if (this.getNumberOfBars() === 0 || this.props.fields.length < 2) {
      return null;
    }

    return (
      <CheckboxControl
        controlKey="stackBars"
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.stackBars}
        label={TXT_STACK_BARS}
        colsWrapper={6}
        colsLabel={6}
        colsControl={6}
      />
    );
  }

  maybeRenderY2Options() {
    // Only show the y2 options if more than one field was requested during
    // querying.
    if (!this.getNumberOfBars() || this.props.fields.length < 2) {
      return null;
    }

    return (
      <CheckboxControl
        controlKey="y2LineGraph"
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.y2LineGraph}
        label={TXT_Y2_LINE_GRAPH}
      />
    );
  }

  maybeRenderSortOn() {
    const { controls, onControlsSettingsChange } = this.props;
    const sortFields = this.getFieldsToSort();
    if (sortFields.length < 2) {
      return null;
    }

    return (
      <SingleFieldSelectionControl
        controlKey="sortOn"
        onValueChange={onControlsSettingsChange}
        value={controls.sortOn}
        label={TXT_SORT_ON}
        fields={sortFields}
        buttonMinWidth={115}
      />
    );
  }

  maybeRenderResultLimitDropdown() {
    const { onControlsSettingsChange, controls } = this.props;
    const maxResults = this.getNumberOfBars();
    if (maxResults === 1) {
      return null;
    }

    const resultLimitOptions = [20, 50, 100, 250, 500];
    return (
      <ResultLimitControl
        controlKey="resultLimit"
        value={controls.resultLimit}
        onValueChange={onControlsSettingsChange}
        maxResults={maxResults}
        resultLimitOptions={resultLimitOptions}
        colsWrapper={6}
        colsLabel={6}
        colsControl={6}
        buttonMinWidth={115}
        showAllOption
      />
    );
  }

  maybeRenderRemoveBarSpacing() {
    if (
      this.getNumberOfBars() <= 1 ||
      (this.props.fields.length > 1 && !this.props.controls.stackBars)
    ) {
      return null;
    }

    return (
      <CheckboxControl
        controlKey="removeBarSpacing"
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.removeBarSpacing}
        label={TXT_REMOVE_BAR_SPACING}
        colsWrapper={4}
        colsLabel={9}
        colsControl={3}
      />
    );
  }

  // TODO(pablo): eventually we should support formatting for non-date labels
  // too. (e.g. capitalization, percentages, numbers, etc.)
  maybeRenderDateLabelFormat() {
    if (!this.props.queryResult.isDataBucketedByTime()) {
      return null;
    }

    return (
      <DropdownControl
        controlKey="xTickFormat"
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.xTickFormat}
        label={TXT_DATE_LABEL_FORMAT}
        buttonMinWidth={115}
      >
        {DATE_FORMAT_OPTIONS}
      </DropdownControl>
    );
  }

  // $CycloneIdaiHack
  // TODO(pablo): a lot of features were enabled for Mozambique only.
  // Eventually these features should be enabled for all deployments when
  // a proper design process has been gone through.
  maybeRenderMZSettings() {
    if (window.__JSON_FROM_BACKEND.deploymentName === 'mz') {
      return (
        <React.Fragment>
          <ControlsGroup>{this.maybeRenderRemoveBarSpacing()}</ControlsGroup>
          <ControlsGroup>{this.renderHideGridLines()}</ControlsGroup>
          <ControlsGroup>{this.renderRotateXAxisLabels()}</ControlsGroup>
          <ControlsGroup>{this.renderRotateDataValueLabels()}</ControlsGroup>
          <ControlsGroup>{this.renderHideDataValueZeros()}</ControlsGroup>
        </React.Fragment>
      );
    }
    return null;
  }

  maybeRenderNoDataZeroCheckbox() {
    return (
      <CheckboxControl
        controlKey="noDataToZero"
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.noDataToZero}
        label={TXT_NO_DATA_TO_ZERO}
        labelClassName="wrap-label-text"
        colsWrapper={4}
        colsLabel={9}
        colsControl={3}
      />
    );
  }

  maybeRenderSortOrder() {
    // NOTE(yitian): when values are only bucketed/grouped by time, bar graph
    // defaults to sorting by date. Ideally, we want the sort order dropdown to
    // default to `DATE` but there is no clean way to do that right now so we
    // will return null and hide the sort order option in settings.
    if (this.props.queryResult.isDataBucketedByTime()) {
      return null;
    }
    return (
      <SortOrderControl
        controlKey="sortOrder"
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.sortOrder}
        buttonMinWidth={115}
      />
    );
  }

  renderHideGridLines() {
    return (
      <CheckboxControl
        controlKey="hideGridLines"
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.hideGridLines}
        label={TXT_HIDE_GRID_LINES}
        colsWrapper={4}
        colsLabel={9}
        colsControl={3}
      />
    );
  }

  renderRotateXAxisLabels() {
    return (
      <CheckboxControl
        controlKey="rotateXAxisLabels"
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.rotateXAxisLabels}
        label={TXT_ROTATE_X_AXIS_LABELS}
        colsWrapper={4}
        colsLabel={9}
        colsControl={3}
      />
    );
  }

  renderRotateDataValueLabels() {
    // $CycloneIdaiHack
    // TODO(pablo): this should only be visible if the series settings have
    // enabled data value labels to show up. This would mean that the
    // ControlsBlock would need to receive the series settings as a prop.
    return (
      <CheckboxControl
        controlKey="rotateDataValueLabels"
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.rotateDataValueLabels}
        label={TXT_ROTATE_DATA_VALUE_LABELS}
        colsWrapper={4}
        colsLabel={9}
        colsControl={3}
      />
    );
  }

  renderHideDataValueZeros() {
    // $CycloneIdaiHack
    // TODO(pablo): this should only be visible if the series settings have
    // enabled data value labels to show up. This would mean that the
    // ControlsBlock would need to receive the series settings as a prop.
    return (
      <CheckboxControl
        controlKey="hideDataValueZeros"
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.hideDataValueZeros}
        label={TXT_HIDE_DATA_VALUE_ZEROS}
        colsWrapper={4}
        colsLabel={9}
        colsControl={3}
      />
    );
  }

  render() {
    return (
      <div>
        <ControlsGroup>{this.maybeRenderResultLimitDropdown()}</ControlsGroup>
        <ControlsGroup>{this.maybeRenderStackBarsControl()}</ControlsGroup>
        <ControlsGroup>{this.maybeRenderSortOn()}</ControlsGroup>
        <ControlsGroup>{this.maybeRenderSortOrder()}</ControlsGroup>
        <ControlsGroup>{this.maybeRenderDateLabelFormat()}</ControlsGroup>
        <ControlsGroup>{this.maybeRenderY2Options()}</ControlsGroup>
        <ControlsGroup>{this.maybeRenderNoDataZeroCheckbox()}</ControlsGroup>
        {this.maybeRenderMZSettings()}
      </div>
    );
  }
}
