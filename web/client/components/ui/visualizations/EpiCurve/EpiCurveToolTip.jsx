// @flow
import * as React from 'react';
import { Tooltip } from '@vx/tooltip';

import type { TooltipData } from 'components/ui/visualizations/EpiCurve/types';

type Props = {
  tooltipData: TooltipData,
  tooltipLeft: number,
  tooltipTop: number,
  timeFormatter: (date: Date) => string,
};

const defaultProps = {
  timeFormatter: d => d,
};

const TEXT = t('ui.visualizations.EpiCurve.tooltip');

export default function EpiCurveTooltip(props: Props) {
  const { tooltipTop, tooltipLeft, tooltipData, timeFormatter } = props;
  const fromDate = timeFormatter(tooltipData.from);
  const toDate = timeFormatter(tooltipData.to);

  return (
    <Tooltip top={tooltipTop} left={tooltipLeft} className="epi-curve__tooltip">
      <div>{`${TEXT.from} ${fromDate} ${TEXT.to} ${toDate}`}</div>
    </Tooltip>
  );
}

EpiCurveTooltip.defaultProps = defaultProps;
