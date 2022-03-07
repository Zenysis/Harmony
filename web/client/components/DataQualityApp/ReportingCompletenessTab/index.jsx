// @flow
import * as React from 'react';

import DimensionValueFilterItem from 'models/core/wip/QueryFilterItem/DimensionValueFilterItem';
import ExplainerSection from 'components/DataQualityApp/ReportingCompletenessTab/ExplainerSection';
import Field from 'models/core/wip/Field';
import Moment from 'models/core/wip/DateTime/Moment';
import NumberReportsTimeSeries from 'components/DataQualityApp/ReportingCompletenessTab/NumberReportsTimeSeries';
import ReportingCompleteness from 'models/DataQualityApp/ReportingCompleteness';
import ReportingFacilitiesTableContainer from 'components/DataQualityApp/ReportingCompletenessTab/ReportingFacilitiesTableContainer';
import TabSpecificFilters from 'components/DataQualityApp/TabSpecificFilters';
import TimeInterval from 'models/core/wip/DateTime/TimeInterval';
import { autobind } from 'decorators';
import {
  createMonthlyTimeFilter,
  getDimensionValueFromDimenisonValueNames,
  getDimensionValueFilterFromURL,
  getTimeIntervalFromURL,
  getURLParamFromDimensionValueFilter,
  getURLParamFromTimeInterval,
  updateURLParameter,
  REPORTING_COMPLETENESS_URL_PARAMS,
} from 'components/DataQualityApp/util';
import type Dimension from 'models/core/wip/Dimension';
import type { DataPointWithName } from 'components/ui/visualizations/LineGraph/types';
import type { Filters } from 'components/DataQualityApp/util';

type Props = {
  dateFilterOptions: $ReadOnlyArray<Moment>,
  reportingCompleteness: ReportingCompleteness,
  field: Field,
  initialFilters: Filters,
  geographyDimensions: $ReadOnlyArray<Dimension>,
  loading: boolean,
  initialTimeInterval: TimeInterval,
};

type State = {
  filters: Filters,
  timeInterval: TimeInterval,
};

const TEXT = t('DataQualityApp.ReportingCompletenessTab');

export default class ReportingCompletenessTab extends React.PureComponent<
  Props,
  State,
> {
  state: State = {
    filters: this.props.initialFilters,
    timeInterval: this.props.initialTimeInterval,
  };

  componentDidMount() {
    window.addEventListener('popstate', this.updateFiltersFromURL);

    this.updateFiltersFromURL();
  }

  componentWillUnmount() {
    window.removeEventListener('popstate', this.updateFiltersFromURL);
  }

  @autobind
  updateFiltersFromURL() {
    this.updateDimensionvalueFilterFromURL();
    this.updateTimeIntervalFromURL();
  }

  @autobind
  updateDimensionvalueFilterFromURL() {
    getDimensionValueFilterFromURL(
      REPORTING_COMPLETENESS_URL_PARAMS.DIMENSION_VALUE_FILTER,
    ).then(dimensionValueFilter =>
      this.setState(prevState => {
        if (
          !(
            prevState.filters.dimensionValue &&
            dimensionValueFilter &&
            prevState.filters.dimensionValue.isSame(dimensionValueFilter)
          ) &&
          !(prevState.filters.dimensionValue === dimensionValueFilter)
        ) {
          return {
            filters: {
              ...prevState.filters,
              dimensionValue: dimensionValueFilter,
            },
          };
        }
        return undefined;
      }),
    );
  }

  @autobind
  updateTimeIntervalFromURL() {
    const { dateFilterOptions } = this.props;

    this.setState(prevState => {
      const timeInterval = getTimeIntervalFromURL(
        dateFilterOptions,
        REPORTING_COMPLETENESS_URL_PARAMS.TIME_FILTER,
      );

      if (!timeInterval.isSame(prevState.timeInterval)) {
        const timeFilter = createMonthlyTimeFilter(
          timeInterval.start(),
          timeInterval.end(),
        );

        return {
          timeInterval,
          filters: { ...prevState.filters, time: timeFilter },
        };
      }
      return undefined;
    });
  }

  @autobind
  onDimensionValueFilterSelected(
    dimensionValueFilter: DimensionValueFilterItem | void,
  ) {
    const urlParameterValue = getURLParamFromDimensionValueFilter(
      dimensionValueFilter,
    );

    updateURLParameter(
      REPORTING_COMPLETENESS_URL_PARAMS.DIMENSION_VALUE_FILTER,
      urlParameterValue,
    );

    this.setState(prevState => ({
      filters: { ...prevState.filters, dimensionValue: dimensionValueFilter },
    }));
  }

  @autobind
  onTimeIntervalChanged(timeInterval: TimeInterval) {
    const urlParameterValue = getURLParamFromTimeInterval(timeInterval);

    updateURLParameter(
      REPORTING_COMPLETENESS_URL_PARAMS.TIME_FILTER,
      urlParameterValue,
    );

    const { start, end } = timeInterval.modelValues();
    const timeFilter = createMonthlyTimeFilter(start, end);

    this.setState(prevState => ({
      filters: {
        ...prevState.filters,
        time: timeFilter,
      },
      timeInterval,
    }));
  }

  @autobind
  onTimeSeriesDataPointClick(
    dataPoint: DataPointWithName,
    aggregation: Dimension,
  ) {
    const { dateFilterOptions } = this.props;
    const dataPointMoment = Moment.create(dataPoint.date);
    const index = dateFilterOptions.findIndex(date =>
      date.isSame(dataPointMoment, 'month'),
    );

    const timeInterval =
      index < dateFilterOptions.length - 1
        ? TimeInterval.create({
            start: dateFilterOptions[index],
            end: dateFilterOptions[index + 1],
          })
        : TimeInterval.create({
            start: dateFilterOptions[index - 1],
            end: dateFilterOptions[index],
          });

    this.onTimeIntervalChanged(timeInterval);

    const { seriesDimensions } = dataPoint;

    getDimensionValueFromDimenisonValueNames(
      seriesDimensions,
      aggregation.id(),
    ).then(selectedDimensionValue => {
      if (selectedDimensionValue) {
        this.onDimensionValueFilterSelected(
          DimensionValueFilterItem.createFromDimensionValues(
            selectedDimensionValue,
          ),
        );
      }
    });
  }

  renderFilters(): React.Node {
    const { dateFilterOptions } = this.props;
    const { filters, timeInterval } = this.state;
    return (
      <TabSpecificFilters
        dateFilterOptions={dateFilterOptions}
        dimensionValueFilter={filters.dimensionValue}
        timeInterval={timeInterval}
        onDimensionValueFilterSelected={this.onDimensionValueFilterSelected}
        onTimeIntervalSelected={this.onTimeIntervalChanged}
      />
    );
  }

  renderNumberReportsTimeSeries(): React.Node {
    const { geographyDimensions, field } = this.props;
    const { filters } = this.state;

    return (
      <NumberReportsTimeSeries
        field={field}
        filters={filters}
        geographyDimensions={geographyDimensions}
        onDataPointClick={this.onTimeSeriesDataPointClick}
      />
    );
  }

  renderReportingFacilitiesTable(): React.Node {
    const { field, geographyDimensions } = this.props;
    const { filters } = this.state;

    return (
      <ReportingFacilitiesTableContainer
        dimensions={geographyDimensions}
        field={field}
        filters={filters}
      />
    );
  }

  render(): React.Node {
    const { reportingCompleteness, loading } = this.props;

    return (
      <React.Fragment>
        <ExplainerSection
          loading={loading}
          reportingCompleteness={reportingCompleteness}
        />
        <h2 className="dq-tab__title">{TEXT.title}</h2>
        <p>{TEXT.subtitle}</p>
        {this.renderFilters()}
        {this.renderNumberReportsTimeSeries()}
        {this.renderReportingFacilitiesTable()}
      </React.Fragment>
    );
  }
}
