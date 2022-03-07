// @flow
import * as React from 'react';

import Popover from 'components/ui/Popover';
import SimpleTooltip from 'components/ui/visualizations/common/SimpleTooltip';
import buildScreenCoordinates from 'components/visualizations/common/PlotlyTooltip/buildScreenCoordinates';
import type { PlotlyElementProperties } from 'components/visualizations/common/PlotlyTooltip/buildScreenCoordinates';
import type { RowData } from 'components/ui/visualizations/common/SimpleTooltip/internal/TooltipTable';

type Props = {
  plotContainer: (HTMLDivElement & PlotlyElementProperties) | null | void,
  rows: $ReadOnlyArray<RowData>,
  x: number,
  y: number,

  subtitle?: string | void,
  title?: string | void,
  yAxis?: 'y1Axis' | 'y2Axis',
};

function PlotlyTooltip({
  plotContainer,
  rows,
  x,
  y,

  subtitle = undefined,
  title = undefined,
  yAxis = 'y1Axis',
}: Props) {
  if (!plotContainer) {
    return null;
  }

  // NOTE(stephen): Using the documentElement instead of document.body so that
  // when the user scrolls, the Popover will still see the anchor element as
  // having not scrolled.
  const offset = buildScreenCoordinates(plotContainer, x, y, yAxis);
  return (
    <SimpleTooltip
      anchorElt={document.documentElement}
      anchorOrigin={Popover.Origins.TOP_LEFT}
      offsetX={offset.x}
      offsetY={offset.y}
      popoverOrigin={Popover.Origins.BOTTOM_CENTER}
      rows={rows}
      subtitle={subtitle}
      title={title}
      showTip
      windowEdgeThreshold={-1000}
    />
  );
}

export default (React.memo(PlotlyTooltip): React.AbstractComponent<Props>);
