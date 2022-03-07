// @flow
import * as React from 'react';

import Popover from 'components/ui/Popover';
import SimpleTooltip from 'components/ui/visualizations/common/SimpleTooltip';
import type { RowData } from 'components/ui/visualizations/common/SimpleTooltip/internal/TooltipTable';

type Props = {
  left: number,
  rows: $ReadOnlyArray<RowData>,
  top: number,

  title?: string | void,
};

export default function BoxPlotTooltip({
  left,
  rows,
  top,
  title = undefined,
}: Props): React.Element<'div'> {
  const [containerElt, setContainerElt] = React.useState<?HTMLDivElement>(null);
  const style = {
    left,
    top,
    position: 'absolute',
  };
  return (
    <div className="box-plot-tooltip" ref={setContainerElt} style={style}>
      <SimpleTooltip
        anchorElt={containerElt}
        isOpen={!!containerElt}
        popoverOrigin={Popover.Origins.BOTTOM_LEFT}
        rows={rows}
        title={title}
      />
    </div>
  );
}
