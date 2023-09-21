// @flow
import * as React from 'react';

import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import I18N from 'lib/I18N';
import QueryPanelToggleSwitch from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardSettingsModal/QueryPanelTab/QueryPanelToggleSwitch';

type Props = {
  onPanelAlignmentChange: (panelAlignment: 'LEFT' | 'TOP') => void,
  panelAlignment: 'LEFT' | 'TOP',
};

export default function QueryPanelOrientationSection({
  onPanelAlignmentChange,
  panelAlignment,
}: Props): React.Node {
  const toggleOrientation = () => {
    if (panelAlignment === 'LEFT') {
      onPanelAlignmentChange('TOP');
    } else {
      onPanelAlignmentChange('LEFT');
    }
  };

  return (
    <Group.Vertical
      className="gd-query-panel-tab-config-item gd-query-panel-tab-config-item__grouping"
      paddingBottom="l"
      spacing="l"
    >
      <Heading.Small>
        <I18N>Query Panel Orientation</I18N>
      </Heading.Small>
      <QueryPanelToggleSwitch
        header={I18N.text(
          'Align Filters and Group bys across the top of the dashboard',
        )}
        onChange={toggleOrientation}
        value={panelAlignment === 'TOP'}
      />
    </Group.Vertical>
  );
}
