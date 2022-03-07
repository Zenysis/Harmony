// @flow
import * as React from 'react';
import { Line } from '@vx/shape';
import { Point } from '@vx/point';

import Text from 'components/ui/visualizations/common/Text';

type Props = {
  axisOrientation: 'left' | 'right',
  chartWidth: number,
  lineColor: string,
  y: number,
  label?: string,
};

function GoalLinePath({
  axisOrientation,
  chartWidth,
  lineColor,
  y,
  label = '',
}: Props) {
  const axisLeft = axisOrientation === 'left';
  const [startPoint, endPoint] = React.useMemo<[typeof Point, typeof Point]>(
    () => [
      new Point({ x: 0, y: 0 }),
      new Point({ x: axisLeft ? chartWidth : -chartWidth, y: 0 }),
    ],
    [axisLeft, chartWidth],
  );
  return (
    <g transform={`translate(${startPoint.x}, ${y})`}>
      <Line
        from={startPoint}
        stroke={lineColor}
        strokeDasharray="2,2"
        strokeWidth={2}
        to={endPoint}
      />
      {label.length > 0 && (
        <Text
          dx={axisLeft ? 10 : -10}
          dy={-5}
          textAnchor={axisLeft ? 'start' : 'end'}
        >
          {label}
        </Text>
      )}
    </g>
  );
}

export default (React.memo(GoalLinePath): React.AbstractComponent<Props>);
