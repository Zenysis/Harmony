// @flow
import * as React from 'react';
import { ParentSize } from '@vx/responsive';
import type Promise from 'bluebird';

import DataQualityService from 'services/wip/DataQualityService';
import Dimension from 'models/core/wip/Dimension';
import Dropdown from 'components/ui/Dropdown';
import HelperText from 'components/DataQualityApp/ReportingCompletenessTab/HelperText';
import I18N from 'lib/I18N';
import LabelWrapper from 'components/ui/LabelWrapper';
import LineGraph from 'components/ui/visualizations/LineGraph';
import LineGraphQueryResultData from 'models/visualizations/LineGraph/LineGraphQueryResultData';
import ProgressBar from 'components/ui/ProgressBar';
import { autobind, memoizeOne } from 'decorators';
import { cancelPromise } from 'util/promiseUtil';
import { parseResults } from 'models/visualizations/LineGraph/util';
import type Field from 'models/core/wip/Field';
import type {
  DataPointWithName,
  TimeSeries,
} from 'components/ui/visualizations/LineGraph/types';
import type { Filters } from 'components/DataQualityApp/util';

type DefaultProps = {
  getLineGraphData: typeof DataQualityService.getNumReportsTimeSeries,
};

type Props = {
  ...DefaultProps,
  field: Field,
  filters: Filters,
  geographyDimensions: $ReadOnlyArray<Dimension>,
  onDataPointClick: (
    dataPoint: DataPointWithName,
    aggregation: Dimension,
  ) => void,
};

type State = {
  aggregation: Dimension,
  lineGraphQueryResultData: LineGraphQueryResultData,
  loading: boolean,
  numLines: number,
};

const NATIONAL_DIMENISON = Dimension.create({
  id: 'National',
  name: I18N.text('national'),
});

const RESULT_LIMIT_OPTIONS = [1, 5, 10, 20, 50, 100, I18N.text('All')];

class NumberReportsTimeSeries extends React.PureComponent<Props, State> {
  static defaultProps: DefaultProps = {
    getLineGraphData: DataQualityService.getNumReportsTimeSeries,
  };

  state: State = {
    aggregation: NATIONAL_DIMENISON,
    lineGraphQueryResultData: LineGraphQueryResultData.create({}),
    loading: true,
    numLines: 10,
  };

  _timeSeriesDataPromise: Promise<void> | void = undefined;

  componentDidMount() {
    this.loadTimeSeriesData();
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    if (
      prevProps.field !== this.props.field ||
      prevProps.filters !== this.props.filters ||
      prevState.aggregation !== this.state.aggregation
    ) {
      this.loadTimeSeriesData();
    }
  }

  componentWillUnmount() {
    if (this._timeSeriesDataPromise) {
      cancelPromise(this._timeSeriesDataPromise);
    }
  }

  @memoizeOne
  buildChartData(
    lineGraphQueryResultData: LineGraphQueryResultData,
    field: Field,
    numLines: number | string,
  ): $ReadOnlyArray<TimeSeries> {
    const numLinesNumber = Number.isInteger(numLines) ? numLines : -1;

    const lines = parseResults(
      lineGraphQueryResultData.data(),
      lineGraphQueryResultData.totals(),
      (numLinesNumber: $Cast),
    );

    return lines.map(line => {
      const { dimensions, key } = line[0];
      const data = line
        .filter(dataPoint => dataPoint[field.id()] !== null)
        .map(dataPoint => ({
          date: new Date(dataPoint.timestamp),
          value: dataPoint[field.id()],
        }))
        .sort((dataPointA, dataPointB) => dataPointA.date - dataPointB.date);
      return { name: key, data, dimensions };
    });
  }

  getChartData(): $ReadOnlyArray<TimeSeries> {
    const { field } = this.props;
    const { lineGraphQueryResultData, numLines } = this.state;

    return this.buildChartData(lineGraphQueryResultData, field, numLines);
  }

  loadTimeSeriesData(): void {
    const { field, filters, getLineGraphData } = this.props;
    const { aggregation } = this.state;

    this.setState({ loading: true }, () => {
      const groupingDimension =
        aggregation === NATIONAL_DIMENISON ? undefined : aggregation;

      if (this._timeSeriesDataPromise) {
        cancelPromise(this._timeSeriesDataPromise);
      }

      this._timeSeriesDataPromise = getLineGraphData(
        field,
        groupingDimension,
        filters,
      ).then(lineGraphQueryResultData => {
        this.setState({ lineGraphQueryResultData, loading: false });
      });
    });
  }

  @autobind
  onAggregationChange(aggregation: Dimension) {
    this.setState({ aggregation });
  }

  @autobind
  onNumLinesChange(numLines: number) {
    this.setState({ numLines });
  }

  @autobind
  onDataPointClick(dataPoint: DataPointWithName) {
    const { onDataPointClick } = this.props;
    const { aggregation } = this.state;
    onDataPointClick(dataPoint, aggregation);
  }

  maybeRenderLineGraph(): React.Node {
    const { loading } = this.state;

    if (loading) {
      return null;
    }

    const data = this.getChartData();

    if (!data.length) {
      return (
        <div className="dq-reporting-completeness-tab__time-series-no-data">
          {I18N.text('There is no data to display', 'noData')}
        </div>
      );
    }

    return (
      <ParentSize>
        {props => (
          <LineGraph
            data={this.getChartData()}
            onDataPointClick={this.onDataPointClick}
            tooltipDateLabel={I18N.textById('Date')}
            tooltipValueLabel={I18N.textById('Reports Received')}
            width={props.width}
            xAxisLabel={I18N.textById('Reporting Period')}
            yAxisLabel={I18N.text('Number of Reports Received')}
          />
        )}
      </ParentSize>
    );
  }

  maybeRenderProgressBar(): React.Node {
    const { loading } = this.state;

    if (!loading) {
      return null;
    }

    return (
      <div className="dq-viz-container__progress-bar-wrapper">
        <ProgressBar enabled={loading} />
      </div>
    );
  }

  renderGeographyDimensionOptions(): $ReadOnlyArray<
    React.Element<Class<Dropdown.Option<Dimension>>>,
  > {
    const { geographyDimensions } = this.props;

    const dimensions = [NATIONAL_DIMENISON, ...geographyDimensions];

    return dimensions.map(dimension => (
      <Dropdown.Option key={dimension.id()} value={dimension}>
        {dimension.name()}
      </Dropdown.Option>
    ));
  }

  renderAggregationDropdown(): React.Node {
    const { aggregation } = this.state;

    const options = this.renderGeographyDimensionOptions();

    return (
      <LabelWrapper
        className="dq-reporting-completeness-tab__time-series-setting"
        inline
        label={I18N.text('Aggregation')}
      >
        <Dropdown
          value={aggregation}
          onSelectionChange={this.onAggregationChange}
        >
          {options}
        </Dropdown>
      </LabelWrapper>
    );
  }

  renderLimitResultsDropdown(): React.Node {
    const { numLines } = this.state;
    const options = RESULT_LIMIT_OPTIONS.map(numOptions => (
      <Dropdown.Option key={numOptions} value={numOptions}>
        {numOptions}
      </Dropdown.Option>
    ));

    return (
      <LabelWrapper
        className="dq-reporting-completeness-tab__time-series-setting"
        inline
        label={I18N.text('Limit Results')}
      >
        <Dropdown value={numLines} onSelectionChange={this.onNumLinesChange}>
          {options}
        </Dropdown>
      </LabelWrapper>
    );
  }

  renderSettingsDropdowns(): React.Node {
    return (
      <div className="dq-reporting-completeness-tab__time-series-settings">
        {this.renderAggregationDropdown()}
        {this.renderLimitResultsDropdown()}
      </div>
    );
  }

  render(): React.Node {
    const { lineGraphQueryResultData } = this.state;

    if (!lineGraphQueryResultData) {
      return null;
    }

    return (
      <React.Fragment>
        <div className="dq-viz-container">
          <h4 className="dq-viz-title">
            {I18N.text(
              'Total Number of Reports Received by Reporting Period For This Indicator',
            )}
          </h4>
          {this.renderSettingsDropdowns()}
          {this.maybeRenderProgressBar()}
          {this.maybeRenderLineGraph()}
        </div>
        <HelperText
          text={I18N.text(
            'Use this line graph to observe reporting trends and find times where fewer reports than expected were received. Clicking on a dot will filter the table below to that time period only.',
            'lineGraphHelperText',
          )}
        />
      </React.Fragment>
    );
  }
}

export default NumberReportsTimeSeries;
