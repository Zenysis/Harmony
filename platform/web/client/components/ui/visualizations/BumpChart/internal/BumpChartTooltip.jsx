// @flow
import * as React from 'react';

import I18N from 'lib/I18N';
import Popover from 'components/ui/Popover';
import SimpleTooltip from 'components/ui/visualizations/common/SimpleTooltip';
import type {
  DataPoint,
  HoverPoint,
} from 'components/ui/visualizations/BumpChart/types';

type Props = {
  data: DataPoint,
  dateFormatter: string => string,
  point: HoverPoint,
  valueFormatter: number => string | number,
};

export default function BumpChartTooltip({
  data,
  dateFormatter,
  point,
  valueFormatter,
}: Props): React.Element<'div'> {
  const [containerElt, setContainerElt] = React.useState<?HTMLDivElement>(null);
  const { key, rank, timestamp, val } = data;
  const rows = [
    {
      label: I18N.textById('Date'),
      value: dateFormatter(timestamp),
    },
    {
      label: I18N.text('Rank'),
      value: rank + 1,
    },
    {
      label: I18N.textById('Value'),
      value: valueFormatter(val),
    },
  ];
  const style = {
    left: point.x,
    position: 'absolute',
    top: point.y,
  };
  return (
    <div ref={setContainerElt} className="bump-chart-tooltip" style={style}>
      <SimpleTooltip
        anchorElt={containerElt}
        isOpen={!!containerElt}
        offsetY={-12}
        popoverOrigin={Popover.Origins.BOTTOM_CENTER}
        rows={rows}
        title={key}
      />
    </div>
  );
}
