// @flow
import * as React from 'react';
import classNames from 'classnames';

import Caret from 'components/ui/Caret';
import type { CaretType } from 'components/ui/Caret';
import type { Intent } from 'components/ui/LegacyIntents';
import type { StyleObject } from 'types/jsCore';

type Props = {
  buttonIntent: Intent,
  children: React.Node,
  className: string,
  disabled: boolean,
  hideCaret: boolean,
  caretType: CaretType,
  onButtonClick: (SyntheticEvent<HTMLButtonElement>) => void,

  buttonMinWidth?: number,
  buttonWidth?: string | number,
  dataContent?: string,
  valueStyle?: StyleObject,
};

/**
 * This is the main button that opens the dropdown menu when you click on it.
 */
export default class DropdownButton extends React.PureComponent<Props> {
  static defaultProps = {
    buttonMinWidth: undefined,
    buttonWidth: undefined,
    dataContent: undefined,
    valueStyle: undefined,
  };

  getButtonContainerStyle() {
    const { buttonWidth, buttonMinWidth } = this.props;
    return {
      width: buttonWidth,
      minWidth: buttonMinWidth,
    };
  }

  maybeRenderCaret() {
    return this.props.hideCaret ? null : (
      <Caret
        className="zen-dropdown-button__caret"
        type={this.props.caretType}
      />
    );
  }

  renderButtonContent() {
    const { children, valueStyle } = this.props;
    return (
      <div className="zen-dropdown-button__button-content" style={valueStyle}>
        {children}
      </div>
    );
  }

  render() {
    const {
      buttonIntent,
      className,
      dataContent,
      disabled,
      onButtonClick,
    } = this.props;

    const btnClassName = classNames(
      `zen-dropdown-button__main-btn ${className}`,
      `zen-dropdown-button__main-btn--${buttonIntent}`,
    );

    // We need to wrap the `<button>` element in a div because we can't use
    // `display: flex` on button elements, so we need to set flex on the div
    return (
      <div
        className="zen-dropdown-button"
        style={this.getButtonContainerStyle()}
      >
        <button
          disabled={disabled}
          className={btnClassName}
          data-content={dataContent}
          onClick={onButtonClick}
          type="button"
        >
          {this.renderButtonContent()}
          {this.maybeRenderCaret()}
        </button>
      </div>
    );
  }
}
