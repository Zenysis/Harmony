// @flow
import * as React from 'react';

import Button from 'components/ui/Button';
import autobind from 'decorators/autobind';

type Props = {
  children: React.Node,
  onClosePanel: (event: SyntheticEvent<HTMLButtonElement>) => void,

  buttonsClassName: string,
};

type State = {
  isTop: boolean,
};

export default class VerticalSideBar extends React.PureComponent<Props, State> {
  static defaultProps = {
    buttonsClassName: 'side-bar-buttons',
  };

  _mainDivElt: $RefObject<'div'> = React.createRef();
  state = {
    isTop: true,
  };

  componentDidMount() {
    this.onScrollDown();
    document.addEventListener('scroll', this.onScrollDown);
  }

  componentWillUnmount() {
    document.removeEventListener('scroll', this.onScrollDown);
  }

  getWidth(): number {
    if (this._mainDivElt.current) {
      return this._mainDivElt.current.offsetWidth;
    }
    return 0;
  }

  @autobind
  onScrollDown() {
    const isTop = window.scrollY < 40;
    if (isTop !== this.state.isTop) {
      this.setState({ isTop });
    }
  }

  renderCloseButton() {
    return (
      <Button
        outline
        size={Button.Sizes.MEDIUM}
        onClick={this.props.onClosePanel}
        className="close-btn"
      >
        {t('edit_panel.closeButtonText')}
      </Button>
    );
  }

  render() {
    const className = this.state.isTop ? 'edit-sidebar' : 'edit-sidebar float';
    return (
      <div ref={this._mainDivElt} className={className}>
        <div className="sidebar-query-form">
          {this.props.children}
          <div className={this.props.buttonsClassName}>
            {this.renderCloseButton()}
          </div>
        </div>
      </div>
    );
  }
}
