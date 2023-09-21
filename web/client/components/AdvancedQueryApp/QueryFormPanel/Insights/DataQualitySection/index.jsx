// @flow
import * as React from 'react';
import classNames from 'classnames';

import DataQualityActionCard from 'components/AdvancedQueryApp/QueryFormPanel/Insights/DataQualityActionCard';
import DataQualityInsightSummary from 'models/AdvancedQueryApp/Insights/DataQualityInsight/DataQualityInsightSummary';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import I18N from 'lib/I18N';
import InfoTooltip from 'components/ui/InfoTooltip';
import InsightsSubsection from 'components/AdvancedQueryApp/QueryFormPanel/Insights/InsightsSubsection/InsightsSubsection';
import OverallScoreCard from 'components/common/DataQuality/OverallScoreCard';
import { getDisplayScore } from 'components/AdvancedQueryApp/QueryFormPanel/Insights/util';
import { getScoreColor } from 'components/DataQualityApp/util';
import type { DataQualityScore } from 'models/AdvancedQueryApp/Insights/DataQualityInsight/types';
import type { QueryFilterItem } from 'models/core/wip/QueryFilterItem/types';

type Props = {
  dataQualityInsights: DataQualityInsightSummary,
  fieldId: string,
  filters: $ReadOnlyArray<QueryFilterItem>,
};

// When there is no data quality score, insights backend will return values of 0.
function hasValidScore(score: DataQualityScore) {
  return score.maxScore !== 0;
}

/* eslint-disable react/no-array-index-key */
// NOTE: disabling because key id doesn't exist in insights so we're
// using the item index while looping.
export default class DataQualitySection extends React.PureComponent<Props> {
  maybeRenderActionCards(): React.Node {
    const { dataQualityInsights, fieldId, filters } = this.props;

    if (!hasValidScore(dataQualityInsights.overallScore())) {
      return null;
    }

    const actionCards = dataQualityInsights
      .insights()
      .map((insightItem, index) => (
        <DataQualityActionCard
          key={index}
          dataQualityInsightItem={insightItem}
          fieldId={fieldId}
          filters={filters}
        />
      ));
    const numInsights = actionCards.length;
    const title =
      numInsights === 1
        ? I18N.text('factor affecting the score', 'insightFound')
        : I18N.text('factors affecting the score', 'insightsFound');
    return (
      <InsightsSubsection title={`${numInsights} ${title}`}>
        {actionCards}
      </InsightsSubsection>
    );
  }

  maybeRenderInsightScoreSummary(): React.Node {
    const { dataQualityInsights } = this.props;
    if (!hasValidScore(dataQualityInsights.overallScore())) {
      return (
        <div className="data-quality-section__no-score-summary">
          <I18N.Ref id="lackOfDataErrorForQualityScore" />
        </div>
      );
    }

    const scoreSummaries = dataQualityInsights
      .insights()
      .map((insightItem, index) => {
        const score = insightItem.get('score');
        const { maxScore, value } = score;
        const scoreStyle = {
          color: `${getScoreColor(value, maxScore)}`,
        };
        return (
          <div
            key={index}
            className="data-quality-section__insight-score-summary"
          >
            {insightItem.title()}
            <div
              className="data-quality-section__insight-score"
              style={scoreStyle}
            >
              {getDisplayScore(score)}
            </div>
          </div>
        );
      });
    return (
      <div className="data-quality-section__insight-score-summary-container">
        {scoreSummaries}
      </div>
    );
  }

  renderOverallScoreSummary(): React.Element<typeof InsightsSubsection> {
    const { dataQualityInsights, fieldId, filters } = this.props;
    const { maxScore, value } = dataQualityInsights.overallScore();
    const cardClassName = !hasValidScore(dataQualityInsights.overallScore())
      ? 'data-quality-section__overall-score-card--no-data'
      : '';
    return (
      <InsightsSubsection className="data-quality-section__overall-score-subsection">
        <OverallScoreCard
          className={cardClassName}
          fieldId={fieldId}
          filters={filters}
          maxScore={maxScore}
          score={value}
        />
        {this.maybeRenderInsightScoreSummary()}
      </InsightsSubsection>
    );
  }

  renderHeader(): React.Element<typeof Group.Horizontal> {
    const tooltipText = I18N.text(
      'This section and quality score aim to quantify the reporting and data quality for this indicator based on the factors detailed within. It should not be taken as an authoritative score on its own but a low score is worth investigating to ensure it does not significantly impact the results of your analysis. You can expand this section and click through to the full data quality tool to investigate.',
      'dataQualitySectionTooltip',
    );

    return (
      <Group.Horizontal paddingLeft="m" paddingRight="m" paddingTop="m">
        <Group.Horizontal flex spacing="none">
          <Heading.Small>
            <I18N.Ref id="Data Quality" />
          </Heading.Small>
          <InfoTooltip text={tooltipText} />
        </Group.Horizontal>
      </Group.Horizontal>
    );
  }

  render(): React.Element<'div'> {
    const { dataQualityInsights } = this.props;
    const { maxScore, value } = dataQualityInsights.overallScore();
    // Append '15' to hex value for 6% opacity
    const scoreColor = `${getScoreColor(value, maxScore)}15`;
    const style = {
      backgroundImage: `linear-gradient(to bottom, ${scoreColor}, white 90%)`,
    };

    const hasData = hasValidScore(dataQualityInsights.overallScore());
    const className = classNames('data-quality-section', {
      'data-quality-section--no-data': !hasData,
    });

    return (
      <div className={className} style={style}>
        {this.renderHeader()}
        {this.renderOverallScoreSummary()}
        {this.maybeRenderActionCards()}
      </div>
    );
  }
}
