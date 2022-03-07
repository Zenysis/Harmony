// @flow
import * as React from 'react';

import DataQuality from 'models/DataQualityApp/DataQuality';
import InfoTooltip from 'components/ui/InfoTooltip';
import LabelWrapper from 'components/ui/LabelWrapper';
import LoadingSpinner from 'components/ui/LoadingSpinner';
import Tag from 'components/ui/Tag';
import Tooltip from 'components/ui/Tooltip';
import { getScoreColor } from 'components/DataQualityApp/util';

type Props = { loading: boolean, dataQuality: DataQuality };

const DATA_QUALITY_ERROR_TEXT = t('DataQualityApp.DataQualityErrors');
const TEXT = t('DataQualityApp.DataQualitySummary.ScoreSummaryBadge');

function ScoreSummmaryBadge({ loading, dataQuality }: Props) {
  function renderBetaTag() {
    return (
      <Tag.Simple
        boldText
        className="dq-score-summary-badge__beta-tag"
        size={Tag.Sizes.MEDIUM}
        intent={Tag.Intents.DANGER}
      >
        {TEXT.beta}
      </Tag.Simple>
    );
  }

  function renderExplainer() {
    const tooltipContent = (
      <React.Fragment>
        {TEXT.explanationOne} <strong>{TEXT.explanationTwo}</strong>{' '}
        {TEXT.explanationThree}
      </React.Fragment>
    );

    return (
      <Tooltip
        content={tooltipContent}
        popoverClassName="dq-score-summary-badge__score-explanation-popover"
      >
        <div className="dq-score-summary-badge__score-explanation">
          <LabelWrapper label={TEXT.whatDoesThisMean} labelAfter inline>
            <InfoTooltip />
          </LabelWrapper>
        </div>
      </Tooltip>
    );
  }

  if (loading) {
    return (
      <div className="dq-score-summary-badge">
        {renderBetaTag()}
        <LoadingSpinner />
      </div>
    );
  }

  if (!dataQuality.success()) {
    return (
      <div className="dq-score-summary-badge">
        {renderBetaTag()}
        {DATA_QUALITY_ERROR_TEXT.lackOfDataError}
      </div>
    );
  }

  const scoreColor = getScoreColor(dataQuality.score(), dataQuality.maxScore());

  const badgeStyle = { borderTop: `5px solid ${scoreColor}` };

  const scoreStyle = { color: scoreColor };

  return (
    <div className="dq-score-summary-badge" style={badgeStyle}>
      {renderBetaTag()}
      <strong className="dq-score-summary-badge__title">
        {TEXT.qualityScore}
      </strong>
      <strong className="dq-score-summary-badge__score" style={scoreStyle}>
        {dataQuality.score()}/{dataQuality.maxScore()}
      </strong>
      {renderExplainer()}
    </div>
  );
}

export default (React.memo(ScoreSummmaryBadge): React.AbstractComponent<Props>);
