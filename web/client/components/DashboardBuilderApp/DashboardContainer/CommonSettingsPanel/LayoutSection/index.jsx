// @flow
import * as React from 'react';

import DraggableTilePill from 'components/DashboardBuilderApp/DashboardContainer/CommonSettingsPanel/DraggableTilePill';
import I18N from 'lib/I18N';


type Props = {};

/**
 * The LayoutSection provides a series of draggable buttons that
 * users can place on to a dashboard.
 */
function LayoutSection() {
  return (
    <div className="gd-dashboard-common-settings-panel__elements-block">
      <div className="gd-dashboard-common-settings-panel__section-title">
          {I18N.text('Layout')}
      </div>
      <div className="gd-dashboard-common-settings-panel__pill-block">
        <DraggableTilePill icon="svg-add" text={I18N.text('Spacer')} />
        <DraggableTilePill icon="svg-horizontal-split" text={I18N.text('Divider')} />
      </div>
    </div>
  );
}

export default (React.memo(
  LayoutSection,
): React.AbstractComponent<Props>);
