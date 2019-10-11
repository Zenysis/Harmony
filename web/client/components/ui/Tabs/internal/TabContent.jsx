// @flow
import * as React from 'react';
import classNames from 'classnames';

type Props = {
  children: React.Node,
  isActive: boolean,
};

export default function TabContent(props: Props) {
  const { children, isActive } = props;
  const className = classNames('zen-tab-content-wrapper', {
    'zen-tab-content-wrapper--active': isActive,
    'zen-tab-content-wrapper--hidden': !isActive,
  });
  return <div className={className}>{children}</div>;
}
