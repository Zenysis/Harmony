// @flow
import computeRequirementsStatusMap from 'models/AdvancedQueryApp/VisualizationType/computeRequirementsStatusMap';
import { VISUALIZATION_TYPES } from 'models/AdvancedQueryApp/VisualizationType/registry';
import type QuerySelections from 'models/core/wip/QuerySelections';
import type {
  VisualizationType,
  VisualizationRequirementsTypes,
} from 'models/AdvancedQueryApp/VisualizationType/types';

/**
 * Given a query selections model, and the type of requirements to look at
 * ('CORE' vs 'LOOSE'), return an array of the visualization types that
 * satisfy all their requirements.
 */
export default function computeEnabledVisualizations(
  querySelections: QuerySelections,
  requirementsType?: VisualizationRequirementsTypes = 'CORE',
): $ReadOnlyArray<VisualizationType> {
  const vizRequirementsStatusMap = computeRequirementsStatusMap(
    querySelections,
    requirementsType,
  );
  const output = [];
  VISUALIZATION_TYPES.forEach(visualizationType => {
    const { field, grouping } = vizRequirementsStatusMap[visualizationType];
    const requirementsSatisfied =
      field.satisfied &&
      (grouping === undefined || grouping.every(c => c.satisfied));
    if (requirementsSatisfied) {
      output.push(visualizationType);
    }
  });
  return output;
}
