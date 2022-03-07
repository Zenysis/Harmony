// @flow
import * as React from 'react';

import RequirementsDetails from 'components/AdvancedQueryApp/LiveResultsView/VisualizationPicker/ExploreView/RequirementsDetails';
import RequirementsSummaryCounts from 'components/AdvancedQueryApp/LiveResultsView/VisualizationPicker/ExploreView/RequirementsSummaryCounts';
import type { VisualizationType } from 'models/AdvancedQueryApp/VisualizationType/types';

type Props = {
  visualizationType: VisualizationType,
};

/**
 * This component displays a visualization's requirements status when the
 * VisualizationTypePickerButton is hovered over in the top ControlBar.
 */
export default function CompactRequirements({
  visualizationType,
}: Props): React.Element<'div'> {
  return (
    <div>
      <div className="aqt-view-type-picker-btn-popover__title">
        <RequirementsSummaryCounts visualizationType={visualizationType} />
      </div>
      <RequirementsDetails
        className="aqt-view-type-picker-btn-popover__requirements"
        visualizationType={visualizationType}
      />
    </div>
  );
}
