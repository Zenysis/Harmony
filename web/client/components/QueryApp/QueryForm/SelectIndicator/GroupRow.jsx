// @flow
import * as React from 'react';
import { updateNode } from 'react-virtualized-tree/es/selectors/nodes';

import Caret, { DIRECTIONS } from 'components/ui/Caret';
import autobind from 'decorators/autobind';

// TODO(stephen, kyle): When SelectIndicator gets flow-ified, this type
// definition should live there.
type GroupNode = {
  name: string,
  state: {
    expanded: boolean,
  },
};

export type NodeUpdater = {
  node: GroupNode,
  type: number,
};

type Props = {
  node: GroupNode,
  onClick: NodeUpdater => void,
};

export default class GroupRow extends React.PureComponent<Props> {
  @autobind
  onClick() {
    const { node, onClick } = this.props;
    const { expanded } = node.state;
    onClick(updateNode(node, { expanded: !expanded }));
  }

  renderCaret() {
    const caretDirection = this.props.node.state.expanded
      ? DIRECTIONS.DOWN
      : DIRECTIONS.RIGHT;
    return <Caret direction={caretDirection} />;
  }

  render() {
    return (
      <div
        className="select-indicator-group-row"
        role="button"
        onClick={this.onClick}
      >
        {this.renderCaret()}
        <span className="select-indicator-group-row__label">
          {this.props.node.name}
        </span>
      </div>
    );
  }
}
