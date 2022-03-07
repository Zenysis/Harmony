// @flow
import * as React from 'react';

import type { StyleObject } from 'types/jsCore';

type Props = {
  displayValue: string | number,
  style: StyleObject | void,

  blank?: boolean,
  scorecardRank?: number,
};

function rankToHSL(rank: number): string {
  const hue = rank * 120;
  return `hsl(${hue}, 100%, 50%)`;
}

function ScorecardTableCell({
  displayValue,
  blank = false,
  scorecardRank = -1,
  style,
}): React.Node {
  let fullStyle = style === undefined ? {} : style;

  if (!blank) {
    fullStyle = {
      ...fullStyle,
      backgroundColor: rankToHSL(scorecardRank),
    };
  }

  return (
    <div className="table-visualization__table-cell" style={fullStyle}>
      {displayValue}
    </div>
  );
}

export default (React.memo(ScorecardTableCell): React.AbstractComponent<Props>);
