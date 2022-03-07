// @flow
import * as React from 'react';
import classNames from 'classnames';

import Group from 'components/ui/Group';
import Icon from 'components/ui/Icon';

type Props = {
  isActive: boolean,
  name: string,
  onClick: () => void,
};

export default function AccordionItemHeader({
  isActive,
  name,
  onClick,
}: Props): React.Node {
  const iconType = isActive ? 'svg-caret-down' : 'svg-caret-right';

  const className = classNames({
    'zen-accordion-item-header--active': isActive,
    'zen-accordion-item-header--inactive': !isActive,
  });

  return (
    <div className={className} onClick={onClick} role="button">
      <Group.Horizontal
        className="u-paragraph-text"
        flex
        paddingX="l"
        paddingY="m"
      >
        <Group.Item flex alignItems="center">
          <Icon type={iconType} />
        </Group.Item>
        {name}
      </Group.Horizontal>
    </div>
  );
}
