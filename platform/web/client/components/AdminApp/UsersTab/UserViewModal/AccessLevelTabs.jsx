// @flow
import * as React from 'react';

import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';
import Tab from 'components/ui/Tabs/Tab';
import TabHeader from 'components/ui/Tabs/internal/TabHeader';
import Tabs from 'components/ui/Tabs';

type Props = {
  children: React.ChildrenArray<?React.Element<typeof Tab>>,
};

export default function AccessLevelTabs({
  children,
}: Props): React.Element<typeof Tabs> {
  const renderTabIcon = (name, onClick, isActive, tabIndex, disabled) => (
    <React.Fragment key={name}>
      <Icon
        onClick={onClick}
        style={{ left: '2px', position: 'relative', top: '5px' }}
        type={name === I18N.text('Direct Access') ? 'svg-person' : 'svg-people'}
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
