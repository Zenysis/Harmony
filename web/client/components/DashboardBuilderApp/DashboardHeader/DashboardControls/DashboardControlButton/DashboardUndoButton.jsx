// @flow
import * as React from 'react';
import classNames from 'classnames';

import DashboardControlButton from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardControlButton';
import I18N from 'lib/I18N';

type Props = {
  hasUnsavedChanges: boolean,
  onClick: () => void,
};

function DashboardUndoButton({ hasUnsavedChanges, onClick }: Props) {
  const className = classNames({
    'gd-dashboard-undo-button--unsaved-changes': hasUnsavedChanges,
  });

  return (
    <DashboardControlButton
      className={className}
      disabled={!hasUnsavedChanges}
      iconType="svg-undo"
      onClick={onClick}
      title={I18N.text('Undo')}
      tooltipText={
        hasUnsavedChanges ? I18N.text('Undo all unsaved changes') : undefined
      }
    />
  );
}

export default (React.memo(
  DashboardUndoButton,
): React.AbstractComponent<Props>);
