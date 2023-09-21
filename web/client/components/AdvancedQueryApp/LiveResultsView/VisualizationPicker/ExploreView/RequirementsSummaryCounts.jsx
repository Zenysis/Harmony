// @flow
import * as React from 'react';

import I18N from 'lib/I18N';
import VisualizationPickerContext from 'components/AdvancedQueryApp/VisualizationPickerContext';
import { VISUALIZATION_INFO } from 'models/AdvancedQueryApp/VisualizationType/registry';
import type {
  VisualizationRequirementStatus,
  VisualizationType,
} from 'models/AdvancedQueryApp/VisualizationType/types';

type Props = {
  visualizationType: VisualizationType,
};

function countRequirementsSatisfied(
  reqsStatus: VisualizationRequirementStatus,
): { numCriteria: number, numSatisfied: number } {
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
  return { numCriteria, numSatisfied };
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
  const { numCriteria, numSatisfied } = countRequirementsSatisfied(reqsStatus);
  const vizName = VISUALIZATION_INFO[visualizationType].name;

  const summaryText = I18N.text(
    '%(vizName)s: %(numSatisfied)s of %(numCriteria)s requirements fulfilled',
    {
      numCriteria,
      numSatisfied,
      vizName,
    },
  );

  return (
    <p className="aqt-explore-view-reqs-summary__summary-text--bold">
      {summaryText}
    </p>
  );
}
