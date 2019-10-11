// @flow
import * as React from 'react';

type Props = {
  displayValue: string | number,
  height: number,
  scorecardRank: number,
  blank: boolean,
};

function rankToHSL(rank: number): string {
  const hue = rank * 120;
  return `hsl(${hue}, 100%, 50%)`;
}

export default class ScorecardTableCell extends React.PureComponent<Props> {
  static defaultProps = {
    blank: false,
    scorecardRank: -1,
  };

  render() {
    const { blank, displayValue, height, scorecardRank } = this.props;
    const style = {
      backgroundColor: blank ? undefined : rankToHSL(scorecardRank),
      height,
      lineHeight: `${height}px`,
    };
    return (
      <div className="scorecard-table-cell" style={style}>
        {displayValue}
      </div>
    );
  }
}
