// @flow
import * as React from 'react';

import BaseInputText from 'components/ui/InputText/internal/BaseInputText';
import UncontrolledInputText from 'components/ui/InputText/UncontrolledInputText';
import type { IconType } from 'components/ui/Icon/types';
import type { StyleObject } from 'types/jsCore';

type DefaultProps = {
  /** The accessibility name for this input */
  ariaName?: string,
  className: string,

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
  onBlur?: (SyntheticFocusEvent<HTMLInputElement>) => void,

  /** Called when the input text box is clicked */
  onClick?: (SyntheticEvent<HTMLInputElement>) => void,

  /** Called when the Enter/Return key is pressed. */
  onEnterPress?: (SyntheticKeyboardEvent<HTMLInputElement>) => void,

  /** Called when the input text box is focused */
  onFocus?: (SyntheticFocusEvent<HTMLInputElement>) => void,

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
  // HACK(Kenneth) This is temporary while we create a
  // file upload UI component
  type: 'text' | 'password' | 'email' | 'number' | 'file',

  /** Width to set on the `<input>` component */
  width?: number | string,

  /** TestId used in e2e tests */
  testId?: string,
};

type Props = {
  ...DefaultProps,

  /** **Required for a controlled InputText** */
  value: string,

  /** **Required for a controlled InputText** */
  onChange: (value: string, event: SyntheticEvent<HTMLInputElement>) => void,
};

/**
 * A basic component used to input text. This is a controlled component.
 *
 * For the uncontrolled version, use [`<InputText.Uncontrolled>`](#uncontrolledinputtext).
 *
 * For inline text editing, consider using [`<BorderlessInputText>`](#borderlessinputtext).
 *
 * If you want to debounce your input, you **must** use the uncontrolled
 * version.
 */
export default class InputText extends React.Component<Props> {
  static defaultProps: DefaultProps = {
    ariaName: undefined,
    className: '',
    disabled: false,
    icon: undefined,
    id: undefined,
    invalid: false,
    invalidMessage: undefined,
    max: undefined,
    min: undefined,
    onBlur: undefined,
    onClick: undefined,
    onEnterPress: undefined,
    onFocus: undefined,
    onKeyDown: undefined,
    placeholder: '',
    style: undefined,
    step: 'any',
    type: 'text',
    width: undefined,
    testId: undefined,
  };

  static Uncontrolled: typeof UncontrolledInputText = UncontrolledInputText;

  _inputTextRef: $ElementRefObject<typeof BaseInputText> = React.createRef();

  /**
   * Moves the browser focus to the input DOM node
   * @public
   */
  focus(): void {
    if (this._inputTextRef.current) {
      this._inputTextRef.current.focus();
    }
  }

  render(): React.Element<typeof BaseInputText> {
    return <BaseInputText isControlled {...this.props} />;
  }
}
