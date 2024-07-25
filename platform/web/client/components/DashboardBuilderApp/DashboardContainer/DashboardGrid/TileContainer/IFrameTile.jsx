// @flow
import * as React from 'react';

import type DashboardIFrameItem from 'models/DashboardBuilderApp/DashboardItem/DashboardIFrameItem';

type Props = {
  item: DashboardIFrameItem,
};

/**
 * The IFrameTile renders content from an external URL inside an iframe within
 * the tile.
 */
function IFrameTile({ item }: Props) {
  return (
    <div className="gd-dashboard-iframe-tile">
      <div className="gd-dashboard-iframe-tile__title">{item.title()}</div>
      <iframe
        className="gd-dashboard-iframe-tile__iframe"
        src={item.iFrameURL()}
        title={item.title()}
      />
    </div>
  );
}

export default (React.memo(IFrameTile): React.AbstractComponent<Props>);
