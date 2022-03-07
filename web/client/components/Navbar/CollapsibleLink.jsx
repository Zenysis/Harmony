// @flow
import * as React from 'react';
import classNames from 'classnames';

import Caret from 'components/ui/Caret';
import autobind from 'decorators/autobind';
import { asButton } from 'components/Navbar/util';
import type { CaretDirection } from 'components/ui/Caret';

type Props = {
  /** The link text */
  label: string,
  children: React.Node,

  /** The class name to style the link container */
  className: string,

  /** The class name to style the link container when its open */
  openClassName: string,
};

type State = {
  isOpen: boolean,
};

export default class CollapsibleLink extends React.PureComponent<Props, State> {
  state: State = {
    isOpen: false,
  };

  getCaretDirection(): CaretDirection {
    if (this.state.isOpen) {
      return Caret.Directions.UP;
    }
    return Caret.Directions.DOWN;
  }

  @autobind
  onLinkClick() {
    this.setState(prevState => ({ isOpen: !prevState.isOpen }));
  }

  renderLabel(): React.Node {
    return asButton(
      this.onLinkClick,
      this.props.label,
      false,
      <React.Fragment>
        {' '}
        <Caret type={Caret.Types.MENU} direction={this.getCaretDirection()} />
      </React.Fragment>,
    );
  }

  render(): React.Node {
    const { className, openClassName } = this.props;

    const linkClassName = classNames(className, {
      [openClassName]: this.state.isOpen,
    });

    return (
      <div className={linkClassName}>
        <div>{this.renderLabel()}</div>
        {this.state.isOpen && (
          <div className="collapsible-link-children">{this.props.children}</div>
        )}
      </div>
    );
  }
}
