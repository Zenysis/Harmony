// @flow
import * as React from 'react';
import { LinePath as LinePathOriginal } from '@vx/shape';
import { curveMonotoneX } from '@vx/curve';

import LineDot from 'components/ui/visualizations/BarGraph/internal/LineDot';
import { getDataPointAdjustments } from 'components/ui/visualizations/BarGraph/internal/computeLineTextPosition';
import type {
  DataPoint,
  Metric,
  ScaleMap,
} from 'components/ui/visualizations/BarGraph/types';

type Props = {
  dataPointKeyMap: Map<DataPoint, string>,
  dataPoints: $ReadOnlyArray<DataPoint>,
  metric: Metric,
  onHoverEnd: (SyntheticMouseEvent<SVGElement>) => void,
  onHoverStart: (DataPoint, Metric, SyntheticMouseEvent<SVGElement>) => void,
  xScale: $PropertyType<ScaleMap, 'barGroupScale'>,
  yScale: $NonMaybeType<$PropertyType<ScaleMap, 'y1Scale'>>,

  enableValueDisplay?: boolean,
};

const MemoLinePath = React.memo(LinePathOriginal);

function LinePath({
  dataPointKeyMap,
  dataPoints,
  metric,
  onHoverEnd,
  onHoverStart,
  xScale,
  yScale,
  enableValueDisplay = true,
}: Props) {
  // NOTE(yitian): We do not want to be rendering a point and/or line path for
  // data points with null y values. Filter out such data points.
  const filteredDataPoints = React.useMemo(
    () =>
      dataPoints.filter(dataPoint => {
        const val = dataPoint.metrics[metric.id];
        return Number.isFinite(val);
      }),
    [dataPoints, metric.id],
  );

  const position = React.useMemo(
    () => ({
      x: d => xScale(dataPointKeyMap.get(d) || ''),
      y: d => yScale(d.metrics[metric.id] || 0),
    }),
    [dataPointKeyMap, metric, xScale, yScale],
  );

  const showFixedDots = metric.visualDisplayShape === 'dotted';

  const renderPoints = () => {
    const xyPoints = filteredDataPoints.map(dataPoint => ({
      x: position.x(dataPoint),
      y: position.y(dataPoint),
    }));

    // Only calculate the adjusted points based off nearby points if there are
    // at least 2 data points and there is not already an explicit angle provided.
    const adjustTextPosition =
      enableValueDisplay &&
      metric.showValue &&
      metric.valueTextAngle === 'auto' &&
      xyPoints.length >= 2 &&
      !showFixedDots;

    const barWidth = xScale.bandwidth();

    return xyPoints.map((xyPoint, idx) => {
      let adjustment;
      if (adjustTextPosition) {
        adjustment = getDataPointAdjustments(
          xyPoints[idx - 1],
          xyPoint,
          xyPoints[idx + 1],
          barWidth,
        );
      }

      const dataPoint = filteredDataPoints[idx];
      return (
        <LineDot
          enableValueDisplay={enableValueDisplay}
          key={dataPointKeyMap.get(dataPoint)}
          dataPoint={dataPoint}
          metric={metric}
          onHoverStart={onHoverStart}
          onHoverEnd={onHoverEnd}
          showFixedDot={showFixedDots}
          x={xyPoint.x}
          y={xyPoint.y}
          {...adjustment}
        />
      );
    });
  };

  const points = renderPoints();
  if (showFixedDots) {
    return points;
  }
  return (
    <g>
      <MemoLinePath
        curve={curveMonotoneX}
        data={filteredDataPoints}
        pointerEvents="none"
        stroke={metric.color}
        strokeWidth={2}
        x={position.x}
        y={position.y}
      />
      {points}
    </g>
  );
}

export default (React.memo(LinePath): React.AbstractComponent<Props>);
