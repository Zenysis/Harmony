// @flow
import * as React from 'react';

import BaseInputText from 'components/ui/InputText/internal/BaseInputText';
import { noop } from 'util/util';
import type { IconType } from 'components/ui/Icon/types';
import type { StyleObject } from 'types/jsCore';

type DefaultProps = {
  /** The accessibility name for this input */
  ariaName?: string,
  className: string,

  /**
   * Set to true if you want to debounce the input. This means that the
   * `onChange` event handler will **not** get called until after
   * `debounceTimeoutMs` ms have passed. Debouncing is only allowed
   * in uncontrolled InputTexts..
   *
   * **Optional for an uncontrolled InputText **
   */
  debounce: boolean,

  /**
   * Amount of ms to wait after the last key press before executing the
   * `onChange` handler.
   * **Optional for an uncontrolled InputText **
   */
  debounceTimeoutMs: number,

  /** Should this input be disabled */
  disabled: boolean,

  /** An icon to embed in the InputText */
  icon?: IconType,

  /** The DOM id to set for the input. */
  id?: string,

  /** Render with a red border to indicate invalid input */
  invalid?: boolean,

  /** The message to show underneath the InputText if the input is invalid */
  invalidMessage?: string,

  /**
   * Only used when `type is 'number'. The maximum value to accept for this
   * input.
   */
  max: number | void,

  /**
   * Only used when `type is 'number'. The minimum value to accept for this
   * input.
   */
  min: number | void,

  /** Called when the input text box is blurred */
  onBlur?: (SyntheticEvent<HTMLInputElement>) => void,

  /** Called when the input text box is clicked */
  onClick?: (SyntheticEvent<HTMLInputElement>) => void,

  /** **Optional for an uncontrolled InputText.** */
  onChange: (value: string, event: SyntheticEvent<HTMLInputElement>) => void,

  /** Called when the Enter/Return key is pressed. */
  onEnterPress?: (SyntheticKeyboardEvent<HTMLInputElement>) => void,

  /** Called when the input text box is focused */
  onFocus?: (SyntheticEvent<HTMLInputElement>) => void,

  /** Called whenever any key is down */
  onKeyDown?: (SyntheticKeyboardEvent<HTMLInputElement>) => void,

  /** The placeholder text to display in the InputText before any changes */
  placeholder: string,

  /**
   * Only used when `type` is 'number'. This controls the interval between
   * valid numbers. Use 'any' if any number is valid.
   */
  step: number | string | 'any',

  /** The style to set on the `<input>` component */
  style?: StyleObject,

  /** The type of InputText box */
  type: 'text' | 'password' | 'email' | 'number',

  /** Width to set on the `<input>` component */
  width?: number | string,

  /** TestId used in e2e tests */
  testId?: string,
};

type Props = {
  ...DefaultProps,

  /** **Required for an uncontrolled InputText.** */
  initialValue: string,
};

/**
 * A basic component used to input text. This is an uncontrolled component.
 *
 * For the controlled version, use [`<InputText>`](#inputtext).
 *
 * @visibleName InputText.Uncontrolled
 */
export default class UncontrolledInputText extends React.Component<Props> {
  static defaultProps: DefaultProps = {
    ariaName: undefined,
    className: '',
    debounce: false,
    debounceTimeoutMs: 200,
    disabled: false,
    icon: undefined,
    id: undefined,
    invalid: false,
    invalidMessage: undefined,
    max: undefined,
    min: undefined,
    onBlur: undefined,
    onChange: noop,
    onClick: undefined,
    onEnterPress: undefined,
    onFocus: undefined,
    onKeyDown: undefined,
    placeholder: '',
    step: 'any',
    style: undefined,
    type: 'text',
    width: undefined,
    testId: undefined,
  };

  _inputTextRef: $ElementRefObject<typeof BaseInputText> = React.createRef();

  /**
   * Clears the input text. This resets the value to an empty string.
   * @public
   */
  clear(): void {
    if (this._inputTextRef.current) {
      this._inputTextRef.current.clear();
    }
  }

  /**
   * Moves the browser focus to the input DOM node
   * @public
   */
  focus(): void {
    if (this._inputTextRef.current) {
      this._inputTextRef.current.focus();
    }
  }

  /**
   * Get the value currently stored in the input text.
   * Even if the input is debounced, this function will return the value exactly
   * as it appears in the DOM node.
   * @public
   */
  getValue(): string {
    if (this._inputTextRef.current) {
      return this._inputTextRef.current.getValue();
    }
    throw new Error(
      '[UncontrolledInputText] Could not getValue because the ref is not defined',
    );
  }

  render(): React.Element<typeof BaseInputText> {
    return (
      <BaseInputText
        ref={this._inputTextRef}
        isControlled={false}
        {...this.props}
      />
    );
  }
}
