// @flow
import * as React from 'react';
import { Tooltip } from '@vx/tooltip';

import type {
  DataPoint,
  HoverPoint,
} from 'components/ui/visualizations/BumpChart/types';

type Props = {
  data: DataPoint,
  point: HoverPoint,
  valueFormatter: number => string | number,
};

const TEXT = t('ui.visualizations.BumpChart.BumpChartTooltip');

export default function BumpChartTooltip(props: Props) {
  const { data, point, valueFormatter } = props;
  const { x, y } = point;
  const { key, rank, val } = data;

  const rankLabel = `${TEXT.rank} - ${rank + 1}`;
  const valueLabel = `${TEXT.value} - ${valueFormatter(val)}`;
  return (
    <Tooltip top={y + 12} left={x + 12} className="bump-chart-tooltip">
      <div className="bump-chart-tooltip__key">{key}</div>
      <div className="bump-chart-tooltip__rank">{rankLabel}</div>
      <div className="bump-chart-tooltip__value">{valueLabel}</div>
    </Tooltip>
  );
}
