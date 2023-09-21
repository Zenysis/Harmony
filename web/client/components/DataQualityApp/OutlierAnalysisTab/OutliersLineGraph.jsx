// @flow
import * as React from 'react';
import { ParentSize } from '@vx/responsive';

import CustomizableTimeInterval from 'models/core/wip/QueryFilterItem/CustomizableTimeInterval';
import DataQualityService from 'services/wip/DataQualityService';
import Dimension from 'models/core/wip/Dimension';
import DimensionValueFilterItem from 'models/core/wip/QueryFilterItem/DimensionValueFilterItem';
import Field from 'models/core/wip/Field';
import I18N from 'lib/I18N';
import LineGraph from 'components/ui/visualizations/LineGraph';
import LineGraphQueryResultData from 'models/visualizations/LineGraph/LineGraphQueryResultData';
import ProgressBar from 'components/ui/ProgressBar';
import { OUTLIER_TYPE } from 'components/DataQualityApp/OutlierAnalysisTab/util';
import { cancelPromise } from 'util/promiseUtil';
import { noop } from 'util/util';
import { round } from 'util/numberUtil';
import type { OutlierType } from 'components/DataQualityApp/OutlierAnalysisTab/util';
import type { TimeSeries } from 'components/ui/visualizations/LineGraph/types';

type Props = {
  field: Field,
  lineGraphGeographyFilter: DimensionValueFilterItem | void,
  lowestGranularityGeographyDimension: Dimension,
  outlierType: OutlierType,
  timeFilter: CustomizableTimeInterval,
};

const LINE_ID = {
  // These line ids need to match the dataframe column ids in the backend.
  EXTREME_LOWER_BOUND: 'extreme_lower_bound',
  EXTREME_UPPER_BOUND: 'extreme_upper_bound',
  MEAN: 'mean',
  OUTLIER_LOWER_BOUND: 'outlier_lower_bound',
  OUTLIER_UPPER_BOUND: 'outlier_upper_bound',
};

const LINE_ID_TO_NAME_MAP = {
  [LINE_ID.EXTREME_LOWER_BOUND]: I18N.text(
    'Extreme (3+ stdev from mean) outlier lower bound',
    'extremeLowerBound',
  ),
  [LINE_ID.EXTREME_UPPER_BOUND]: I18N.text(
    'Extreme (3+ stdev from mean) outlier upper bound',
    'extremeUpperBound',
  ),
  [LINE_ID.OUTLIER_LOWER_BOUND]: I18N.text(
    'Moderate (2+ stdev from mean) outlier lower bound',
    'outlierLowerBound',
  ),
  [LINE_ID.OUTLIER_UPPER_BOUND]: I18N.text(
    'Moderate (2+ stdev from mean) outlier upper bound',
    'outlierUpperBound',
  ),
  [LINE_ID.MEAN]: I18N.text('Mean'),
};

function getOutlierTypeLineIds(outlierType: OutlierType) {
  if (outlierType === OUTLIER_TYPE.ALL) {
    return [
      LINE_ID.OUTLIER_LOWER_BOUND,
      LINE_ID.OUTLIER_UPPER_BOUND,
      LINE_ID.MEAN,
    ];
  }

  if (outlierType === OUTLIER_TYPE.MODERATE) {
    return [
      LINE_ID.EXTREME_LOWER_BOUND,
      LINE_ID.EXTREME_UPPER_BOUND,
      LINE_ID.OUTLIER_LOWER_BOUND,
      LINE_ID.OUTLIER_UPPER_BOUND,
      LINE_ID.MEAN,
    ];
  }

  if (outlierType === OUTLIER_TYPE.EXTREME) {
    return [
      LINE_ID.EXTREME_LOWER_BOUND,
      LINE_ID.EXTREME_UPPER_BOUND,
      LINE_ID.MEAN,
    ];
  }

  return [];
}

function buildChartData(
  field: Field,
  lineGraphQueryResultData: LineGraphQueryResultData,
): $ReadOnlyArray<TimeSeries> {
  const data = lineGraphQueryResultData.data();
  const lineId = field.id();

  if (data.length > 0) {
    const { dimensions } = data[0];
    const plotData = data
      .filter(dataPoint => dataPoint[lineId] !== null)
      .map(dataPoint => ({
        date: new Date(dataPoint.timestamp),
        value: dataPoint[lineId],
      }))
      .sort((dataPointA, dataPointB) => dataPointA.date - dataPointB.date);

    return [{ dimensions, data: plotData, name: field.name() }];
  }

  return [];
}

function buildGoalLines(
  outlierType: OutlierType,
  lineGraphQueryResultData: LineGraphQueryResultData,
) {
  const goalLineIDs = getOutlierTypeLineIds(outlierType);
  const data = lineGraphQueryResultData.data();

  if (data.length === 0) {
    return [];
  }

  const firstDataPoint = data[0];

  return goalLineIDs.map(goalLineID => ({
    axis: 'y1Axis',
    fontColor: 'black',
    fontSize: 14,
    id: goalLineID,
    label: LINE_ID_TO_NAME_MAP[goalLineID],
    lineStyle: 'solid',
    lineThickness: 1,
    value: round(firstDataPoint[goalLineID], 2),
  }));
}

function formatTooltipValue(value: number) {
  return value.toFixed(2);
}

function OutliersLineGraph({
  field,
  lineGraphGeographyFilter,
  lowestGranularityGeographyDimension,
  outlierType,
  timeFilter,
}: Props) {
  const [
    queryResult,
    setQueryResult,
  ] = React.useState<LineGraphQueryResultData>(
    LineGraphQueryResultData.create({}),
  );

  const [loading, setLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (lineGraphGeographyFilter === undefined) {
      return noop;
    }

    const filters = {
      dimensionValue: lineGraphGeographyFilter,
      time: timeFilter,
    };
    setLoading(true);
    const queryPromise = DataQualityService.getOutliersLineGraph(
      field,
      lowestGranularityGeographyDimension,
      filters,
      outlierType,
    ).then(result => {
      setQueryResult(result);
      setLoading(false);
    });

    return () => cancelPromise(queryPromise);
  }, [
    field,
    lowestGranularityGeographyDimension,
    outlierType,
    timeFilter,
    lineGraphGeographyFilter,
  ]);

  const chartData = React.useMemo(() => buildChartData(field, queryResult), [
    field,
    queryResult,
  ]);

  const goalLines = React.useMemo(
    () => buildGoalLines(outlierType, queryResult),
    [outlierType, queryResult],
  );

  if (lineGraphGeographyFilter === undefined) {
    return (
      <div className="dq-viz-container">
        <div className="dq-outliers-line-graph__no-data-point-selected">
          <h3 className="dq-outliers-line-graph__no-data-point-selected-header">
            {I18N.text('No facility Selected', 'noFacilitySelectedTitle')}
          </h3>
          <span className="dq-outliers-line-graph__no-data-point-selected-explanation">
            {I18N.text(
              "Click a datapoint on the box plot above to view that facility's data with outliers marked here",
              'noFacilitySelectedExplanation',
            )}
          </span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="dq-viz-container">
        <div className="dq-viz-container__progress-bar-wrapper">
          <ProgressBar />
        </div>
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div className="dq-viz-container">
        <div className="dq-outliers-line-graph__time-series-no-data">
          {I18N.textById('noData')}
        </div>
      </div>
    );
  }

  const { dimensionValues } = lineGraphGeographyFilter.modelValues();
  const facilityDimensionValue = dimensionValues.find(
    dimensionValue =>
      dimensionValue.dimension() === lowestGranularityGeographyDimension.id(),
  );

  const facility = facilityDimensionValue ? facilityDimensionValue.name() : '';

  const vizTitle = `${field.name()}, ${lowestGranularityGeographyDimension.name()}: ${facility}`;

  return (
    <div className="dq-viz-container">
      <h4 className="dq-viz-title">{vizTitle}</h4>
      <ParentSize>
        {({ width }) => (
          <LineGraph
            data={chartData}
            goalLines={goalLines}
            tooltipDateLabel={I18N.textById('Date')}
            tooltipValueFormatter={formatTooltipValue}
            tooltipValueLabel={I18N.text('Reports Received')}
            verticalAxisStartPoint="min"
            width={width}
            xAxisLabel={I18N.text('Reporting Period')}
          />
        )}
      </ParentSize>
    </div>
  );
}

export default (React.memo(OutliersLineGraph): React.AbstractComponent<Props>);
