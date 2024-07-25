// @flow
import * as React from 'react';

import BoxPlotTooltip from 'components/ui/visualizations/BoxPlot/internal/BoxPlotTooltip';
import I18N from 'lib/I18N';
import type { BoxPlotSummary } from 'components/ui/visualizations/BoxPlot/types';

const TOOLTIP_STATS: $ReadOnlyArray<{ key: string, label: string }> = [
  {
    key: 'max',
    label: I18N.textById('Max'),
  },
  {
    key: 'min',
    label: I18N.textById('Min'),
  },
  {
    key: 'median',
    label: I18N.text('Median'),
  },
  {
    key: 'firstQuartile',
    label: I18N.text('First Quartile'),
  },
  {
    key: 'thirdQuartile',
    label: I18N.text('Third Quartile'),
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
