// @flow
import * as React from 'react';

import AdminAppMenuOption from 'components/AdminApp/AdminAppMenu/AdminAppMenuOption';
import Group from 'components/ui/Group';
import Icon from 'components/ui/Icon';
import Popover from 'components/ui/Popover';

type Props = {
  children: React.ChildrenArray<React.Element<typeof AdminAppMenuOption>>,
  onRequestCloseMenu: () => void,
  onRequestOpenMenu: () => void,
  showMenu: boolean,

  className?: string,
};

/**
 * A menu wrapper used in the Admin App. Currently used in the cards for GroupsTab
 * and RoleManagementTab cards.
 */
export default function AdminAppMenu({
  children,
  onRequestCloseMenu,
  onRequestOpenMenu,
  showMenu,
  className = '',
}: Props): React.Element<'div'> {
  const [menuElt, setMenuElt] = React.useState<?HTMLSpanElement>(undefined);

  const onMenuClick = (event: SyntheticEvent<HTMLSpanElement>) => {
    setMenuElt(event.currentTarget);
    if (showMenu) {
      onRequestCloseMenu();
    } else {
      onRequestOpenMenu();
    }
    // Prevents role view modal from opening.
    event.stopPropagation();
  };

  return (
    <div className={`admin-app-card-menu ${className}`}>
      <Icon type="option-horizontal" onClick={onMenuClick} />
      <Popover
        anchorElt={menuElt}
        className="admin-app-card-menu"
        containerType="empty"
        isOpen={showMenu}
        onRequestClose={onRequestCloseMenu}
        anchorOrigin={Popover.Origins.TOP_RIGHT}
        popoverOrigin={Popover.Origins.TOP_LEFT}
      >
        <Group.Vertical
          alignItems="flex-start"
          flex
          itemClassName="admin-app-card-menu__option"
          spacing="none"
        >
          {children}
        </Group.Vertical>
      </Popover>
    </div>
  );
}
