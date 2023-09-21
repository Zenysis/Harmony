// @flow
import * as React from 'react';

import InfoTooltip from 'components/ui/InfoTooltip';

type Props = {
  className?: string,
  onClick?: () => void,
  tooltipPlacement?: 'left' | 'right' | 'top' | 'bottom',
  tooltipText?: string | void,
};

export default function RemoveItemButton({
  className = '',
  onClick = undefined,
  tooltipPlacement = 'top',
  tooltipText = undefined,
}: Props): React.Element<'div'> {
  return (
    <div
      className={`remove-item-button ${className}`}
      onClick={onClick}
      role="button"
    >
      <InfoTooltip
        iconType="trash"
        text={tooltipText}
        tooltipPlacement={tooltipPlacement}
      />
    </div>
  );
}
