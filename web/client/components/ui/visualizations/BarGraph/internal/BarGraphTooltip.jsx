// @flow
import * as React from 'react';

import Popover from 'components/ui/Popover';
import SimpleTooltip from 'components/ui/visualizations/common/SimpleTooltip';
import type {
  DataPoint,
  DimensionID,
  Metric,
} from 'components/ui/visualizations/BarGraph/types';
import type { HoverPoint } from 'components/ui/visualizations/types';

type Props = {
  dataPoint: DataPoint,
  dimensionFormatter: (dimensionID: DimensionID) => string,
  dimensionValueFormatter: (
    dimensionID: DimensionID,
    value: string | null,
  ) => string,
  metric: Metric,
  point: HoverPoint,
};

function BarGraphTooltip({
  dataPoint,
  dimensionFormatter,
  dimensionValueFormatter,
  metric,
  point,
}: Props) {
  const [containerElt, setContainerElt] = React.useState<?HTMLDivElement>(null);

  const { dimensions } = dataPoint;
  const rows = Object.keys(dimensions).map(dimensionID => ({
    label: dimensionFormatter(dimensionID),
    value: dimensionValueFormatter(dimensionID, dimensions[dimensionID]),
  }));
  rows.push({
    label: metric.displayName,
    value: metric.formatValue(dataPoint.metrics[metric.id]),
  });
  const style = {
    left: point.x,
    position: 'absolute',
    top: point.y,
  };

  return (
    <div className="bar-graph-tooltip" ref={setContainerElt} style={style}>
      <SimpleTooltip
        anchorElt={containerElt}
        isOpen={!!containerElt}
        offsetY={-10}
        popoverOrigin={Popover.Origins.BOTTOM_LEFT}
        rows={rows}
      />
    </div>
  );
}

export default (React.memo(BarGraphTooltip): React.AbstractComponent<Props>);
