// @flow
import * as React from 'react';

import InsightsActionCard from 'components/AdvancedQueryApp/QueryFormPanel/Insights/InsightsActionCard';
import { getDisplayScore } from 'components/AdvancedQueryApp/QueryFormPanel/Insights/util';
import { getScoreColor } from 'components/DataQualityApp/util';
import type { DataQualityInsightItem } from 'models/AdvancedQueryApp/Insights/DataQualityInsight/types';
import type { QueryFilterItem } from 'models/core/wip/QueryFilterItem/types';

type Props = {
  dataQualityInsightItem: DataQualityInsightItem,
  filters: $ReadOnlyArray<QueryFilterItem>,
};

export default class DataQualityActionCard extends React.PureComponent<Props> {
  _DQLLinkRef: $ElementRefObject<'a'> = React.createRef();

  getScoreString(): string {
    const score = this.props.dataQualityInsightItem.get('score');
    return getDisplayScore(score);
  }

  render(): React.Node {
    const { dataQualityInsightItem, filters } = this.props;
    const { maxScore, value } = dataQualityInsightItem.get('score');
    const scoreColor = getScoreColor(value, maxScore);
    const cardStyle = { borderTop: `5px solid ${scoreColor}` };
    const scoreStyle = { color: scoreColor };

    const actionCard = (
      <div className="data-quality-action-card" style={cardStyle}>
        <InsightsActionCard
          buttons={[]}
          className="data-quality-action-card__insights-summary"
          summary={dataQualityInsightItem.summary()}
          title={dataQualityInsightItem.title()}
        />
        <div className="data-quality-action-card__score" style={scoreStyle}>
          {this.getScoreString()}
        </div>
      </div>
    );

    const makeClickableLink = maxScore !== 0;

    return makeClickableLink ? (
      <a
        ref={this._DQLLinkRef}
        href={dataQualityInsightItem.getURL(filters)}
        rel="noopener noreferrer"
        target="_blank"
      >
        {actionCard}
      </a>
    ) : (
      actionCard
    );
  }
}
