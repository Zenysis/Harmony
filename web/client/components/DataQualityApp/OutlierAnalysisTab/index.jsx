// @flow
import * as React from 'react';
import invariant from 'invariant';

import DimensionValueFilterItem from 'models/core/wip/QueryFilterItem/DimensionValueFilterItem';
import ExplainerSection from 'components/DataQualityApp/OutlierAnalysisTab/ExplainerSection';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import Moment from 'models/core/wip/DateTime/Moment';
import OutliersLineGraph from 'components/DataQualityApp/OutlierAnalysisTab/OutliersLineGraph';
import OutliersOverviewVizTabs from 'components/DataQualityApp/OutlierAnalysisTab/OutliersOverviewVizTabs';
import Settings from 'components/DataQualityApp/OutlierAnalysisTab/Settings';
import TabSpecificFilters from 'components/DataQualityApp/TabSpecificFilters';
import { OUTLIER_TYPE } from 'components/DataQualityApp/OutlierAnalysisTab/util';
import { autobind } from 'decorators';
import {
  createMonthlyTimeFilter,
  getDimensionValueFromDimenisonValueNames,
  getDimensionValueFilterFromURL,
  getTimeIntervalFromURL,
  getURLParamFromDimensionValueFilter,
  getURLParamFromTimeInterval,
  updateURLParameter,
  OUTLIER_ANALYSIS_URL_PARAMS,
} from 'components/DataQualityApp/util';
import { getQueryParam } from 'util/util';
import type Dimension from 'models/core/wip/Dimension';
import type Field from 'models/core/wip/Field';
import type OutlierAnalysis from 'models/DataQualityApp/OutlierAnalysis';
import type TimeInterval from 'models/core/wip/DateTime/TimeInterval';
import type { BoxPlotDataPoint } from 'components/ui/visualizations/BoxPlot/types';
import type { DataRow } from 'models/visualizations/Table/types';
import type { Filters } from 'components/DataQualityApp/util';
import type { OutlierType } from 'components/DataQualityApp/OutlierAnalysisTab/util';

type Props = {
  dateFilterOptions: $ReadOnlyArray<Moment>,
  field: Field,
  geographyDimensions: $ReadOnlyArray<Dimension>,
  initialFilters: Filters,
  initialTimeInterval: TimeInterval,
  loading: boolean,
  outlierAnalysis: OutlierAnalysis,
};

type State = {
  aggregation: Dimension,
  filters: Filters,
  lineGraphGeographyFilter: DimensionValueFilterItem | void,
  outlierType: OutlierType,
  timeInterval: TimeInterval,
};

export default class OutlierAnalysisTab extends React.PureComponent<
  Props,
  State,
> {
  state: State = {
    aggregation: this.props.geographyDimensions[0],
    filters: this.props.initialFilters,
    lineGraphGeographyFilter: undefined,
    outlierType: OUTLIER_TYPE.ALL,
    timeInterval: this.props.initialTimeInterval,
  };

  componentDidMount() {
    window.addEventListener('popstate', this.updateFiltersAndSettingsFromURL);

    this.updateFiltersAndSettingsFromURL();
  }

  componentWillUnmount() {
    window.removeEventListener(
      'popstate',
      this.updateFiltersAndSettingsFromURL,
    );
  }

  @autobind
  updateFiltersAndSettingsFromURL() {
    this.updateDimensionValueFilterFromURL();
    this.updateTimeIntervalFromURL();
    this.updateAggregationFromURL();
    this.updateOutlierTypeFromURL();
    this.updateLineGraphGeographyFilterFromURL();
  }

  @autobind
  updateAggregationFromURL() {
    const { geographyDimensions } = this.props;

    const dimensionId = getQueryParam(OUTLIER_ANALYSIS_URL_PARAMS.AGGREGATION);

    this.setState(prevState => {
      if (dimensionId === prevState.aggregation.id()) {
        return undefined;
      }
      const aggregation = geographyDimensions.find(
        dimension => dimension.id() === dimensionId,
      );

      if (aggregation) {
        return { aggregation };
      }
      return { aggregation: geographyDimensions[0] };
    });
  }

  @autobind
  updateOutlierTypeFromURL() {
    const outlierType = getQueryParam(OUTLIER_ANALYSIS_URL_PARAMS.OUTLIER_TYPE);

    if (Object.values(OUTLIER_TYPE).includes(outlierType)) {
      this.setState({ outlierType: ((outlierType: $Cast): OutlierType) });
    } else {
      this.setState({ outlierType: OUTLIER_TYPE.ALL });
    }
  }

  @autobind
  updateDimensionValueFilterFromURL() {
    getDimensionValueFilterFromURL(
      OUTLIER_ANALYSIS_URL_PARAMS.DIMENSION_VALUE_FILTER,
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
        OUTLIER_ANALYSIS_URL_PARAMS.TIME_FILTER,
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
  updateLineGraphGeographyFilterFromURL() {
    getDimensionValueFilterFromURL(
      OUTLIER_ANALYSIS_URL_PARAMS.LINE_GRAPH_GEOGRAPHY_FILTER,
    ).then(lineGraphGeographyFilter =>
      this.setState(prevState => {
        if (
          !(
            prevState.lineGraphGeographyFilter &&
            lineGraphGeographyFilter &&
            prevState.lineGraphGeographyFilter.isSame(lineGraphGeographyFilter)
          ) &&
          !(prevState.lineGraphGeographyFilter === lineGraphGeographyFilter)
        ) {
          return { lineGraphGeographyFilter };
        }
        return undefined;
      }),
    );
  }

  @autobind
  onAggregationChange(aggregation: Dimension) {
    updateURLParameter(
      OUTLIER_ANALYSIS_URL_PARAMS.AGGREGATION,
      aggregation.id(),
    );

    this.setState({ aggregation });
  }

  @autobind
  onBoxPlotDataPointClick(dataPoint: BoxPlotDataPoint) {
    this.onDimensionsForLineGraphFilterSelected(dataPoint.dimensions);
  }

  @autobind
  onTableRowClick(row: DataRow) {
    const { geographyDimensions } = this.props;

    const dimensionValueMap = {};
    geographyDimensions.forEach(dimension => {
      dimensionValueMap[dimension.id()] =
        row[dimension.id()] !== undefined ? row[dimension.id()] : null;
    });
    this.onDimensionsForLineGraphFilterSelected(dimensionValueMap);
  }

  @autobind
  onDimensionsForLineGraphFilterSelected(dimensionValues: {
    +[dimensionId: string]: string | null,
    ...,
  }) {
    const { geographyDimensions } = this.props;

    const lowestGranularityGeographyDimension =
      geographyDimensions[geographyDimensions.length - 1];

    getDimensionValueFromDimenisonValueNames(
      dimensionValues,
      lowestGranularityGeographyDimension.id(),
    ).then(selectedFacility => {
      if (selectedFacility) {
        const lineGraphGeographyFilter = DimensionValueFilterItem.createFromDimensionValues(
          selectedFacility,
        );

        updateURLParameter(
          OUTLIER_ANALYSIS_URL_PARAMS.LINE_GRAPH_GEOGRAPHY_FILTER,
          getURLParamFromDimensionValueFilter(lineGraphGeographyFilter),
        );

        this.setState({ lineGraphGeographyFilter });
      }
    });
  }

  @autobind
  onOutlierTypeChange(outlierType: OutlierType) {
    updateURLParameter(OUTLIER_ANALYSIS_URL_PARAMS.OUTLIER_TYPE, outlierType);

    this.setState({ outlierType });
  }

  @autobind
  onDimensionValueFilterSelected(
    dimensionValueFilter: DimensionValueFilterItem | void,
  ) {
    const urlParameterValue = getURLParamFromDimensionValueFilter(
      dimensionValueFilter,
    );

    updateURLParameter(
      OUTLIER_ANALYSIS_URL_PARAMS.DIMENSION_VALUE_FILTER,
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
      OUTLIER_ANALYSIS_URL_PARAMS.TIME_FILTER,
      urlParameterValue,
    );

    const { end, start } = timeInterval.modelValues();
    const timeFilter = createMonthlyTimeFilter(start, end);

    this.setState(prevState => ({
      timeInterval,
      filters: {
        ...prevState.filters,
        time: timeFilter,
      },
    }));
  }

  renderFilters(): React.Node {
    const { dateFilterOptions } = this.props;
    const { filters, timeInterval } = this.state;
    return (
      <TabSpecificFilters
        dateFilterOptions={dateFilterOptions}
        dimensionValueFilter={filters.dimensionValue}
        onDimensionValueFilterSelected={this.onDimensionValueFilterSelected}
        onTimeIntervalSelected={this.onTimeIntervalChanged}
        timeInterval={timeInterval}
      />
    );
  }

  renderSettings(): React.Node {
    const { geographyDimensions } = this.props;
    const { aggregation, outlierType } = this.state;
    return (
      <Settings
        aggregation={aggregation}
        // Exclude the smallest geography dimension as otherwise each box in the
        // box plot would only have one value
        geographyDimensions={geographyDimensions.slice(0, -1)}
        onAggregationSelected={this.onAggregationChange}
        onOutlierTypeSelected={this.onOutlierTypeChange}
        outlierType={outlierType}
      />
    );
  }

  renderOverviewVizTabs(): React.Node {
    const { field, geographyDimensions } = this.props;
    const { aggregation, filters, outlierType } = this.state;

    invariant(
      geographyDimensions.length,
      'There must be at least one geography dimension supplied.',
    );

    const lowestGranularityGeographyDimension =
      geographyDimensions[geographyDimensions.length - 1];

    return (
      <OutliersOverviewVizTabs
        field={field}
        filters={filters}
        geographyDimensions={geographyDimensions}
        geographyGroupBy={aggregation}
        lowestGranularityGeographyDimension={
          lowestGranularityGeographyDimension
        }
        onBoxPlotDataPointClick={this.onBoxPlotDataPointClick}
        onTableRowClick={this.onTableRowClick}
        outlierType={outlierType}
      />
    );
  }

  renderLineGraph(): React.Node {
    const { field, geographyDimensions } = this.props;
    const { filters, lineGraphGeographyFilter, outlierType } = this.state;

    return (
      <OutliersLineGraph
        field={field}
        lineGraphGeographyFilter={lineGraphGeographyFilter}
        lowestGranularityGeographyDimension={
          geographyDimensions[geographyDimensions.length - 1]
        }
        outlierType={outlierType}
        timeFilter={filters.time}
      />
    );
  }

  render(): React.Node {
    const { loading, outlierAnalysis } = this.props;

    return (
      <React.Fragment>
        <ExplainerSection loading={loading} outlierAnalysis={outlierAnalysis} />
        <h2 className="dq-tab__title">{I18N.text('Investigate Outliers')}</h2>
        <p>
          {I18N.text(
            'This tool is intended to help you isolate data points which are outliers relative to the mean for each facility.',
          )}{' '}
          <strong>
            {I18N.text(
              'Each dot on the box plot represents the %% of reported values that are outliers for a single facility.',
            )}
          </strong>{' '}
          {I18N.text(
            "You can click on each dot to view that facility's data on a time series below and see which datapoints are outliers relative to the mean. Some of the outliers may be erroneous and require follow up with the facility to understand & resolve.",
          )}
        </p>
        {this.renderFilters()}
        {this.renderSettings()}
        <Group.Vertical spacing="m">
          {this.renderOverviewVizTabs()}
          {this.renderLineGraph()}
        </Group.Vertical>
      </React.Fragment>
    );
  }
}
