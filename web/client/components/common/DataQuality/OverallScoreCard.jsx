// @flow
import * as React from 'react';

import Tag from 'components/ui/Tag';
import { getDQLURL, getScoreColor } from 'components/DataQualityApp/util';
import type { QueryFilterItem } from 'models/core/wip/QueryFilterItem/types';

type DefaultProps = {
  className: string,
};

type Props = {
  ...DefaultProps,
  fieldId: string,
  filters: $ReadOnlyArray<QueryFilterItem>,
  score: number,
  maxScore: number,
  analyticsEvent: string,
};

// TODO (solo): Move the translations and CSS for this component to suit file structure
const TEXT = t(
  'AdvancedQueryApp.QueryFormPanel.Insights.DataQualitySection.OverallScoreCard',
);

function getDisplayScore(score: number, maxScore: number): string {
  return `${score}/${maxScore}`;
}

export default class OverallScoreCard extends React.PureComponent<Props> {
  static defaultProps: DefaultProps = {
    className: '',
  };

  _DQLLinkRef: $ElementRefObject<'a'> = React.createRef();

  componentDidMount() {
    const { fieldId } = this.props;

    if (this._DQLLinkRef.current) {
      analytics.trackLink(this._DQLLinkRef.current, this.props.analyticsEvent, {
        selectedIndicator: fieldId,
      });
    }
  }

  maybeRenderScore(): React.Node {
    const { score, maxScore } = this.props;

    // If base is 0, we know there exists no score so we return nothing.
    if (maxScore === 0) {
      return null;
    }

    const scoreColor = getScoreColor(score, maxScore);
    const scoreStyle = { color: scoreColor };

    return (
      <strong className="overall-score-card__score" style={scoreStyle}>
        {getDisplayScore(score, maxScore)}
      </strong>
    );
  }

  renderBetaTag(): React.Node {
    return (
      <Tag.Simple
        boldText
        className="overall-score-card__beta-tag"
        size={Tag.Sizes.SMALL}
        intent={Tag.Intents.DANGER}
      >
        {TEXT.beta}
      </Tag.Simple>
    );
  }

  render(): React.Node {
    const { className, fieldId, filters, score, maxScore } = this.props;
    const scoreColor = getScoreColor(score, maxScore);
    const badgeStyle = { borderTop: `5px solid ${scoreColor}` };

    return (
      <a
        className={`overall-score-card ${className}`}
        href={getDQLURL(fieldId, undefined, filters)}
        ref={this._DQLLinkRef}
        rel="noopener noreferrer"
        style={badgeStyle}
        target="_blank"
      >
        {this.renderBetaTag()}
        <strong className="overall-score-card__title">{TEXT.title}</strong>
        {this.maybeRenderScore()}
      </a>
    );
  }
}
