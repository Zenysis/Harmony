// @flow
import * as React from 'react';
import invariant from 'invariant';

import BarGroup from 'components/ui/visualizations/BarGraph/internal/BarGroup';
import LinePath from 'components/ui/visualizations/BarGraph/internal/LinePath';
import memoizeOne from 'decorators/memoizeOne';
import { noop } from 'util/util';
import type {
  DataPoint,
  Metric,
  ScaleMap,
} from 'components/ui/visualizations/BarGraph/types';

type DefaultProps = {
  barTreatment: 'overlaid' | 'overlapping' | 'sequential' | 'stacked',

  // Enable displaying of bar values if the Metric has been marked to show the
  // value.
  enableValueDisplay: boolean,
  hideOverflowing: boolean,
  minBarHeight: number,
  onHoverEnd: (SyntheticMouseEvent<SVGElement>) => void,
  onHoverStart: (DataPoint, Metric, SyntheticMouseEvent<SVGElement>) => void,
};

type Props = {
  ...DefaultProps,
  barDirection: 'horizontal' | 'vertical',
  barGroupOpacity: DataPoint => number,
  barStroke: string,
  barStrokeWidth: number,
  dataPointKeyMap: Map<DataPoint, string>,
  dataPoints: $ReadOnlyArray<DataPoint>,
  height: number,
  metricOrder: $ReadOnlyArray<Metric>,
  scales: ScaleMap,
  width: number,
  ...
};

export default class BarSeries extends React.PureComponent<Props> {
  static defaultProps: DefaultProps = {
    barTreatment: 'overlapping',
    enableValueDisplay: true,
    hideOverflowing: true,
    minBarHeight: 2,
    onHoverEnd: noop,
    onHoverStart: noop,
  };

  @memoizeOne
  splitMetrics(
    metricOrder: $ReadOnlyArray<Metric>,
  ): [$ReadOnlyArray<Metric>, $ReadOnlyArray<Metric>] {
    const barMetrics = [];
    const lineMetrics = [];
    metricOrder.forEach(m => {
      if (m.visualDisplayShape === 'bar') {
        barMetrics.push(m);
      } else {
        // Dotted visual display shape treatment will be the same as for lines.
        lineMetrics.push(m);
      }
    });
    return [barMetrics, lineMetrics];
  }

  @memoizeOne
  buildVisibleDataPoints(
    dataPoints: $ReadOnlyArray<DataPoint>,
    dataPointKeyMap: Map<DataPoint, string>,
    barGroupScale: $PropertyType<ScaleMap, 'barGroupScale'>,
    width: number,
  ): $ReadOnlyArray<DataPoint> {
    const output = [];
    const groupWidth = barGroupScale.bandwidth();
    dataPoints.forEach(dataPoint => {
      const key = dataPointKeyMap.get(dataPoint);
      invariant(key !== undefined, 'DataPoint key cannot be missing');

      const barStart = barGroupScale(key);
      const barEnd = barStart + groupWidth;
      if (barStart <= width && barEnd >= 0) {
        output.push(dataPoint);
      }
    });
    return output;
  }

  getVisibleDataPoints(): $ReadOnlyArray<DataPoint> {
    const {
      dataPoints,
      dataPointKeyMap,
      hideOverflowing,
      scales,
      width,
    } = this.props;
    if (!hideOverflowing) {
      return dataPoints;
    }

    return this.buildVisibleDataPoints(
      dataPoints,
      dataPointKeyMap,
      scales.barGroupScale,
      width,
    );
  }

  maybeRenderLines(): React.Element<'g'> | null {
    const {
      dataPointKeyMap,
      enableValueDisplay,
      metricOrder,
      onHoverEnd,
      onHoverStart,
      scales,
    } = this.props;
    const lineMetrics = this.splitMetrics(metricOrder)[1];
    if (lineMetrics.length === 0) {
      return null;
    }

    const { barGroupScale, y1Scale, y2Scale } = scales;
    const linePaths = lineMetrics.map(metric => {
      const yScale = metric.axis === 'y1Axis' ? y1Scale : y2Scale;
      invariant(yScale !== undefined, 'yScale cannot be missing');
      return (
        <LinePath
          key={metric.id}
          dataPointKeyMap={dataPointKeyMap}
          dataPoints={this.getVisibleDataPoints()}
          enableValueDisplay={enableValueDisplay}
          metric={metric}
          onHoverEnd={onHoverEnd}
          onHoverStart={onHoverStart}
          xScale={barGroupScale}
          yScale={yScale}
        />
      );
    });

    return (
      <g transform={`translate(${barGroupScale.bandwidth() / 2}, 0)`}>
        {linePaths}
      </g>
    );
  }

  renderBarGroups(): React.Node {
    const {
      barDirection,
      barGroupOpacity,
      barStroke,
      barStrokeWidth,
      barTreatment,
      dataPointKeyMap,
      enableValueDisplay,
      metricOrder,
      minBarHeight,
      onHoverEnd,
      onHoverStart,
      scales,
    } = this.props;

    const groups = [];
    const visibleDataPoints = this.getVisibleDataPoints();
    const dataPointCount = visibleDataPoints.length;
    const barMetrics = this.splitMetrics(metricOrder)[0];
    visibleDataPoints.forEach((_, idx) => {
      // NOTE(stephen): Render each bar group in reverse order so that text
      // annotations do not get covered up by subsequent bar groups.
      const dataPoint = visibleDataPoints[dataPointCount - idx - 1];
      const key = dataPointKeyMap.get(dataPoint);
      invariant(key !== undefined, 'DataPoint key cannot be missing');
      const opacity = barGroupOpacity(dataPoint);
      groups.push(
        <g
          fillOpacity={opacity}
          key={key}
          role="listitem"
          transform={`translate(${scales.barGroupScale(key)}, 0)`}
        >
          <BarGroup
            barDirection={barDirection}
            barTreatment={barTreatment}
            dataPoint={dataPoint}
            enableValueDisplay={enableValueDisplay}
            metricOrder={barMetrics}
            minBarHeight={minBarHeight}
            onHoverEnd={onHoverEnd}
            onHoverStart={onHoverStart}
            scales={scales}
            stroke={barStroke}
            strokeWidth={barStrokeWidth}
          />
        </g>,
      );
    });

    return groups;
  }

  render(): React.Element<'g'> | null {
    const { height } = this.props;
    if (height <= 0) {
      return null;
    }

    return (
      <g role="list">
        {this.renderBarGroups()}
        {this.maybeRenderLines()}
      </g>
    );
  }
}
