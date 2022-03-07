// @flow
import * as React from 'react';

import Group from 'components/ui/Group';
import Icon from 'components/ui/Icon';
import type { IconType } from 'components/ui/Icon/types';

type Props = {
  iconType: IconType,
  onClick: () => void,
  text: string,
};

export default function AdminAppMenuOption({
  iconType,
  onClick,
  text,
}: Props): React.Element<'button'> {
  const onOptionClick = (event: SyntheticEvent<HTMLSpanElement>) => {
    onClick();
    // Prevents parent card component from rendering onclick callback.
    event.stopPropagation();
  };

  return (
    <button
      className="admin-app-card-menu__button"
      onClick={onOptionClick}
      type="button"
      data-testid={`${text
        .toLowerCase()
        .replace(' ', '')}-admin-app-menu-button`}
    >
      <Group.Horizontal spacing="m">
        <Icon type={iconType} />
        {text}
      </Group.Horizontal>
    </button>
  );
}
