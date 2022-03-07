// @flow
import * as React from 'react';

import autobind from 'decorators/autobind';

type Props = {
  disableDeletion: boolean,
  onCloneClick: () => void,
  onClose: () => void,
  onDeleteClick: () => void,
  onRenameClick: () => void,
  onResetClick: () => void,
};

const TEXT = t('AdvancedQueryApp.QueryTabList.QueryTabContextMenu');

export default class QueryTabContextMenu extends React.PureComponent<Props> {
  _ref: $ElementRefObject<'div'> = React.createRef();

  componentDidMount() {
    document.addEventListener('click', this.syntheticBlur);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.syntheticBlur);
  }

  // Simulate "onBlur" with non-blurrable elements. When the user clicks outside
  // of the context menu, trigger onClose().
  @autobind
  syntheticBlur(event: MouseEvent) {
    const { current } = this._ref;
    if (!current) {
      return;
    }

    const { target } = event;

    if (target instanceof Node && !current.contains(target)) {
      this.props.onClose();
    }
  }

  renderItem(
    onClick: () => void,
    title: string,
    disabled: boolean = false,
  ): React.Element<'div'> {
    const className = disabled
      ? 'query-tab-context-menu__item query-tab-context-menu__item--disabled'
      : 'query-tab-context-menu__item';
    const callback = !disabled
      ? () => {
          onClick();
          this.props.onClose();
        }
      : undefined;

    return (
      <div
        className={className}
        onClick={callback}
        role="menuitem"
        title={title}
      >
        {title}
      </div>
    );
  }

  render(): React.Element<'div'> {
    const {
      disableDeletion,
      onCloneClick,
      onDeleteClick,
      onRenameClick,
      onResetClick,
    } = this.props;
    return (
      <div ref={this._ref} className="query-tab-context-menu">
        {this.renderItem(onDeleteClick, TEXT.delete, disableDeletion)}
        {this.renderItem(onCloneClick, TEXT.clone)}
        {this.renderItem(onRenameClick, TEXT.rename)}
        {this.renderItem(onResetClick, TEXT.reset)}
      </div>
    );
  }
}
