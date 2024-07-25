// @flow
import * as React from 'react';

import I18N from 'lib/I18N';
import ToggleSwitch from 'components/ui/ToggleSwitch';

type Props = {
  onTogglePresentingMode: () => void,
  presenting: boolean,
};

/**
 * A toggle switch for switching between present and edit modes on the dashboard
 * app.
 */
function EditPresentToggle({
  onTogglePresentingMode,
  presenting,
}: Props): React.Node {
  return (
    <div className="gd-dashboard-header__presentation-toggle">
      <ToggleSwitch
        disabledLabel={I18N.text('Edit', 'editMode')}
        enabledLabel={I18N.text('Present', 'presentMode')}
        highlightEnabledState={false}
        onChange={onTogglePresentingMode}
        value={presenting}
      />
    </div>
  );
}

export default (React.memo(EditPresentToggle): React.AbstractComponent<Props>);
