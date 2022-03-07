// @flow
import * as React from 'react';

import AdminAppMenu from 'components/AdminApp/AdminAppMenu';
import AdminAppMenuOption from 'components/AdminApp/AdminAppMenu/AdminAppMenuOption';
import Card from 'components/ui/Card';
import Group from 'components/ui/Group';
import Icon from 'components/ui/Icon';
import InfoTooltip from 'components/ui/InfoTooltip';
import Popover from 'components/ui/Popover';
import useBoolean from 'lib/hooks/useBoolean';

type Props = {
  children: React.Node,
  menuOptions: React.ChildrenArray<React.Element<typeof AdminAppMenuOption>>,
  onCardClick: () => void,
  onRequestCloseMenu: () => void,
  onRequestOpenMenu: () => void,
  showMenu: boolean,
  title: string,

  isAdminCard?: boolean,
};

const TEXT = t('admin_app.AdminAppActionCard');

/**
 * This is a generic card wrapper class used in the Admin App. Currently used in
 * GroupsTab and RoleManagementTab. For a non-interactive card, simply use a
 * normal Card class
 */
export default function AdminAppActionCard({
  children,
  menuOptions,
  onCardClick,
  showMenu,
  onRequestCloseMenu,
  onRequestOpenMenu,
  title,
  isAdminCard = false,
}: Props): React.Element<typeof React.Fragment> {
  const [isMenuVisible, showMenuOnHover, hideMenuOnHover] = useBoolean(false);
  const [isTooltipVisible, showTooltip, hideTooltip] = useBoolean(false);
  const maybeIcon = isAdminCard ? (
    <Icon type="svg-star-in-circle" className="admin-app-card__admin-icon" />
  ) : null;
  const maybeTooltip = isAdminCard ? (
    <div id="admin-app-card-tooltip">
      <InfoTooltip />
    </div>
  ) : null;
  const menu = isMenuVisible ? (
    <AdminAppMenu
      onRequestCloseMenu={onRequestCloseMenu}
      onRequestOpenMenu={onRequestOpenMenu}
      showMenu={showMenu}
    >
      {menuOptions}
    </AdminAppMenu>
  ) : null;

  const titleSection = (
    <Group.Horizontal
      flex
      lastItemClassName={isMenuVisible ? 'admin-app-card__menu' : ''}
      spacing="xs"
    >
      {maybeIcon}
      {title}
      {maybeTooltip}
      {menu}
    </Group.Horizontal>
  );

  const onMouseOverCard = () => {
    showMenuOnHover();
    if (isAdminCard) {
      showTooltip();
    }
  };

  const onMouseLeaveCard = () => {
    hideMenuOnHover();
    if (isAdminCard) {
      hideTooltip();
    }
  };

  return (
    <React.Fragment>
      <span onMouseEnter={onMouseOverCard} onMouseLeave={onMouseLeaveCard}>
        <Card
          className="admin-app-card action-card"
          onClick={onCardClick}
          title={titleSection}
        >
          {children}
        </Card>
      </span>
      <Popover
        anchorElt="admin-app-card-tooltip"
        blurType={Popover.BlurTypes.DOCUMENT}
        className="admin-app-card__tooltip"
        isOpen={isTooltipVisible}
        onRequestClose={hideTooltip}
      >
        {TEXT.siteAdminTitleTooltip}
      </Popover>
    </React.Fragment>
  );
}
