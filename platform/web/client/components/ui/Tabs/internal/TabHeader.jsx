// @flow
import * as React from 'react';
import classNames from 'classnames';

import Heading from 'components/ui/Heading';
import normalizeARIAName from 'components/ui/util/normalizeARIAName';

type Props = {
  className?: string,
  disabled?: boolean,
  isActive: boolean,
  marginRight: string | number,
  name: string,
  onTabClick: () => void,
  tabHeadingSize?: 'small' | 'medium' | 'large',
  testId?: string,

  // determines if the header should be rendered with a more light weight
  // style (no uppercase text-transform, and not bold).
  useLightWeightHeading: boolean,
};

export default function TabHeader({
  isActive,
  name,
  onTabClick,
  marginRight,
  useLightWeightHeading,
  className = '',
  disabled = false,
  tabHeadingSize = 'small',
  testId = undefined,
}: Props): React.Node {
  const headingClassName = classNames('zen-tab-header__heading', className, {
    'zen-tab-header__heading--active': isActive && !disabled,
    'zen-tab-header__heading--disabled': disabled,
    'zen-tab-header__heading--use-light-weight-heading': useLightWeightHeading,
  });
  const containerClassName = classNames('zen-tab-header__outer-container', {
    'zen-tab-header--disabled': disabled,
  });

  // TODO: convert to correct aria usage: removing aria-label,
  // switching role to tab, etc. update any custom renderHeaders as well
  return (
    <div
      aria-label={normalizeARIAName(name)}
      className={containerClassName}
      data-testid={testId}
      onClick={onTabClick}
      role="button"
      style={{ marginRight }}
    >
      <Heading className={headingClassName} size={tabHeadingSize}>
        {name}
      </Heading>
    </div>
  );
}
