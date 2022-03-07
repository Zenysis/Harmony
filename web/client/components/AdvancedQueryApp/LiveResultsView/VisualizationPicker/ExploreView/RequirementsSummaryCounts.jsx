// @flow
import * as React from 'react';

import VisualizationPickerContext from 'components/AdvancedQueryApp/VisualizationPickerContext';
import { VISUALIZATION_INFO } from 'models/AdvancedQueryApp/VisualizationType/registry';
import type {
  VisualizationRequirementStatus,
  VisualizationType,
} from 'models/AdvancedQueryApp/VisualizationType/types';

type Props = {
  visualizationType: VisualizationType,
};

const TEXT_PATH =
  'AdvancedQueryApp.LiveResultsView.VisualizationPicker.ExploreView.RequirementsSummary';

function countRequirementsSatisfied(
  reqsStatus: VisualizationRequirementStatus,
): { numSatisfied: number, numCriteria: number } {
  const { field, grouping } = reqsStatus;
  // get total number of criteria (there is always at least 1 because every viz
  // has a field requirement)
  const numCriteria = 1 + (grouping ? grouping.length : 0);

  // count how many groupings have been satisfied
  const numGroupsSatisfied =
    grouping === undefined
      ? 0
      : grouping.reduce((num, g) => num + Number(g.satisfied), 0);
  const numSatisfied = numGroupsSatisfied + Number(field.satisfied);
  return { numSatisfied, numCriteria };
}

/**
 * When a user has selected a visualization, we display a summary count of
 * how many criteria have been met. E.g. "X of Y requirements fulfilled"
 */
export default function RequirementsSummaryCounts({
  visualizationType,
}: Props): React.Element<'p'> {
  const { vizRequirementsStatusMap } = React.useContext(
    VisualizationPickerContext,
  );
  const reqsStatus = vizRequirementsStatusMap[visualizationType];
  const { numSatisfied, numCriteria } = countRequirementsSatisfied(reqsStatus);
  const vizName = VISUALIZATION_INFO[visualizationType].name;

  const summaryText = t('reqsSummary', {
    vizName,
    numSatisfied,
    numCriteria,
    scope: TEXT_PATH,
  });

  return (
    <p className="aqt-explore-view-reqs-summary__summary-text--bold">
      {summaryText}
    </p>
  );
}
