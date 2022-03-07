// @flow
import * as React from 'react';

import Popover from 'components/ui/Popover';
import SimpleTooltip from 'components/ui/visualizations/common/SimpleTooltip';
import type {
  Bucket,
  DimensionID,
  MetricID,
} from 'components/ui/visualizations/EpiCurve/types';
import type { HoverPoint } from 'components/ui/visualizations/types';

type Props = {
  metricFormatter: (metricID: MetricID) => string,
  metricValueFormatter: (
    metricID: MetricID,
    metricValue: number | null,
  ) => string,
  // metricValueFormatter: (number | null ) => string,
  timeFormatter: DimensionID => string,
  tooltipData: {
    bucket: Bucket,
    point: HoverPoint,
  },
};

// TODO(stephen, sophie): I am not adding this text to the translations file
// since we should receive the actual name of the date grouping to be more
// useful. This could be combined with a dimension formatter so that we can show
// dimension data too (or move timestamp into dimensions).Alternatively, allow
// the user of EpiCurve to handle tooltip rendering on their own.
const TEXT = {
  date: 'Date',
};

export default function EpiCurveTooltip({
  metricFormatter,
  metricValueFormatter,
  timeFormatter,
  tooltipData,
}: Props): React.Node {
  const [containerElt, setContainerElt] = React.useState<?HTMLDivElement>(null);
  const { bucket, point } = tooltipData;
  const rows = [
    {
      label: TEXT.date,
      value: timeFormatter(bucket.timestamp),
    },
  ];
  bucket.bars.forEach(({ metrics }) => {
    // NOTE(sophie): Using only the first metric for now.
    const metric = Object.keys(metrics)[0];
    rows.push({
      label: metricFormatter(metric),
      value: metricValueFormatter(metric, metrics[metric]),
    });
  });
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
        offsetY={-10}
        popoverOrigin={Popover.Origins.BOTTOM_LEFT}
        rows={rows}
      />
    </div>
  );
}
