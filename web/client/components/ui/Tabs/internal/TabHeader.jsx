// @flow
import * as React from 'react';
import classNames from 'classnames';

import Heading from 'components/ui/Heading';

type Props = {
  isActive: boolean,
  name: string,
  onTabClick: (name: string) => void,
  marginRight: string | number,
  useLightWeightHeading: boolean,

  className: string,
  testId?: string,
};

const defaultProps = {
  className: '',
  testId: undefined,
};

export default function TabHeader(props: Props) {
  const {
    isActive,
    className,
    name,
    onTabClick,
    useLightWeightHeading,
    marginRight,
    testId,
  } = props;
  const onClick = () => onTabClick(name);
  const headingClassName = classNames('zen-tab-header__heading', className, {
    'zen-tab-header__heading--active': isActive,
    'zen-tab-header__heading--use-light-weight-heading': useLightWeightHeading,
  });

  return (
    <div
      className="zen-tab-header__outer-container"
      onClick={onClick}
      style={{ marginRight }}
      role="button"
      zen-test-id={testId}
    >
      <Heading.Small className={headingClassName}>{name}</Heading.Small>
    </div>
  );
}

TabHeader.defaultProps = defaultProps;
