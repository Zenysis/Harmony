// @flow
import * as React from 'react';

import I18N from 'lib/I18N';
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
  maxScore: number,
  score: number,
};

// TODO (solo): Move the CSS for this component to suit file structure

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
  }

  maybeRenderScore(): React.Node {
    const { maxScore, score } = this.props;

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
        intent={Tag.Intents.DANGER}
        size={Tag.Sizes.SMALL}
      >
        {I18N.textById('beta')}
      </Tag.Simple>
    );
  }

  render(): React.Node {
    const { className, fieldId, filters, maxScore, score } = this.props;
    const scoreColor = getScoreColor(score, maxScore);
    const badgeStyle = { borderTop: `5px solid ${scoreColor}` };

    return (
      <a
        ref={this._DQLLinkRef}
        className={`overall-score-card ${className}`}
        href={getDQLURL(fieldId, undefined, filters)}
        rel="noopener noreferrer"
        style={badgeStyle}
        target="_blank"
      >
        {this.renderBetaTag()}
        <strong className="overall-score-card__title">
          {I18N.textById('Data Quality')}
        </strong>
        {this.maybeRenderScore()}
      </a>
    );
  }
}
