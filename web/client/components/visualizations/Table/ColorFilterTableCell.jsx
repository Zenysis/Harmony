// @flow
import * as React from 'react';

import type { StyleObject } from 'types/jsCore';

type Props = {
  backgroundColor: string | void,
  displayValue: string | number,
  style: StyleObject | void,
};

function ColorFilterTableCell({
  backgroundColor,
  displayValue,
  style,
}: Props): React.Node {
  let fullStyle = style === undefined ? {} : style;

  if (backgroundColor !== undefined) {
    fullStyle = { ...fullStyle, backgroundColor };
  }

  return (
    <div className="table-visualization__table-cell" style={fullStyle}>
      {displayValue}
    </div>
  );
}

export default (React.memo(
  ColorFilterTableCell,
): React.AbstractComponent<Props>);
