// @flow
import * as React from 'react';
import classNames from 'classnames';

type Props = {
  children: React.Node,
  isActive: boolean,
  lazyLoad: boolean,

  containerType?: 'default' | 'no padding',
  className?: string | void,
};

export default function TabContent({
  children,
  isActive,
  lazyLoad,
  className = undefined,
  containerType = 'default',
}: Props): React.Element<'div'> | null {
  // if this tab should lazy-load, then we won't render anything until it is
  // active.
  if (lazyLoad && !isActive) {
    return null;
  }

  const fullClassName = classNames(className, 'zen-tab-content-wrapper', {
    'zen-tab-content-wrapper--active': isActive,
    'zen-tab-content-wrapper--hidden': !isActive,
    'zen-tab-content-wrapper--no-padding': containerType === 'no padding',
  });

  return <div className={fullClassName}>{children}</div>;
}
