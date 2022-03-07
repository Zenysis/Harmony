// @flow
import * as React from 'react';
import invariant from 'invariant';

import RequirementsDetails from 'components/AdvancedQueryApp/LiveResultsView/VisualizationPicker/ExploreView/RequirementsDetails';
import RequirementsSummaryCounts from 'components/AdvancedQueryApp/LiveResultsView/VisualizationPicker/ExploreView/RequirementsSummaryCounts';
import VisualizationPickerContext from 'components/AdvancedQueryApp/VisualizationPickerContext';
import type { StyleObject } from 'types/jsCore';

type Props = {
  /** Whether or not the DisabledView should render */
  show: boolean,

  style?: StyleObject | void,
};

/**
 * This is the view when a previously enabled visualization, while the user is
 * viewing that viz, suddenly becomes disabled.
 */
export default function DisabledView({
  show,
  style = undefined,
}: Props): React.Element<'div'> | null {
  const { displayedVisualizationType } = React.useContext(
    VisualizationPickerContext,
  );

  if (!show) {
    return null;
  }

  invariant(
    displayedVisualizationType !== undefined,
    'There must be a defined displayedVisualizationType',
  );
  return (
    <div className="visualization-picker-disabled-view" style={style}>
      <div className="visualization-picker-disabled-view__disabled-requirements">
        <div className="aqt-view-type-picker-btn-popover__title">
          <RequirementsSummaryCounts
            visualizationType={displayedVisualizationType}
          />
        </div>
        <RequirementsDetails visualizationType={displayedVisualizationType} />
      </div>
    </div>
  );
}
