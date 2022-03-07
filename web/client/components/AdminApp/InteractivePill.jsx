// @flow
import * as React from 'react';
import classNames from 'classnames';

import Popover from 'components/ui/Popover';
// NOTE(yitian): There's no way to avoid this dependency cycle without duplicating
// code unfortunately.
// eslint-disable-next-line import/no-cycle
import StaticGroupCard from 'components/AdminApp/GroupsTab/StaticGroupCard';
import StaticRoleCard from 'components/AdminApp/RoleManagementTab/StaticRoleCard';
import Tag from 'components/ui/Tag';
import useBoolean from 'lib/hooks/useBoolean';
import type RoleDefinition from 'services/models/RoleDefinition';
import type SecurityGroup from 'services/models/SecurityGroup';

export type PillType = 'group' | 'role';

type Props = {
  pillType: PillType,

  className?: string,
  group?: SecurityGroup | void,
  role?: RoleDefinition | void,
};

export default function InteractivePill({
  group,
  pillType,
  role,
  className = '',
}: Props): React.Element<'div'> {
  const [isShowCard, showCard, hideCard] = useBoolean(false);
  const [pillElt, setPillElt] = React.useState<?HTMLDivElement>(undefined);

  const onMouseOver = event => {
    setPillElt(event.currentTarget);
    showCard();
  };

  const renderDisplayCard = () => {
    if (pillType === 'role') {
      return (
        role !== undefined && <StaticRoleCard key={role.label()} role={role} />
      );
    }
    return (
      group !== undefined && (
        <StaticGroupCard key={group.name()} group={group} />
      )
    );
  };

  const card = (
    <Popover
      anchorElt={pillElt}
      anchorOrigin={Popover.Origins.TOP_RIGHT}
      blurType={Popover.BlurTypes.DOCUMENT}
      containerType={Popover.Containers.NONE}
      isOpen={isShowCard}
      popoverOrigin={Popover.Origins.TOP_LEFT}
    >
      {renderDisplayCard()}
    </Popover>
  );

  let displayLabel = '';
  if (pillType === 'role' && role !== undefined) {
    displayLabel = role.label();
  } else if (group !== undefined) {
    displayLabel = group.name();
  }

  const pillClassName = classNames('admin-app-interactive-pill', className, {
    'admin-app-interactive-pill--clicked': isShowCard,
  });

  return (
    <div
      className="admin-app-interactive-pill__wrapper"
      onFocus={onMouseOver}
      onMouseEnter={onMouseOver}
      onBlur={hideCard}
      onMouseLeave={hideCard}
    >
      <Tag
        className={pillClassName}
        size={Tag.Sizes.SMALL}
        value={displayLabel}
      >
        {displayLabel}
      </Tag>
      {card}
    </div>
  );
}
