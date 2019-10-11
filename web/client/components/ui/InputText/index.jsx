// @flow
import * as React from 'react';

import BaseInputText from 'components/ui/InputText/internal/BaseInputText';
import UncontrolledInputText from 'components/ui/InputText/UncontrolledInputText';
import type { IconType } from 'components/ui/Icon/types';
import type { StyleObject } from 'types/jsCore';

type ControlledProps = {
  /** **Required for a controlled InputText** */
  value: string,

  /** **Required for a controlled InputText** */
  onChange: (value: string, event: SyntheticEvent<HTMLInputElement>) => void,
};

type BaseProps = {
  className: string,

  /** Should this input be disabled */
  disabled: boolean,

  /** An icon to embed in the InputText */
  icon?: IconType,

  /** The DOM id to set for the input. */
  id: string,

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

type Props = ControlledProps & BaseProps;

/**
 * A basic component used to input text. This is a controlled component.
 *
 * For the uncontrolled version, use `<InputText.Uncontrolled>`.
 *
 * If you want to debounce your input, you **must** use the uncontrolled
 * version.
 */
export default class InputText extends React.Component<Props> {
  static defaultProps = {
    className: '',
    disabled: false,
    icon: undefined,
    id: '',
    onClick: undefined,
    onEnterPress: undefined,
    onKeyPress: undefined,
    placeholder: '',
    style: {},
    type: 'text',
    width: undefined,
  };

  static Uncontrolled = UncontrolledInputText;

  _inputTextRef: $RefObject<typeof BaseInputText> = React.createRef();

  /**
   * Moves the browser focus to the input DOM node
   * @public
   */
  focus(): void {
    if (this._inputTextRef.current) {
      this._inputTextRef.current.focus();
    }
  }

  render() {
    return <BaseInputText isControlled {...this.props} />;
  }
}
