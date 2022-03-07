// @flow
import * as React from 'react';
import classNames from 'classnames';
import invariant from 'invariant';

import Icon from 'components/ui/Icon';
import autobind from 'decorators/autobind';
import normalizeARIAName from 'components/ui/util/normalizeARIAName';
import { debounce, noop } from 'util/util';
import type { IconType } from 'components/ui/Icon/types';
import type { StyleObject } from 'types/jsCore';

// NOTE(pablo): look at InputText/index.jsx and UncontrolledInputText.jsx for
// documentation on all of these props.
type UncontrolledRequiredProps = {
  debounce: boolean,
  debounceTimeoutMs: number,
  initialValue: string,
  isControlled: false,
};

type ControlledRequiredProps = {
  isControlled: true,
  value: string,
};

type DefaultProps = {
  ariaName?: string,
  className: string,
  disabled: boolean,
  icon?: IconType,
  id?: string,
  invalid?: boolean,
  invalidMessage?: string,
  max: number | void,
  min: number | void,
  onBlur?: (SyntheticFocusEvent<HTMLInputElement>) => void,
  onChange: (value: string, event: SyntheticEvent<HTMLInputElement>) => void,
  onClick?: (SyntheticEvent<HTMLInputElement>) => void,
  onEnterPress?: (SyntheticKeyboardEvent<HTMLInputElement>) => void,
  onFocus?: (SyntheticFocusEvent<HTMLInputElement>) => void,
  onKeyDown?: (SyntheticKeyboardEvent<HTMLInputElement>) => void,
  placeholder: string,
  step: number | string | 'any',
  style?: StyleObject,
  // HACK(Kenneth) This is temporary while we create a
  // file upload UI component
  type: 'text' | 'password' | 'email' | 'number' | 'file',
  width?: number | string,
  testId?: string,
};

type Props =
  | { ...DefaultProps, ...ControlledRequiredProps }
  | { ...DefaultProps, ...UncontrolledRequiredProps };

type State = {
  value: string | void,
};

type OnChangeFn = (
  value: string,
  event: SyntheticEvent<HTMLInputElement>,
) => void;

export default class BaseInputText extends React.Component<Props, State> {
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
    onChange: noop,
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

  _inputElt: $ElementRefObject<'input'> = React.createRef();

  _onChangeFnRef: { current: OnChangeFn } = { current: this.props.onChange };

  _onChangeFn: OnChangeFn | { current: OnChangeFn } =
    !this.props.isControlled && this.props.debounce
      ? debounce(this._onChangeFnRef, this.props.debounceTimeoutMs)
      : this._onChangeFnRef;

  state: State = {
    value: this.props.isControlled ? undefined : this.props.initialValue,
  };

  componentDidUpdate(prevProps: Props) {
    const { onChange } = this.props;
    if (prevProps.onChange !== onChange) {
      this._onChangeFnRef.current = onChange;
    }
  }

  clear(): void {
    if (this.props.isControlled) {
      throw new Error(
        '[InputText] You should only be calling clear() directly on the ' +
          'InputText if it is an uncontrolled component.',
      );
    }
    this.setState({ value: '' });
  }

  focus(): void {
    if (this._inputElt.current) {
      this._inputElt.current.focus();
    }
  }

  getValue(): string {
    if (this.props.isControlled) {
      return this.props.value;
    }

    invariant(
      this.state.value !== undefined,
      '[InputText] Component cannot be uncontrolled and have an undefined value',
    );
    return this.state.value;
  }

  getStyle(): StyleObject | void {
    const { style, width } = this.props;
    if (width !== undefined || style !== undefined) {
      return {
        ...style,
        width,
      };
    }
    return undefined;
  }

  @autobind
  onChange(event: SyntheticEvent<HTMLInputElement>) {
    const inputNode = event.target;
    if (inputNode instanceof HTMLInputElement) {
      if (!this.props.isControlled) {
        this.setState({ value: inputNode.value });
      }

      const onChangeFn =
        typeof this._onChangeFn === 'function'
          ? this._onChangeFn
          : this._onChangeFn.current;
      onChangeFn(inputNode.value, event);
    }
  }

  @autobind
  onKeyDown(event: SyntheticKeyboardEvent<HTMLInputElement>) {
    if (this.props.onKeyDown) {
      this.props.onKeyDown(event);
    }
  }

  @autobind
  onKeyPress(event: SyntheticKeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      const { onEnterPress } = this.props;
      if (onEnterPress) {
        onEnterPress(event);
      } else {
        event.preventDefault();
      }
    }
  }

  maybeRenderIcon(): React.Node {
    const { icon } = this.props;
    if (icon !== undefined) {
      return <Icon className="zen-input-text-wrapper__icon" type={icon} />;
    }
    return null;
  }

  maybeRenderInvalidMessage(): React.Node {
    const { invalid, invalidMessage } = this.props;
    if (invalid && invalidMessage !== undefined && invalidMessage !== '') {
      return (
        <div className="zen-input-text-wrapper__invalid-msg">
          {invalidMessage}
        </div>
      );
    }
    return null;
  }

  renderInput(): React.Element<'input'> {
    const {
      ariaName,
      type,
      className,
      id,
      invalid,
      icon,
      placeholder,
      disabled,
      max,
      min,
      onClick,
      step,
      onFocus,
      onBlur,
      testId,
    } = this.props;
    const inputClassName = classNames('zen-input-text', {
      'zen-input-text--has-icon': icon !== undefined,
      'zen-input-text--invalid': invalid,

      // only add the className from props here if we have no icon. Otherwise,
      // the className got added to `zen-input-text-wrapper`
      [className]: icon === undefined,
    });

    const isTypeNumber = type === 'number';
    return (
      <input
        aria-label={normalizeARIAName(ariaName)}
        className={inputClassName}
        style={this.getStyle()}
        type={type}
        role={type !== 'text' ? 'textbox' : undefined}
        id={id}
        disabled={disabled}
        ref={this._inputElt}
        placeholder={placeholder}
        onChange={this.onChange}
        onKeyDown={this.onKeyDown}
        onKeyPress={this.onKeyPress}
        onFocus={onFocus}
        onBlur={onBlur}
        onClick={onClick}
        value={this.getValue()}
        step={isTypeNumber ? step : undefined}
        max={isTypeNumber ? max : undefined}
        min={isTypeNumber ? min : undefined}
        data-testid={testId}
      />
    );
  }

  render(): React.Node {
    const { icon, className, invalidMessage, invalid, width } = this.props;
    const hasInvalidMessage =
      invalidMessage !== undefined && invalidMessage !== '';
    if (icon !== undefined || hasInvalidMessage) {
      const wrapperClassName = classNames('zen-input-text-wrapper', className, {
        'zen-input-text-wrapper--show-invalid-msg':
          hasInvalidMessage && invalid,
      });
      return (
        <div
          className={wrapperClassName}
          style={width !== undefined ? { width } : undefined}
        >
          {this.maybeRenderIcon()}
          {this.renderInput()}
          {this.maybeRenderInvalidMessage()}
        </div>
      );
    }
    return this.renderInput();
  }
}
