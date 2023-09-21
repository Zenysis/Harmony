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
  radius?: number,
  scale: LinearScale,
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
  radius = 4,
  scale,
  ...passThroughProps
}: Props): React.Element<'g'> {
  const onHoverStart = (
    outlier: BoxPlotDataPoint,
    event: SyntheticEvent<SVGCircleElement>,
  ) => {
    const { x, y } = localPoint(event);
    onOutlierHoverStart({
      dimensionValue,
      dataPoint: outlier,
      left: x,
      top: y,
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
      onClick={() => onOutlierClick(outlier)}
      onMouseLeave={onOutlierHoverEnd}
      onMouseMove={e => onHoverStart(outlier, e)}
      r={radius}
    />
  ));

  return <g className="box-plot-outliers">{outlierPoints}</g>;
}
