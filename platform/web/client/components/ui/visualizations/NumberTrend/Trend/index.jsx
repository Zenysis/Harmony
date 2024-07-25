// @flow
import * as React from 'react';
import * as allCurves from '@vx/curve';
import { LinePath } from '@vx/shape';
import { Group as VXGroup } from '@vx/group';
import { extent, max } from 'd3-array';
import { scaleTime, scaleLinear } from '@vx/scale';

import Group from 'components/ui/Group';
import TrendTooltip from 'components/ui/visualizations/NumberTrend/Trend/TrendTooltip';
import { TIMESTAMP_GROUPING_ID } from 'models/core/QueryResultSpec/QueryResultGrouping';
import type GroupBySettings from 'models/core/QueryResultSpec/GroupBySettings';
import type { TrendPoint } from 'components/ui/visualizations/NumberTrend/types';

// data accessors
const getX = (point: TrendPoint) => new Date(point.date);
const getY = (point: TrendPoint) => point.value;

export type Props = {
  groupBySettings: GroupBySettings,
  height: number,
  points: $ReadOnlyArray<TrendPoint>,
  width: number,
};

/**
 * The Trend component represents the spark line we render to show data
 * grouped by date. We use examples from the vx docs to help build this.
 * Examples: https://vx-demo.now.sh/areas, https://vx-demo.now.sh/curves
 */
export default function Trend({
  groupBySettings,
  height,
  points,
  width,
}: Props): React.Node {
  const [tooltip, setTooltip] = React.useState<{
    tooltipData: TrendPoint,
    tooltipLeft: number,
    tooltipTop: number,
  } | void>(undefined);

  const svgHeight = height - 20;
  const svgWidth = width - 20;
  const lineHeight = svgHeight;

  // Initialize scales
  const xScale = scaleTime<number>({
    domain: extent(points, getX),
  });
  const yScale = scaleLinear<number>({
    domain: [0, max(points, getY)],
  });

  xScale.range([20, svgWidth]);
  yScale.range([lineHeight - 2, 20]);

  // NOTE: This is pretty much a copy of how we format dates for tooltips
  // for the Bar Graph
  const buildDateValue = (date: string) => {
    const timeGroupingObject = groupBySettings
      .groupings()
      .forceGet(TIMESTAMP_GROUPING_ID);

    return timeGroupingObject.formatGroupingValue(date, true);
  };

  const buildFillColor = (x, y) => {
    let fill = 'none';
    if (tooltip !== undefined) {
      const { tooltipLeft, tooltipTop } = tooltip;
      fill = x === tooltipLeft && y === tooltipTop ? '#fff' : 'none';
    }
    return fill;
  };

  const buildStrokeColor = (x, y) => {
    let stroke = 'none';
    if (tooltip !== undefined) {
      const { tooltipLeft, tooltipTop } = tooltip;
      stroke = x === tooltipLeft && y === tooltipTop ? '#000' : 'none';
    }
    return stroke;
  };

  const circlePoints = points.map(point => {
    const xOffset = xScale(getX(point));
    const yOffset = yScale(getY(point));
    // TODO: Format the value
    const { date, value } = point;
    return (
      <React.Fragment key={date}>
        <circle
          key={date}
          cx={xOffset}
          cy={yOffset}
          fill={buildFillColor(xOffset, yOffset)}
          r={5}
          stroke={buildStrokeColor(xOffset, yOffset)}
        />
        <circle
          key={`${date}-transparent-circle`}
          cx={xOffset}
          cy={yOffset}
          fill="transparent"
          onMouseEnter={() =>
            setTooltip({
              tooltipData: { date: buildDateValue(date), value },
              tooltipLeft: xOffset,
              tooltipTop: yOffset,
            })
          }
          onMouseLeave={() => setTooltip(undefined)}
          r={20}
        />
      </React.Fragment>
    );
  });

  return (
    <React.Fragment>
      <Group.Horizontal flex justifyContent="center">
        <div style={{ width, height }}>
          <svg height={height} style={{ position: 'absolute' }} width={width}>
            <VXGroup>
              <LinePath
                curve={allCurves.curveLinear}
                data={points}
                shapeRendering="geometricPrecision"
                stroke="#000000"
                strokeWidth={1.5}
                x={point => xScale(getX(point))}
                y={point => yScale(getY(point))}
              />
              {circlePoints}
            </VXGroup>
          </svg>
          {tooltip && <TrendTooltip {...tooltip} />}
        </div>
      </Group.Horizontal>
    </React.Fragment>
  );
}
