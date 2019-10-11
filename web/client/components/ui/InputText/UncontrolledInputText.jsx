// @flow
import * as React from 'react';

import BaseInputText from 'components/ui/InputText/internal/BaseInputText';
import type { IconType } from 'components/ui/Icon/types';
import type { StyleObject } from 'types/jsCore';

type UncontrolledProps = {
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

  /** **Required for an uncontrolled InputText.** */
  initialValue: string,

  /** **Optional for an uncontrolled InputText.** */
  onChange?: (value: string, event: SyntheticEvent<HTMLInputElement>) => void,
};

type BaseProps = {
  className: string,

  /** Should this input be disabled */
  disabled: boolean,

  /** The DOM id to set for the input. */
  id: string,

  /** An icon to embed in the InputText */
  icon?: IconType,

  /** Called when the input text box is clicked */
  onClick?: (SyntheticEvent<HTMLInputElement>) => void,

  /** Called when the Enter/Return key is pressed. */
  onEnterPress?: (SyntheticKeyboardEvent<HTMLInputElement>) => void,

  /** Called whenever any key is pressed */
  onKeyPress?: (SyntheticKeyboardEvent<HTMLInputElement>) => void,

  /** The placeholder text to display in the InputText before any changes */
  placeholder: string,

  /** The style to set on the `<input>` component */
  style: StyleObject,

  /** The type of InputText box */
  type: 'text' | 'password' | 'email' | 'number',

  /** Width to set on the `<input>` component */
  width?: number | string,
};

type Props = UncontrolledProps & BaseProps;

/**
 * A basic component used to input text. This is an uncontrolled component.
 *
 * For the controlled version, use `<InputText>`.
 *
 * @visibleName InputText.Uncontrolled
 */
export default class UncontrolledInputText extends React.Component<Props> {
  static defaultProps = {
    className: '',
    debounce: false,
    debounceTimeoutMs: 200,
    disabled: false,
    icon: undefined,
    id: '',
    onChange: undefined,
    onClick: undefined,
    onEnterPress: undefined,
    onKeyPress: undefined,
    placeholder: '',
    style: {},
    type: 'text',
    width: undefined,
  };

  _inputTextRef: $RefObject<typeof BaseInputText> = React.createRef();

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

  render() {
    return (
      <BaseInputText
        ref={this._inputTextRef}
        isControlled={false}
        {...this.props}
      />
    );
  }
}
