// @flow
import * as React from 'react';

import CheckboxControl from 'components/visualizations/common/controls/CheckboxControl';
import ControlsGroup from 'components/visualizations/common/controls/ControlsGroup';
import DropdownControl, {
  Option,
} from 'components/visualizations/common/controls/DropdownControl';
import ResultLimitControl from 'components/visualizations/common/controls/ResultLimitControl';
import SingleFieldSelectionControl from 'components/visualizations/common/controls/SingleFieldSelectionControl';
import SortOrderControl from 'components/visualizations/common/controls/SortOrderControl';
import { BUCKET_LABELS } from 'components/QueryResult/timeSeriesUtil';
import { DEFAULT_SORT_ORDER } from 'components/QueryResult/graphUtil';
import type { ControlsBlockProps } from 'components/visualizations/common/commonTypes';
import type { ViewTypeConfig } from 'models/core/QueryResultSpec/VisualizationSettings';

type Props = ControlsBlockProps<'TIME'>;

type Controls = $PropertyType<Props, 'controls'>;

const DEFAULT_GEO_LIMIT = 5;
const TXT_CONTROLS = t('query_result.controls');
const TXT_ROTATE_LABELS = t('query_result.time.rotate_labels');
const TXT_DATA_LABELS = t('query_result.time.show_data_labels');

const [DATE_BUCKETS, DEFAULT_GRANULARITY, USE_ET_DATES] = (() => {
  // NOTE(stephen): Need to guard this property access since JSON_FROM_BACKEND
  // is not fully populated on all pages (like /login).
  // TODO(stephen): Figure out why the login page even loads viz code.
  const {
    timeseriesDefaultGranularity = '',
    timeseriesEnabledGranularities = [],
    timeseriesUseEtDates,
  } = window.__JSON_FROM_BACKEND;

  // The frontend references date buckets with all caps which is different from
  // how the backend stores it.
  const dateBuckets = timeseriesEnabledGranularities.map(d => d.toUpperCase());
  const defaultGranularity = timeseriesDefaultGranularity.toUpperCase();
  return [dateBuckets, defaultGranularity, timeseriesUseEtDates];
})();

export default class LineGraphControlsBlock extends React.PureComponent<Props> {
  static getDefaultControls(viewTypeConfig: ViewTypeConfig): Controls {
    const { fields } = viewTypeConfig;
    return {
      bucketMean: false,
      bucketType: DEFAULT_GRANULARITY,
      logScaling: false,
      showDataLabels: false,
      rotateLabels: true,
      resultLimit: DEFAULT_GEO_LIMIT,
      sortOn: fields[0],
      sortOrder: DEFAULT_SORT_ORDER,
      useEthiopianDates: USE_ET_DATES,
    };
  }

  getNumberOfLines(): number {
    return this.props.queryResult.data().length;
  }

  maybeRenderEthiopianDatesControl() {
    if (!USE_ET_DATES) {
      return null;
    }

    return (
      <CheckboxControl
        controlKey="useEthiopianDates"
        value={this.props.controls.useEthiopianDates}
        onValueChange={this.props.onControlsSettingsChange}
        label={TXT_CONTROLS.et_checkbox}
        colsWrapper={4}
        colsLabel={9}
        colsControl={2}
      />
    );
  }

  maybeRenderResultLimitDropdown() {
    const { controls, selections, onControlsSettingsChange } = this.props;
    if (selections.granularity === 'nation') {
      return null;
    }

    const maxResults = this.getNumberOfLines();
    const resultLimitOptions = [1, 5, 10, 20, 50, 100];

    return (
      <ResultLimitControl
        controlKey="resultLimit"
        onValueChange={onControlsSettingsChange}
        value={controls.resultLimit}
        maxResults={maxResults}
        resultLimitOptions={resultLimitOptions}
        buttonMinWidth={115}
      />
    );
  }

  renderBucketAggregationControl() {
    if (this.props.displayAdvancedSettings) {
      return null;
    }

    return (
      <CheckboxControl
        controlKey="bucketMean"
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.bucketMean}
        label={TXT_CONTROLS.time_bucket_mean}
        colsWrapper={4}
        colsLabel={9}
        colsControl={3}
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
        colsWrapper={4}
        colsLabel={9}
        colsControl={3}
      />
    );
  }

  renderSortOn() {
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

  renderSortOrder() {
    return (
      <SortOrderControl
        controlKey="sortOrder"
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.sortOrder}
        includeAlphabetical={false}
        buttonMinWidth={115}
      />
    );
  }

  renderTimeBucketsControl() {
    const options = DATE_BUCKETS.map(btype => (
      <Option key={btype} value={btype}>
        {BUCKET_LABELS[btype]}
      </Option>
    ));

    if (this.props.displayAdvancedSettings) {
      return null;
    }

    return (
      <DropdownControl
        controlKey="bucketType"
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.bucketType}
        label={TXT_CONTROLS.bucket_by_time}
        buttonMinWidth={115}
      >
        {options}
      </DropdownControl>
    );
  }

  renderRotateLabels() {
    return (
      <CheckboxControl
        controlKey="rotateLabels"
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.rotateLabels}
        label={TXT_ROTATE_LABELS}
        colsWrapper={4}
        colsLabel={9}
        colsControl={3}
      />
    );
  }

  renderShowDataLabels() {
    return (
      <CheckboxControl
        controlKey="showDataLabels"
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.showDataLabels}
        label={TXT_DATA_LABELS}
        colsWrapper={4}
        colsLabel={9}
        colsControl={3}
      />
    );
  }

  render() {
    return (
      <div>
        <ControlsGroup>{this.renderSortOn()}</ControlsGroup>
        <ControlsGroup>{this.renderSortOrder()}</ControlsGroup>
        <ControlsGroup>{this.maybeRenderResultLimitDropdown()}</ControlsGroup>
        <ControlsGroup>{this.renderTimeBucketsControl()}</ControlsGroup>
        <ControlsGroup>{this.renderLogScalingControl()}</ControlsGroup>
        <ControlsGroup>{this.renderBucketAggregationControl()}</ControlsGroup>
        <ControlsGroup>{this.maybeRenderEthiopianDatesControl()}</ControlsGroup>
        <ControlsGroup>{this.renderRotateLabels()}</ControlsGroup>
        <ControlsGroup>{this.renderShowDataLabels()}</ControlsGroup>
      </div>
    );
  }
}
