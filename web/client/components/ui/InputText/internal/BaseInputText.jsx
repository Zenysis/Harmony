// @flow
import * as React from 'react';
import classNames from 'classnames';
import invariant from 'invariant';

import Icon from 'components/ui/Icon';
import autobind from 'decorators/autobind';
import { debounce } from 'util/util';
import type { IconType } from 'components/ui/Icon/types';
import type { StyleObject } from 'types/jsCore';

type InputChangeEventHandler = (
  value: string,
  event: SyntheticEvent<HTMLInputElement>,
) => void;

// NOTE(pablo): look at InputText/index.jsx and UncontrolledInputText.jsx for
// documentation on all of these props.
type UncontrolledProps = {
  debounce: boolean,
  debounceTimeoutMs: number,
  initialValue: string,
  isControlled: false,
  onChange?: InputChangeEventHandler,
};

type ControlledProps = {
  isControlled: true,
  value: string,
  onChange: InputChangeEventHandler,
};

type BaseProps = {
  className: string,
  disabled: boolean,
  icon?: IconType,
  id: string,
  onClick?: (SyntheticEvent<HTMLInputElement>) => void,
  onEnterPress?: (SyntheticKeyboardEvent<HTMLInputElement>) => void,
  onKeyPress?: (SyntheticKeyboardEvent<HTMLInputElement>) => void,
  placeholder: string,
  style: StyleObject,
  type: 'text' | 'password' | 'email' | 'number',
  width?: number | string,
};

type Props = (BaseProps & ControlledProps) | (BaseProps & UncontrolledProps);
type State = {
  value: string | void,
};

export default class BaseInputText extends React.PureComponent<Props, State> {
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

  _inputElt: $RefObject<'input'> = React.createRef();
  _onChangeFn =
    !this.props.isControlled && this.props.debounce
      ? debounce(this.props.onChange, this.props.debounceTimeoutMs)
      : this.props.onChange;

  state = {
    value: this.props.isControlled ? undefined : this.props.initialValue,
  };

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

      if (this._onChangeFn) {
        this._onChangeFn(inputNode.value, event);
      }
    }
  }

  @autobind
  onKeyPress(event: SyntheticKeyboardEvent<HTMLInputElement>) {
    if (this.props.onKeyPress) {
      this.props.onKeyPress(event);
    }

    if (event.key === 'Enter') {
      const { onEnterPress } = this.props;
      if (onEnterPress) {
        onEnterPress(event);
      } else {
        event.preventDefault();
      }
    }
  }

  renderInput() {
    const {
      type,
      className,
      id,
      icon,
      placeholder,
      disabled,
      onClick,
    } = this.props;
    const inputClassName = classNames('zen-input-text', {
      'zen-input-text--has-icon': icon !== undefined,

      // only add the className from props here if we have no icon. Otherwise,
      // the className got added to `zen-input-text-wrapper`
      [className]: icon === undefined,
    });

    return (
      <input
        className={inputClassName}
        style={this.getStyle()}
        type={type}
        id={id}
        disabled={disabled}
        ref={this._inputElt}
        placeholder={placeholder}
        onChange={this.onChange}
        onKeyPress={this.onKeyPress}
        onClick={onClick}
        value={this.getValue()}
      />
    );
  }

  render() {
    const { icon, className } = this.props;
    if (icon !== undefined) {
      return (
        <div className={`zen-input-text-wrapper ${className}`}>
          <Icon className="zen-input-text-wrapper__icon" type={icon} />
          {this.renderInput()}
        </div>
      );
    }
    return this.renderInput();
  }
}
