// @flow
import * as React from 'react';
import classNames from 'classnames';

import Icon from 'components/ui/Icon';
import Tooltip from 'components/ui/Tooltip';
import { noop } from 'util/util';
import type { IconType } from 'components/ui/Icon/types';

type Props = {
  iconType: IconType,
  onClick: () => void,
  title: string,

  className?: string,
  disabled?: boolean,
  testId?: string | void,
  tooltipText?: string | void,
};

/**
 * The DashboardControlButton is a common component that shows an icon and a
 * button title side-by-side. If the dashboard is in "collapsed" mode, then only
 * the icon will be shown.
 */
export default function DashboardControlButton({
  iconType,
  onClick,
  title,
  className = '',
  disabled = false,
  testId = undefined,
  tooltipText = undefined,
}: Props): React.Node {
  const fullClassName = classNames(`gd-dashboard-control-button ${className}`, {
    'gd-dashboard-control-button--disabled': disabled,
  });

  const onButtonClick = disabled ? noop : onClick;

  const button = (
    <div
      className={fullClassName}
      data-testid={testId}
      disabled={disabled}
      onClick={onButtonClick}
      role="button"
    >
      <Icon className="gd-dashboard-control-button__icon" type={iconType} />
      <div className="gd-dashboard-control-button__title">{title}</div>
    </div>
  );

  if (tooltipText === undefined) {
    return button;
  }

  return <Tooltip content={tooltipText}>{button}</Tooltip>;
}
