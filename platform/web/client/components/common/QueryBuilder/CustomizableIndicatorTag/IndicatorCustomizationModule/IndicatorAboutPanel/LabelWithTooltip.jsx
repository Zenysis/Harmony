// @flow
import * as React from 'react';

import Tooltip from 'components/ui/Tooltip';

type Props = {
  label: string,
  labelClassName?: string,
  popoverClassName?: string,
  tooltipContent: React.Node,
};

export default function LabelWithTooltip({
  label,
  labelClassName = '',

  popoverClassName = '',
  tooltipContent,
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
