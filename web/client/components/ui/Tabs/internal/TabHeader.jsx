// @flow
import * as React from 'react';
import classNames from 'classnames';

import Heading from 'components/ui/Heading';
import normalizeARIAName from 'components/ui/util/normalizeARIAName';

type Props = {
  isActive: boolean,
  name: string,
  onTabClick: () => void,
  marginRight: string | number,

  // determines if the header should be rendered with a more light weight
  // style (no uppercase text-transform, and not bold).
  useLightWeightHeading: boolean,

  className?: string,
  disabled?: boolean,
  testId?: string,
  tabHeadingSize?: 'small' | 'medium' | 'large',
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
    'zen-tab-header__heading--use-light-weight-heading': useLightWeightHeading,
    'zen-tab-header__heading--disabled': disabled,
  });
  const containerClassName = classNames('zen-tab-header__outer-container', {
    'zen-tab-header--disabled': disabled,
  });

  // TODO(abby): convert to correct aria usage: removing aria-label,
  // switching role to tab, etc. update any custom renderHeaders as well
  return (
    <div
      aria-label={normalizeARIAName(name)}
      className={containerClassName}
      onClick={onTabClick}
      style={{ marginRight }}
      role="button"
      data-testid={testId}
    >
      <Heading size={tabHeadingSize} className={headingClassName}>
        {name}
      </Heading>
    </div>
  );
}
