// @flow
import * as React from 'react';

import Popover from 'components/ui/Popover';
import SimpleTooltip from 'components/ui/visualizations/common/SimpleTooltip';
import type { TrendPoint } from 'components/ui/visualizations/NumberTrend/types';

type Props = {
  tooltipData: TrendPoint,
  tooltipLeft: number,
  tooltipTop: number,
};

const TEXT = t('visualizations.NumberTrend.Tooltip');

export default function TrendTooltip({
  tooltipData,
  tooltipLeft,
  tooltipTop,
}: Props): React.Node {
  // NOTE(nina): This copies the pattern of the Bump Chart tooltip
  const [containerElt, setContainerElt] = React.useState<?HTMLDivElement>(null);
  const { date, value } = tooltipData;
  const rows = [
    { label: TEXT.date, value: date },
    { label: TEXT.value, value },
  ];
  const style = {
    marginLeft: tooltipLeft,
    position: 'absolute',
    marginTop: tooltipTop,
  };
  return (
    <div className="number-trend-tooltip" ref={setContainerElt} style={style}>
      <SimpleTooltip
        anchorElt={containerElt}
        anchorOrigin={Popover.Origins.CENTER}
        isOpen={!!containerElt}
        popoverOrigin={Popover.Origins.CENTER}
        rows={rows}
        offsetY={50}
      />
    </div>
  );
}
