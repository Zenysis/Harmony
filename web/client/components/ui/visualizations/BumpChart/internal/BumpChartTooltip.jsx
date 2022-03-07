// @flow
import * as React from 'react';

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

const TEXT = t('ui.visualizations.BumpChart.BumpChartTooltip');

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
      label: TEXT.date,
      value: dateFormatter(timestamp),
    },
    {
      label: TEXT.rank,
      value: rank + 1,
    },
    {
      label: TEXT.value,
      value: valueFormatter(val),
    },
  ];
  const style = {
    left: point.x,
    position: 'absolute',
    top: point.y,
  };
  return (
    <div className="bump-chart-tooltip" ref={setContainerElt} style={style}>
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
