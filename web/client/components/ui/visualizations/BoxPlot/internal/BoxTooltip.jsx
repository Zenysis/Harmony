// @flow
import * as React from 'react';

import BoxPlotTooltip from 'components/ui/visualizations/BoxPlot/internal/BoxPlotTooltip';
import type { BoxPlotSummary } from 'components/ui/visualizations/BoxPlot/types';

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
  boxPlotSummary: BoxPlotSummary,
  label: string,

  /** The left coordinate of the tooltip */
  left: number,

  /** A function to format numbers to show in the tooltip */
  tooltipValueFormatter: number => number | string,

  /** The top coordinate of the tooltip */
  top: number,
};

export default function BoxTooltip({
  boxPlotSummary,
  label,
  left,
  tooltipValueFormatter,
  top,
}: Props): React.Element<typeof BoxPlotTooltip> {
  const rows = TOOLTIP_STATS.map(({ key, label: valueLabel }) => ({
    label: valueLabel,
    value: tooltipValueFormatter(boxPlotSummary[key]),
  }));
  return <BoxPlotTooltip left={left} rows={rows} title={label} top={top} />;
}
