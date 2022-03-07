// @flow
import invariant from 'invariant';

import * as Zen from 'lib/Zen';
import isGeographyDimension from 'models/core/wip/Dimension/isGeographyDimension';
import {
  VISUALIZATION_REQUIREMENTS,
  LOOSE_VISUALIZATION_REQUIREMENTS,
  VISUALIZATION_TYPES,
} from 'models/AdvancedQueryApp/VisualizationType/registry';
import type QuerySelections from 'models/core/wip/QuerySelections';
import type { GroupingItem } from 'models/core/wip/GroupingItem/types';
import type {
  VisualizationCriteria,
  VisualizationGroupingCriteria,
  VisualizationRequirementStatus,
  VisualizationRequirementStatusMap,
  VisualizationRequirementsTypes,
} from 'models/AdvancedQueryApp/VisualizationType/types';

// A breakdown from grouping item type to count.
type GroupingBreakdown = {
  +DIMENSION: number,
  +GEOGRAPHY: number,
  +TIME: number,
};

function _isCriteriaSatisfied(
  criteria: VisualizationCriteria | VisualizationGroupingCriteria,
  count: number,
): boolean {
  const { max, min } = criteria;
  return count >= min && (max === undefined || count <= max);
}

/**
 * Compute the count of each grouping type found in the list.
 */
export function buildGroupingBreakdown(
  groups: Zen.Array<GroupingItem>,
): GroupingBreakdown {
  const groupingBreakdown = {
    DIMENSION: 0,
    GEOGRAPHY: 0,
    TIME: 0,
  };

  groups.forEach(item => {
    // NOTE(stephen): Time groupings are also Dimension groupings in this
    // current structure, since the mockups lump them all into "group by"
    // requirements. Maybe they should be renamed?
    groupingBreakdown.DIMENSION += 1;
    if (item.tag === 'GROUPING_GRANULARITY') {
      groupingBreakdown.TIME += 1;
      return;
    }

    invariant(
      item.tag === 'GROUPING_DIMENSION',
      'Item must be a GroupingDimension at this stage.',
    );
    if (isGeographyDimension(item.dimension())) {
      groupingBreakdown.GEOGRAPHY += 1;
    }
  });
  return groupingBreakdown;
}

/**
 * Given a list of grouping criteria, determine if the provided groups satisfy
 * each criteria provided.
 */
export function evaluateGroupingRequirements(
  groupingRequirements: $ReadOnlyArray<VisualizationGroupingCriteria> | void,
  groupingBreakdown: GroupingBreakdown,
): $PropertyType<VisualizationRequirementStatus, 'grouping'> {
  if (groupingRequirements === undefined) {
    return undefined;
  }

  // NOTE(stephen): If the DIMENSION type appears at the same time as a TIME
  // or GEOGRAPHY type, then the DIMENSION requirements represent the number
  // of groupings needed *after the more specific types are accounted for*. So
  // if the criteria specifies:
  // [ { type: 'TIME', min: 1, max: 1 }, { type: 'DIMENSION', min: 1, max: 1 }]
  // then this means the user must select 1 time grouping and also one non-time
  // grouping. See `computeStatusMap.js` for the implementation. If only
  // DIMENSION is provided, then it does not matter what the grouping types are.
  const trueBreakdown = { ...groupingBreakdown };
  groupingRequirements.forEach(({ type }) => {
    if (type !== 'DIMENSION') {
      trueBreakdown.DIMENSION -= trueBreakdown[type];
    }
  });

  return groupingRequirements.map(criteria => ({
    satisfied: _isCriteriaSatisfied(criteria, trueBreakdown[criteria.type]),
    type: criteria.type,
  }));
}

/**
 * Given a QuerySelections model, figure out which visualizations requirements
 * are satisfied or not.
 */
// TODO(pablo, stephen): clean up the requirements status calculations
export default function computeRequirementsStatusMap(
  querySelections: QuerySelections,
  requirementsType: VisualizationRequirementsTypes = 'CORE',
): VisualizationRequirementStatusMap {
  const numFields = querySelections.fields().size();
  const groupingBreakdown = buildGroupingBreakdown(querySelections.groups());
  const output = {};
  const VIZ_REQUIREMENTS =
    requirementsType === 'CORE'
      ? VISUALIZATION_REQUIREMENTS
      : LOOSE_VISUALIZATION_REQUIREMENTS;
  VISUALIZATION_TYPES.forEach(visualizationType => {
    const { field, grouping } = VIZ_REQUIREMENTS[visualizationType];
    output[visualizationType] = {
      field: { satisfied: _isCriteriaSatisfied(field, numFields) },
      grouping: evaluateGroupingRequirements(grouping, groupingBreakdown),
    };
  });
  return output;
}
