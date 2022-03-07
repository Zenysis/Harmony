// @flow
import * as React from 'react';

import {
  VISUALIZATION_REQUIREMENTS,
  VISUALIZATION_TYPES,
} from 'models/AdvancedQueryApp/VisualizationType/registry';
import type {
  VisualizationRequirementStatusMap,
  VisualizationType,
} from 'models/AdvancedQueryApp/VisualizationType/types';

/**
 * This context holds global state shared among the VisualizationPicker
 * component hierarchy.
 */
type VisualizationPickerContext = {
  /**
   * An array of all visualization types that have satisfied all of their
   * criteria, and can be rendered.
   */
  enabledVisualizationTypes: $ReadOnlyArray<VisualizationType>,

  /** Track which visualization is being hovered over in the Explore view */
  lockedVisualization: VisualizationType | void,

  /**
   * A map of each visualization type to its requirements status (which tells us
   * which criteria to render the visualization have been satisfied or not).
   */
  vizRequirementsStatusMap: VisualizationRequirementStatusMap,

  /** Track the visualization currently being displayed */
  displayedVisualizationType: VisualizationType | void,

  /**
   * An array of all visualization types that have satisfied all of their
   * loose requirements.
   */
  looselyEnabledVisualizationTypes: $ReadOnlyArray<VisualizationType>,
};

// Get the initial visualization requirements status map, where each viz type maps
// to being non-satisfied
function getInitialVizRequirementsStatusMap(): VisualizationRequirementStatusMap {
  const result = {};
  VISUALIZATION_TYPES.forEach(visualizationType => {
    const groupingRequirements =
      VISUALIZATION_REQUIREMENTS[visualizationType].grouping;
    result[visualizationType] = {
      field: { satisfied: false },
      grouping:
        groupingRequirements === undefined
          ? undefined
          : groupingRequirements.map(({ type }) => ({
              type,
              satisfied: false,
            })),
    };
  });
  return result;
}

export default (React.createContext({
  enabledVisualizationTypes: [],
  lockedVisualization: undefined,
  looselyEnabledVisualizationTypes: [],
  vizRequirementsStatusMap: getInitialVizRequirementsStatusMap(),
  displayedVisualizationType: undefined,
}): React.Context<VisualizationPickerContext>);
