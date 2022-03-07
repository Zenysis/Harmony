// @flow
import * as React from 'react';

import Tooltip from 'components/ui/Tooltip';

type Props = {
  children: React.Node,
  text: string,
};

export default function TooltipControlWrapper({
  children,
  text,
}: Props): React.Element<typeof Tooltip> {
  return (
    <Tooltip content={text} tooltipPlacement="top">
      {children}
    </Tooltip>
  );
}
