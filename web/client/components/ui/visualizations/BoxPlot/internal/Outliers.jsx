// @flow
import * as React from 'react';
import { localPoint } from '@vx/event';

import type {
  BoxPlotDataPoint,
  OutlierTooltipData,
} from 'components/ui/visualizations/BoxPlot/types';

type LinearScale = $FlowTODO;

type Props = {
  center: number,
  dimensionValue: string,
  onOutlierClick: BoxPlotDataPoint => void,
  onOutlierHoverEnd: () => void,
  onOutlierHoverStart: OutlierTooltipData => void,
  outlierClassName: string,
  outliers: $ReadOnlyArray<BoxPlotDataPoint>,
  scale: LinearScale,

  radius?: number,
  ...
};

export default function Outliers({
  center,
  dimensionValue,
  onOutlierClick,
  onOutlierHoverEnd,
  onOutlierHoverStart,
  outlierClassName,
  outliers,
  scale,
  radius = 4,
  ...passThroughProps
}: Props): React.Element<'g'> {
  const onHoverStart = (
    outlier: BoxPlotDataPoint,
    event: SyntheticEvent<SVGCircleElement>,
  ) => {
    const { x, y } = localPoint(event);
    onOutlierHoverStart({
      dimensionValue,
      left: x,
      top: y,
      dataPoint: outlier,
    });
  };
  const outlierPoints = outliers.map((outlier, idx) => (
    <circle
      {...passThroughProps}
      // eslint-disable-next-line react/no-array-index-key
      key={`${outlier.value}-${idx}`}
      className={outlierClassName}
      cx={center}
      cy={scale(outlier.value)}
      onMouseMove={e => onHoverStart(outlier, e)}
      onMouseLeave={onOutlierHoverEnd}
      onClick={() => onOutlierClick(outlier)}
      r={radius}
    />
  ));

  return <g className="box-plot-outliers">{outlierPoints}</g>;
}
