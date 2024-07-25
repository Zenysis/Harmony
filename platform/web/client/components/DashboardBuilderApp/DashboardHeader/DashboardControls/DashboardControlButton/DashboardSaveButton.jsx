// @flow
import * as React from 'react';
import classNames from 'classnames';

import DashboardControlButton from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardControlButton';
import I18N from 'lib/I18N';

type Props = {
  hasUnsavedChanges: boolean,
  onClick: () => void,
};

function DashboardSaveButton({ hasUnsavedChanges, onClick }: Props) {
  const className = classNames('gd-dashboard-save-button', {
    'gd-dashboard-save-button--unsaved-changes': hasUnsavedChanges,
  });

  return (
    <DashboardControlButton
      className={className}
      disabled={!hasUnsavedChanges}
      iconType="svg-download-outline"
      onClick={onClick}
      title={I18N.textById('Save')}
      tooltipText={
        hasUnsavedChanges ? I18N.text('Use Control-S to save') : undefined
      }
    />
  );
}

export default (React.memo(
  DashboardSaveButton,
): React.AbstractComponent<Props>);
