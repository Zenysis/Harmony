// @flow
import * as React from 'react';
import { Tooltip } from '@vx/tooltip';

import type { TooltipData } from 'components/ui/visualizations/BoxPlot/types';

const TEXT = t('ui.visualizations.BoxPlot.tooltip');

const TOOLTIP_STATS: $ReadOnlyArray<{ key: string, label: string }> = [
  {
    key: 'max',
    label: TEXT.max,
  },
  {
    key: 'min',
    label: TEXT.min,
  },
  {
    key: 'median',
    label: TEXT.median,
  },
  {
    key: 'firstQuartile',
    label: TEXT.firstQuartile,
  },
  {
    key: 'thirdQuartile',
    label: TEXT.thirdQuartile,
  },
];

type Props = {
  /** The left coordinate of the tooltip */
  tooltipLeft: number,

  /** The top coordinate of the tooltip */
  tooltipTop: number,

  /** Data to show in the tooltip */
  tooltipData: TooltipData,

  /** A function to format numbers to show in the tooltip */
  tooltipValueFormatter: number => number | string,
};

type TooltipStatProps = {
  value: string | number,
  name: string,
  showStat: boolean,
};

function TooltipStat(props: TooltipStatProps) {
  const { value, name, showStat } = props;
  if (!showStat) {
    return null;
  }

  return (
    <div>
      {name}: {value}
    </div>
  );
}

export default function BoxPlotTooltip(props: Props) {
  const { tooltipLeft, tooltipTop, tooltipData, tooltipValueFormatter } = props;

  return (
    <Tooltip top={tooltipTop} left={tooltipLeft} className="box-plot-tooltip">
      <div className="box-plot-tooltip__header">
        <strong>{tooltipData.name}</strong>
      </div>
      <div className="box-plot-tooltip__body">
        {TOOLTIP_STATS.map(({ key, label }) => {
          const statValue = tooltipValueFormatter(tooltipData[key]);
          const isValidValue = !Number.isNaN(+statValue) || !String(statValue);
          return (
            <TooltipStat
              key={key}
              name={label}
              value={statValue}
              showStat={isValidValue}
            />
          );
        })}
      </div>
    </Tooltip>
  );
}
