// @flow
import * as React from 'react';
import classNames from 'classnames';

import Intents from 'components/ui/LegacyIntents';
import autobind from 'decorators/autobind';
import normalizeARIAName from 'components/ui/util/normalizeARIAName';
import type { Intent } from 'components/ui/LegacyIntents';
import type { StyleObject } from 'types/jsCore';

type DefaultProps = {
  ariaName?: string,
  className: string,
  dataContent?: string,
  disabled: boolean,

  /**
   * Gets called when the button is clicked.
   * @param {SyntheticEvent.button} event The click event
   */
  onClick?: (SyntheticMouseEvent<HTMLButtonElement>) => void,
  style?: StyleObject,

  testId?: string,

  /**
   * The intent should be specified with the Intents object in
   * `ui/LegacyIntents.js` (also accessible through `LegacyButton.Intents`)
   */
  // TODO: rename this from "type" to "intent". "type" means something
  // different for buttons (e.g. "submit", "reset", "button")
  type: Intent,
};

type Props = {
  ...DefaultProps,
  children: React.Node,
};

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
  static Intents: typeof Intents = Intents;

  static defaultProps: DefaultProps = {
    ariaName: undefined,
    className: '',
    dataContent: undefined,
    disabled: false,
    onClick: undefined,
    style: undefined,
    type: Intents.DEFAULT,
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

  render(): React.Element<'button'> {
    const {
      ariaName,
      children,
      dataContent,
      disabled,
      style,
      testId,
      type,
    } = this.props;
    const className = classNames(`btn btn-${type}`, this.props.className, {
      disabled,
    });

    // if no ARIA Name was specified, use the button contents if it's a string
    const ariaNameToUse =
      ariaName || (typeof children === 'string' ? children : undefined);
    return (
      <button
        aria-label={normalizeARIAName(ariaNameToUse)}
        className={className}
        data-content={dataContent}
        data-testid={testId}
        onClick={this.onClick}
        style={style}
        type="button"
      >
        {children}
      </button>
    );
  }
}
