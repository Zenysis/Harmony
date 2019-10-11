// @flow
import * as React from 'react';

import autobind from 'decorators/autobind';

const TEXT = t('dashboard_builder');

type ButtonClickEvent = SyntheticEvent<HTMLInputElement>;

type Props = {
  collapsedLayout: boolean,
  onSaveClicked: (event: ButtonClickEvent) => void,
  onUndoClicked: (event: ButtonClickEvent) => void,
  hasUnsavedChanges: boolean,
};

type State = {
  isTop: boolean,
};

export default class SaveUndoBar extends React.PureComponent<Props, State> {
  state = {
    isTop: true,
  };

  componentDidMount() {
    document.addEventListener('scroll', this.onScrollDown);
  }

  componentWillUnmount() {
    document.removeEventListener('scroll', this.onScrollDown);
  }

  @autobind
  onScrollDown() {
    const isTop = window.scrollY < 140;
    if (isTop !== this.state.isTop) {
      this.setState({ isTop });
    }
  }

  renderSaveButton() {
    const { hasUnsavedChanges, onSaveClicked, collapsedLayout } = this.props;
    const savedClass = hasUnsavedChanges ? 'unsaved' : '';
    const className = `header-action-button save-undo-tooltip ${savedClass}`;
    const label = collapsedLayout ? (
      ''
    ) : (
      <span className="header-action-button__text">
        {TEXT.save_specification}
      </span>
    );

    return (
      <button
        type="button"
        className={className}
        onClick={onSaveClicked}
        data-content={TEXT.save_tooltip}
      >
        <i className="glyphicon glyphicon-save" />
        {label}
      </button>
    );
  }

  renderUndoButton() {
    const { hasUnsavedChanges, onUndoClicked, collapsedLayout } = this.props;
    const savedClass = hasUnsavedChanges ? 'unsaved-undo' : '';
    const className = `header-action-button save-undo-tooltip ${savedClass}`;
    const label = collapsedLayout ? (
      ''
    ) : (
      <span className="header-action-button__text">{TEXT.undo}</span>
    );

    return (
      <button
        type="button"
        data-content={TEXT.undo_tooltip}
        className={className}
        onClick={onUndoClicked}
      >
        <i className="glyphicon glyphicon-repeat" />
        {label}
      </button>
    );
  }

  render() {
    return (
      <React.Fragment>
        {this.renderSaveButton()}
        {this.renderUndoButton()}
      </React.Fragment>
    );
  }
}
