// @flow
import * as React from 'react';

import DraggableTilePill from 'components/DashboardBuilderApp/DashboardContainer/CommonSettingsPanel/DraggableTilePill';
import I18N from 'lib/I18N';


type Props = {};

/**
 * The BasicElementsSection provides a series of draggable buttons that
 * users can place on to a dashboard.
 */
function BasicElementsSection() {
  return (
    <div className="gd-dashboard-common-settings-panel__elements-block">
      <div className="gd-dashboard-common-settings-panel__section-title">
          {I18N.text('Basic Elements')}
      </div>

      <div className="gd-dashboard-common-settings-panel__pill-block">
        <DraggableTilePill icon="svg-chart" text={I18N.text('Visualization')} />
        <DraggableTilePill icon="svg-text" text={I18N.text('Text')}/>
        <DraggableTilePill icon="svg-iframe" text={I18N.text('iFrame')} />
      </div>

    </div>
  );
}

export default (React.memo(
  BasicElementsSection,
): React.AbstractComponent<Props>);
