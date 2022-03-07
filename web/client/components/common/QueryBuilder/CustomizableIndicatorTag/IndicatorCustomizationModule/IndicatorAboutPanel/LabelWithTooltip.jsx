// @flow
import * as React from 'react';

import Tooltip from 'components/ui/Tooltip';

type Props = {
  label: string,
  tooltipContent: React.Node,

  labelClassName?: string,
  popoverClassName?: string,
};

export default function LabelWithTooltip({
  label,
  tooltipContent,

  labelClassName = '',
  popoverClassName = '',
}: Props): React.Element<typeof Tooltip> {
  return (
    <Tooltip
      content={tooltipContent}
      popoverClassName={`label-with-tooltip__popover ${popoverClassName}`}
      targetClassName={`label-with-tooltip__label ${labelClassName}`}
      tooltipPlacement="right"
    >
      {label}
    </Tooltip>
  );
}
