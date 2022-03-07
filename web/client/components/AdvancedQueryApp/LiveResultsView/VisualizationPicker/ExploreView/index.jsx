// @flow
import * as React from 'react';

import RequirementsDetails from 'components/AdvancedQueryApp/LiveResultsView/VisualizationPicker/ExploreView/RequirementsDetails';
import RequirementsSummary from 'components/AdvancedQueryApp/LiveResultsView/VisualizationPicker/ExploreView/RequirementsSummary';
import VisualizationOptionsPanel from 'components/AdvancedQueryApp/LiveResultsView/VisualizationPicker/ExploreView/VisualizationOptionsPanel';
import VisualizationPickerContext from 'components/AdvancedQueryApp/VisualizationPickerContext';
import type { StyleObject } from 'types/jsCore';
import type { VisualizationType } from 'models/AdvancedQueryApp/VisualizationType/types';

type Props = {
  /** Whether or not the ExploreView should render */
  show: boolean,

  style?: StyleObject | void,
};

/**
 * This is the view where the user can explore the different visualizations
 * available and all the requirements needed to render them.
 */
export default function ExploreView({
  show,
  style = undefined,
}: Props): React.Element<'div'> | null {
  const { lockedVisualization } = React.useContext(VisualizationPickerContext);
  const [
    hoveredVisualization,
    setHoveredVisualization,
  ] = React.useState<VisualizationType | void>(undefined);

  const onVisualizationHover = React.useCallback(
    visualizationType => setHoveredVisualization(visualizationType),
    [],
  );
  const onVisualizationUnhover = React.useCallback(
    () => setHoveredVisualization(undefined),
    [],
  );

  if (!show) {
    return null;
  }

  const visualizationTypeForRequirementsPanel =
    hoveredVisualization || lockedVisualization;

  return (
    <div
      className="visualization-picker-explore-view"
      style={style}
      data-testid="visualization-picker-explore-view"
    >
      <div className="visualization-picker-explore-view__reqs-panel">
        <RequirementsSummary
          visualizationType={visualizationTypeForRequirementsPanel}
        />
        <RequirementsDetails
          visualizationType={visualizationTypeForRequirementsPanel}
        />
      </div>
      <VisualizationOptionsPanel
        hoveredVisualization={hoveredVisualization}
        onVisualizationHover={onVisualizationHover}
        onVisualizationUnhover={onVisualizationUnhover}
      />
    </div>
  );
}
