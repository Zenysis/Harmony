// @flow
import * as React from 'react';

import Icon from 'components/ui/Icon';
import RequirementsSummaryCounts from 'components/AdvancedQueryApp/LiveResultsView/VisualizationPicker/ExploreView/RequirementsSummaryCounts';
import type { VisualizationType } from 'models/AdvancedQueryApp/VisualizationType/types';

const TEXT_PATH =
  'AdvancedQueryApp.LiveResultsView.VisualizationPicker.ExploreView.RequirementsSummary';
const TEXT = t(TEXT_PATH);

type Props = {
  visualizationType: VisualizationType | void,
};

/**
 * This component displays static text with instructions telling the user to
 * hover over a visualization to see its requirements. If a user has selected
 * a visualization (thus "locking" it in), or is hovering over a visualization,
 * then we display a summary count of how many criteria have been met.
 */
export default function RequirementsSummary({
  visualizationType,
}: Props): React.Element<'p' | 'div'> {
  let summaryText;
  if (visualizationType === undefined) {
    summaryText = (
      <p className="aqt-explore-view-reqs-summary__summary-text">
        {TEXT.instructionsText}
      </p>
    );
  } else {
    summaryText = (
      <RequirementsSummaryCounts visualizationType={visualizationType} />
    );
  }

  return (
    <div className="aqt-explore-view-reqs-summary">
      <Icon
        type="svg-flashlight"
        className="aqt-explore-view-reqs-summary__icon"
      />
      {summaryText}
    </div>
  );
}
