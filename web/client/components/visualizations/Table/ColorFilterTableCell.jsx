// @flow
import * as React from 'react';

import type { StyleObject } from 'types/jsCore';

type Props = {
  backgroundColor: string | void,
  displayValue: string | number,
  height: number,
};

export default class ColorFilterTableCell extends React.PureComponent<Props> {
  static defaultProps = {
    colorFilter: undefined,
  };

  buildStyle(): StyleObject {
    const { height, backgroundColor } = this.props;
    return {
      height,
      backgroundColor,
      lineHeight: `${height}px`,
    };
  }

  render() {
    return (
      <div className="color-filter-table-cell" style={this.buildStyle()}>
        {this.props.displayValue}
      </div>
    );
  }
}
