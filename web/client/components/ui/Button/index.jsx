// @flow
import * as React from 'react';
import classNames from 'classnames';

import Intents from 'components/ui/Intents';
import autobind from 'decorators/autobind';
import type { StyleObject } from 'types/jsCore';

type Props = {|
  children: React.Node,

  /** Optional additional class name to add to the button */
  className: string,

  /**
   * Disable the button. The `onClick` event will not fire if this is true
   */
  disabled: boolean,

  /**
   * The intent should be specified through `Button.Intents`
   */
  intent: 'primary' | 'success' | 'danger',

  /**
   * Gets called when the button is clicked.
   * @param {SyntheticEvent.button} event The click event
   */
  onClick?: (event: SyntheticMouseEvent<HTMLButtonElement>) => void,

  /** Change the style to only display the outline of the button */
  outline: boolean,

  /** The size should be specified through `Button.Sizes` */
  size: 'large' | 'medium' | 'small',
  style: StyleObject,

  /**
   * This gets added as a `zen-test-id` attribute on the button. Use this only
   * when you need to locate a button in a webdriver test. The xpath to locate
   * this button would be:
   *
   * `//button[@zen-test-id="yourTestId"]`
   */
  testId?: string,
|};

type SizesMap = {
  LARGE: 'large',
  MEDIUM: 'medium',
  SMALL: 'small',
};

const SIZES: SizesMap = {
  LARGE: 'large',
  MEDIUM: 'medium',
  SMALL: 'small',
};

/**
 * A basic button component used to click things.
 *
 * Button intents can be specified using the `Button.Intents` constant:
 *
 * `Button.Intents.PRIMARY | DANGER | SUCCESS`
 */
export default class Button extends React.PureComponent<Props> {
  static Intents = Intents;
  static Sizes = SIZES;

  static defaultProps = {
    className: '',
    disabled: false,
    intent: Intents.PRIMARY,
    onClick: undefined,
    outline: false,
    size: SIZES.SMALL,
    style: {},
    testId: undefined,
  };

  @autobind
  onClick(event: SyntheticMouseEvent<HTMLButtonElement>) {
    const { disabled, onClick } = this.props;
    if (disabled) {
      return;
    }
    if (onClick) {
      onClick(event);
    }
  }

  renderButtonContents() {
    const { size, children } = this.props;
    return (
      <div className={`zen-button__contents zen-button__contents--${size}`}>
        {children}
      </div>
    );
  }

  render() {
    const {
      intent,
      disabled,
      style,
      className,
      outline,
      size,
      testId,
    } = this.props;
    const fullClassName = classNames(
      `zen-button zen-button--${size}`,
      className,
      {
        [`zen-button--${intent}`]: !outline && !disabled,
        [`zen-button--${intent}-outline`]: outline && !disabled,
        'zen-button--disabled': disabled,
      },
    );

    return (
      <button
        zen-test-id={testId}
        className={fullClassName}
        type="button"
        onClick={this.onClick}
        style={style}
      >
        {this.renderButtonContents()}
      </button>
    );
  }
}
