// @flow
import * as React from 'react';

import DataQuality from 'models/DataQualityApp/DataQuality';
import I18N from 'lib/I18N';
import InfoTooltip from 'components/ui/InfoTooltip';
import LabelWrapper from 'components/ui/LabelWrapper';
import LoadingSpinner from 'components/ui/LoadingSpinner';
import Tag from 'components/ui/Tag';
import Tooltip from 'components/ui/Tooltip';
import { getScoreColor } from 'components/DataQualityApp/util';

type Props = { dataQuality: DataQuality, loading: boolean };

function ScoreSummmaryBadge({ dataQuality, loading }: Props) {
  function renderBetaTag() {
    return (
      <Tag.Simple
        boldText
        className="dq-score-summary-badge__beta-tag"
        intent={Tag.Intents.DANGER}
        size={Tag.Sizes.MEDIUM}
      >
        {I18N.text('beta')}
      </Tag.Simple>
    );
  }

  function renderExplainer() {
    const tooltipContent = (
      <React.Fragment>
        {I18N.text(
          'This score aims to quantify the reporting and data quality for this indicator based on the factors detailed in each of the below tabs.',
        )}{' '}
        <strong>
          {I18N.text(
            'It should not be taken as an authoritative score on its own. It can be used to prioritize between indicators and as a starting point to investigate and isolate issues using the tools provided below.',
          )}
        </strong>{' '}
        {I18N.text(
          'There may be quality issues which are not accounted for in the score and some indicators may have a low score where there is no real quality issue. Examples include cases where there is strong seasonality or a non-standard reporting cadence and structure. These cases should be observable with the tools below by an analyst with programmatic knowledge.',
        )}
      </React.Fragment>
    );

    return (
      <Tooltip
        content={tooltipContent}
        popoverClassName="dq-score-summary-badge__score-explanation-popover"
      >
        <div className="dq-score-summary-badge__score-explanation">
          <LabelWrapper
            inline
            label={I18N.text('What does this mean?')}
            labelAfter
          >
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
        {I18N.text(
          'Could not compute a quality score for this indicator due to lack of data.',
          'lackOfDataErrorForQualityScore',
        )}
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
        {I18N.text('Quality Score')}
      </strong>
      <strong className="dq-score-summary-badge__score" style={scoreStyle}>
        {dataQuality.score()}/{dataQuality.maxScore()}
      </strong>
      {renderExplainer()}
    </div>
  );
}

export default (React.memo(ScoreSummmaryBadge): React.AbstractComponent<Props>);
