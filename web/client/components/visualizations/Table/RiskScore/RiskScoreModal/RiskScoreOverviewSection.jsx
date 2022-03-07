// @flow
import * as React from 'react';

import Group from 'components/ui/Group';
import { OVERVIEW_DOC_LINK } from 'components/visualizations/Table/RiskScore/RiskScoreModal/defaults';
import { RISK_SCORE_TEXT } from 'components/visualizations/Table/RiskScore/defaults';

const TEXT = RISK_SCORE_TEXT.RiskScoreModal.RiskScoreOverviewSection;

type Props = {
  itemId: string | number,
  score: string | number,
};

export default function RiskScoreOverviewSection({
  itemId,
  score,
}: Props): React.Node {
  // HACK(nina): Throughout this function, we need to bold parts of the text.
  // We should absolutely look to solutions for better standardizing string/
  // component interpolation.

  function renderExamples() {
    // Overriding font size to match with the default size of the rest of
    // the modal
    return (
      <Group.Vertical className="risk-score-examples" style={{ fontSize: 16 }}>
        <p>{TEXT.disclaimer.examples.intro}</p>
        <ol>
          <li>
            <strong>{TEXT.disclaimer.examples.missingVariables.start}</strong>
            {TEXT.disclaimer.examples.missingVariables.end}
          </li>
          <li>
            <strong>{TEXT.disclaimer.examples.missingValues.start}</strong>
            {TEXT.disclaimer.examples.missingValues.end}
          </li>
          <li>
            <strong>{TEXT.disclaimer.examples.trainingData.start}</strong>
            {TEXT.disclaimer.examples.trainingData.end}
          </li>
        </ol>
      </Group.Vertical>
    );
  }

  function renderDisclaimer() {
    return (
      <Group.Vertical spacing="m">
        <p>{TEXT.disclaimer.start}</p>
        <p>
          <strong>{TEXT.disclaimer.end}</strong>
        </p>
        {renderExamples()}
      </Group.Vertical>
    );
  }
  function renderSummary() {
    return (
      <Group.Horizontal className="risk-score-summary-section" spacing="m">
        <div className="risk-score-summary-section__details">
          <p>{`${TEXT.summary.swId} ${itemId}`}</p>
          <p>{`${TEXT.summary.probabilityScore} ${score}`}</p>
        </div>
        <Group.Item className="risk-score-summary-section__summary">
          <p>
            <strong>{TEXT.summary.overview.start}</strong>
            {TEXT.summary.overview.middle}
            <a
              href={OVERVIEW_DOC_LINK}
              target="_blank"
              rel="noopener noreferrer"
            >
              {TEXT.summary.overview.end}
            </a>
          </p>
        </Group.Item>
      </Group.Horizontal>
    );
  }

  return (
    <Group.Vertical className="risk-score-overview-section" spacing="m">
      {renderSummary()}
      {renderDisclaimer()}
      <p>{RISK_SCORE_TEXT.RiskScoreModal.questionsConcerns}</p>
    </Group.Vertical>
  );
}
