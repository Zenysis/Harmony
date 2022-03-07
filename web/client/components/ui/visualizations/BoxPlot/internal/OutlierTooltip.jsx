// @flow
import * as React from 'react';

import BoxPlotTooltip from 'components/ui/visualizations/BoxPlot/internal/BoxPlotTooltip';

const TEXT = t('ui.visualizations.BoxPlot.tooltip');

type Props = {
  /** The box name this outlier came from */
  label: string,

  /** The left coordinate of the tooltip */
  left: number,

  /** The top coordinate of the tooltip */
  top: number,

  /** The outlier value to display. */
  value: number | string,
};

export default function OutlierTooltip({
  label,
  left,
  top,
  value,
}: Props): React.Element<typeof BoxPlotTooltip> {
  const rows = [{ label: TEXT.outlier, value }];
  return <BoxPlotTooltip left={left} rows={rows} title={label} top={top} />;
}
