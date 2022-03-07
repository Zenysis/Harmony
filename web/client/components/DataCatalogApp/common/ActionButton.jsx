// @flow
import * as React from 'react';
import classNames from 'classnames';

import Group from 'components/ui/Group';
import Icon from 'components/ui/Icon';
import type { IconType } from 'components/ui/Icon/types';

type Props = {
  iconType: IconType,
  label: string,
  onClick: () => void,

  disabled?: boolean,
};

export default function ActionButton({
  iconType,
  label,
  onClick,
  disabled = false,
}: Props): React.Element<'div'> {
  const className = classNames('dc-action-button', {
    'dc-action-button--disabled': disabled,
  });

  return (
    <div className={className} onClick={onClick} role="button">
      <Group.Horizontal alignItems="center" flex spacing="xs">
        <Icon type={iconType} />
        {label}
      </Group.Horizontal>
    </div>
  );
}
