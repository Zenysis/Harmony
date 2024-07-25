// @flow
import * as React from 'react';

import I18N from 'lib/I18N';
import Popover from 'components/ui/Popover';
import SimpleTooltip from 'components/ui/visualizations/common/SimpleTooltip';
import type { TrendPoint } from 'components/ui/visualizations/NumberTrend/types';

type Props = {
  tooltipData: TrendPoint,
  tooltipLeft: number,
  tooltipTop: number,
};

export default function TrendTooltip({
  tooltipData,
  tooltipLeft,
  tooltipTop,
}: Props): React.Node {
  // NOTE: This copies the pattern of the Bump Chart tooltip
  const [containerElt, setContainerElt] = React.useState<?HTMLDivElement>(null);
  const { date, value } = tooltipData;
  const rows = [
    { label: I18N.textById('Date'), value: date },
    { value, label: I18N.textById('Value') },
  ];
  const style = {
    marginLeft: tooltipLeft,
    marginTop: tooltipTop,
    position: 'absolute',
  };
  return (
    <div ref={setContainerElt} className="number-trend-tooltip" style={style}>
      <SimpleTooltip
        anchorElt={containerElt}
        anchorOrigin={Popover.Origins.CENTER}
        isOpen={!!containerElt}
        offsetY={50}
        popoverOrigin={Popover.Origins.CENTER}
        rows={rows}
      />
    </div>
  );
}
