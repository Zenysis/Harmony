// @flow
import * as React from 'react';

import Popover from 'components/ui/Popover';
import TooltipTable from 'components/ui/visualizations/common/SimpleTooltip/internal/TooltipTable';
import type { RowData } from 'components/ui/visualizations/common/SimpleTooltip/internal/TooltipTable';

type PopoverProps = React.ElementConfig<typeof Popover>;

type PopoverPassthroughProps = {
  anchorElt?: $PropertyType<PopoverProps, 'anchorElt'>,
  anchorOrigin?: $PropertyType<PopoverProps, 'anchorOrigin'>,
  flippedOffsetX?: $PropertyType<PopoverProps, 'flippedOffsetX'>,
  flippedOffsetY?: $PropertyType<PopoverProps, 'flippedOffsetY'>,
  offsetX?: $PropertyType<PopoverProps, 'offsetX'>,
  offsetY?: $PropertyType<PopoverProps, 'offsetY'>,
  popoverOrigin?: $PropertyType<PopoverProps, 'popoverOrigin'>,
  windowEdgeThreshold?: $PropertyType<PopoverProps, 'windowEdgeThreshold'>,
};

type Props = {
  rows: $ReadOnlyArray<RowData>,
  className?: string,
  contentClassName?: string,
  isOpen?: boolean,
  showTip?: boolean,
  subtitle?: string | void,
  title?: string | void,
  ...PopoverPassthroughProps,
};

/**
 * The SimpleTooltip provides a consistent tooltip style for when all you need
 * to display is a table with labels and values.
 */
function SimpleTooltip({
  rows,
  className = '',
  contentClassName = '',
  isOpen = true,
  showTip = false,
  subtitle = undefined,
  title = undefined,
  ...popoverProps
}: Props) {
  return (
    <Popover
      blurType={Popover.BlurTypes.DOCUMENT}
      className={`viz-simple-tooltip ${className}`}
      containerType={Popover.Containers.NONE}
      isOpen={isOpen}
      {...popoverProps}
    >
      <TooltipTable
        className={`viz-simple-tooltip__table ${contentClassName}`}
        rows={rows}
        subtitle={subtitle}
        title={title}
      />
      {showTip && <div className="viz-simple-tooltip__tip" />}
    </Popover>
  );
}

export default (React.memo(SimpleTooltip): React.AbstractComponent<Props>);
