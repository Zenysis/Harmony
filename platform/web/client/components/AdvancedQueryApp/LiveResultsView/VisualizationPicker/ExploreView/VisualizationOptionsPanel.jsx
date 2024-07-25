// @flow
import * as React from 'react';

import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import VisualizationOption from 'components/AdvancedQueryApp/LiveResultsView/VisualizationPicker/ExploreView/VisualizationOption';
import VisualizationPickerContext from 'components/AdvancedQueryApp/VisualizationPickerContext';
import {
  VISUALIZATION_GROUPINGS,
  VISUALIZATION_GROUP_ORDER,
} from 'models/AdvancedQueryApp/VisualizationType/registry';
import type {
  VisualizationGroup,
  VisualizationType,
} from 'models/AdvancedQueryApp/VisualizationType/types';

type Props = {
  hoveredVisualization: VisualizationType | void,

  // Callback for when a visualization option is hovered
  onVisualizationHover: VisualizationType => void,

  // Callback for when a visualization option is unhovered
  onVisualizationUnhover: () => void,
};

export default function VisualizationOptionsPanel({
  hoveredVisualization,
  onVisualizationHover,
  onVisualizationUnhover,
}: Props): React.Element<'div'> {
  const { enabledVisualizationTypes, lockedVisualization } = React.useContext(
    VisualizationPickerContext,
  );

  function renderVisualizationGroup(group: VisualizationGroup) {
    const { name, visualizations } = VISUALIZATION_GROUPINGS[group];
    return (
      <Group.Vertical key={group} spacing="xs">
        <Heading.Small className="visualization-picker-explore-view__group-header">
          {name}
        </Heading.Small>
        <Group.Horizontal flex spacing="none" style={{ flexWrap: 'wrap' }}>
          {visualizations.map((visualizationType: VisualizationType) => (
            <VisualizationOption
              key={visualizationType}
              isEnabled={enabledVisualizationTypes.includes(visualizationType)}
              isHovered={visualizationType === hoveredVisualization}
              isLocked={visualizationType === lockedVisualization}
              onVisualizationHover={onVisualizationHover}
              onVisualizationUnhover={onVisualizationUnhover}
              visualizationType={visualizationType}
            />
          ))}
        </Group.Horizontal>
      </Group.Vertical>
    );
  }

  return (
    <div className="visualization-picker-explore-view__options-panel">
      {VISUALIZATION_GROUP_ORDER.map(renderVisualizationGroup)}
    </div>
  );
}
