// @flow
import * as React from 'react';

import autobind from 'decorators/autobind';
import type { StyleObject } from 'types/jsCore';

type DefaultProps = {
  height?: number,
  maxHeight?: number,
  onScrollToBottom?: () => void,
};

type Props = {
  ...DefaultProps,
  children: React.Node,
};

export default class ColumnWrapper extends React.PureComponent<Props> {
  static defaultProps: DefaultProps = {
    height: undefined,
    maxHeight: undefined,
    onScrollToBottom: undefined,
  };

  getStyle(): StyleObject {
    const { height, maxHeight } = this.props;
    if (maxHeight !== undefined) {
      return {
        height,
        maxHeight,
        overflowX: 'hidden',
        overflowY: 'auto',
      };
    }
    return { height };
  }

  @autobind
  onScroll(event: SyntheticEvent<HTMLDivElement>) {
    const { onScrollToBottom } = this.props;
    const column = event.currentTarget;
    const { scrollTop, offsetHeight, scrollHeight } = column;
    const scrollBottom = scrollTop + offsetHeight;
    if (scrollBottom >= scrollHeight && onScrollToBottom) {
      onScrollToBottom();
    }
  }

  render(): React.Element<'div'> {
    return (
      <div
        className="hierarchical-selector__column-wrapper"
        style={this.getStyle()}
        onScroll={this.onScroll}
      >
        {this.props.children}
      </div>
    );
  }
}
