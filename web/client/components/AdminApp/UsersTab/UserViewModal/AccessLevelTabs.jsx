// @flow
import * as React from 'react';

import Icon from 'components/ui/Icon';
import Tab from 'components/ui/Tabs/Tab';
import TabHeader from 'components/ui/Tabs/internal/TabHeader';
import Tabs from 'components/ui/Tabs';

const TEXT = t('admin_app.UsersTab.UserViewModal.AccessLevelTabs');

type Props = {
  children: React.ChildrenArray<?React.Element<typeof Tab>>,
};

export default function AccessLevelTabs({
  children,
}: Props): React.Element<typeof Tabs> {
  const renderTabIcon = (name, onClick, isActive, tabIndex, disabled) => (
    <React.Fragment key={name}>
      <Icon
        type={name === TEXT.userAccess ? 'svg-person' : 'svg-people'}
        style={{ position: 'relative', top: '5px', left: '2px' }}
        onClick={onClick}
      />
      <TabHeader
        className="u-info-text"
        disabled={disabled}
        isActive={isActive}
        marginRight={0}
        name={name}
        onTabClick={onClick}
        useLightWeightHeading={false}
      />
    </React.Fragment>
  );
  return (
    <Tabs
      className="user-view-modal__access-level-tabs"
      renderHeader={renderTabIcon}
    >
      {children}
    </Tabs>
  );
}
