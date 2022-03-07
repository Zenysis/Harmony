// @flow
import * as React from 'react';

import Icon from 'components/ui/Icon';
import Tooltip from 'components/ui/Tooltip';
import type { IconType } from 'components/ui/Icon/types';
import type { StyleObject } from 'types/jsCore';

type Props = {
  iconClassName?: string,

  /** Can be used to define the color, margins, etc of the tooltip */
  iconStyle?: StyleObject,

  /** The text to display when hovering over the tooltip */
  text?: string,

  /** The icon type that this tooltip will use */
  iconType?: IconType,

  /** Onclick event for the icon. */
  onClick?: (event: SyntheticMouseEvent<HTMLSpanElement>) => void,

  /** Classname for the popover */
  popoverClassName?: string,

  /** Where the tooltip will be positioned relative to the icon */
  tooltipPlacement?: 'left' | 'right' | 'top' | 'bottom',
};

function InfoTooltip({
  iconClassName = '',
  iconStyle = undefined,
  text = undefined,
  iconType = 'svg-info-sign',
  onClick = undefined,
  popoverClassName = '',
  tooltipPlacement = 'bottom',
}: Props) {
  return (
    <Tooltip
      popoverClassName={`zen-info-tooltip__popover ${popoverClassName}`}
      targetClassName="zen-info-tooltip"
      content={text}
      tooltipPlacement={tooltipPlacement}
    >
      <Icon
        className={iconClassName}
        onClick={onClick}
        type={iconType}
        style={iconStyle}
      />
    </Tooltip>
  );
}

export default (React.memo(InfoTooltip): React.AbstractComponent<Props>);
