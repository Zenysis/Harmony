// @flow
import * as React from 'react';
import classNames from 'classnames';

import Intents from 'components/ui/LegacyIntents';
import autobind from 'decorators/autobind';
import type { Intent } from 'components/ui/LegacyIntents';
import type { StyleObject } from 'types/jsCore';

export type ButtonClickEvent = SyntheticEvent<HTMLButtonElement>;
export type ButtonClickHandler = (event: ButtonClickEvent) => void;

type Props = {|
  children: React.Node,

  className: string,
  dataContent?: string,
  disabled: boolean,

  /**
   * Gets called when the button is clicked.
   * @param {SyntheticEvent.button} event The click event
   */
  onClick?: ButtonClickHandler,
  style: StyleObject,

  /**
   * The intent should be specified with the Intents object in
   * `ui/LegacyIntents.js` (also accessible through `LegacyButton.Intents`)
   */
  // TODO(pablo): rename this from "type" to "intent". "type" means something
  // different for buttons (e.g. "submit", "reset", "button")
  type: Intent,
|};

/**
 * **This component is deprecated.**
 * A basic button component used to click things.
 *
 * LegacyButton types can be specified using the `LegacyButton.Intents`
 * constant:
 *
 * `LegacyButton.Intents.PRIMARY | DEFAULT | DANGER | ...etc.`
 * @deprecated
 */
export default class LegacyButton extends React.PureComponent<Props> {
  static Intents = Intents;

  static defaultProps = {
    className: '',
    dataContent: undefined,
    disabled: false,
    onClick: undefined,
    style: {},
    type: Intents.DEFAULT,
  };

  @autobind
  onClick(event: ButtonClickEvent) {
    const { disabled, onClick } = this.props;
    if (disabled) {
      return;
    }
    if (onClick) {
      onClick(event);
    }
  }

  render() {
    const { type, dataContent, disabled, children, style } = this.props;
    const className = classNames(`btn btn-${type}`, this.props.className, {
      disabled,
    });

    return (
      <button
        className={className}
        type="button"
        onClick={this.onClick}
        style={style}
        data-content={dataContent}
      >
        {children}
      </button>
    );
  }
}
