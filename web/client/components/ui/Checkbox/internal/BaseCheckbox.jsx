// @flow
import * as React from 'react';
import classNames from 'classnames';

import LabelWrapper from 'components/ui/LabelWrapper';
import autobind from 'decorators/autobind';
import { uniqueId } from 'util/util';

type CheckboxChangeEventHandler = (
  isSelected: boolean,
  name: string,
  event: SyntheticEvent<HTMLElement>,
) => void;

// NOTE(pablo): look at InputText/index.jsx and UncontrolledInputText.jsx for
// documentation on all of these props.
type UncontrolledProps = {
  initialValue: boolean,
  isControlled: false,
  onChange?: CheckboxChangeEventHandler,
};

type ControlledProps = {
  isControlled: true,
  value: boolean,
  onChange: CheckboxChangeEventHandler,
};

type BaseProps = {
  children: React.Node,
  className: string,
  disabled: boolean,
  id?: string, // DOM ID for this checkbox
  label?: string,
  labelPlacement: 'left' | 'right',
  name: string, // an optional name used to identify the checkbox
};

type Props = (BaseProps & ControlledProps) | (BaseProps & UncontrolledProps);
type State = {
  isSelected: boolean,

  // due to the custom styling of the checkbox, we cannot capture hover events
  // through CSS (because the hover event is captured on the `input` element,
  // but our custom styles are applied on a separate DOM node). So we need
  // to track the hover state ourselves.
  isHovered: boolean,
};

export default class BaseCheckbox extends React.PureComponent<Props, State> {
  static defaultProps = {
    children: null,
    className: '',
    disabled: false,
    id: undefined,
    label: undefined,
    labelPlacement: 'right',
    name: '',
  };

  _checkboxUniqueId = `zen_checkbox_${uniqueId()}`;

  constructor(props: Props) {
    super(props);
    if (this.props.isControlled) {
      this.state = {
        isHovered: false,

        // the isSelected value doesn't matter in a controlled component
        isSelected: false,
      };
    } else {
      this.state = {
        isHovered: false,
        isSelected: this.props.initialValue,
      };
    }
  }

  getValue(): boolean {
    return this.props.isControlled ? this.props.value : this.state.isSelected;
  }

  @autobind
  onMouseEnterCheckbox() {
    this.setState({ isHovered: true });
  }

  @autobind
  onMouseLeaveCheckbox() {
    this.setState({ isHovered: false });
  }

  @autobind
  onItemSelect(event: SyntheticEvent<HTMLElement>) {
    // We ignore the selectedValue because we don't actually care about it,
    // all we care is the checked/unchecked state
    const { onChange, name, disabled } = this.props;
    if (disabled) {
      return;
    }

    const isSelected = !this.getValue();
    if (!this.props.isControlled) {
      this.setState({ isSelected });
    }

    if (onChange) {
      onChange(isSelected, name, event);
    }
  }

  renderCheckboxItem() {
    const { children, id, name, disabled } = this.props;
    const { isHovered } = this.state;
    const isChecked = this.getValue();

    if (!children) {
      const overrideClassName = classNames(
        'zen-checkbox__input-item-override',
        {
          'zen-checkbox__input-item-override--checked': isChecked && !disabled,
          'zen-checkbox__input-item-override--is-hovered':
            isHovered && !disabled,
          'zen-checkbox__input-item-override--disabled': disabled,
          'zen-checkbox__input-item-override--checked-and-disabled':
            isChecked && disabled,
        },
      );
      return (
        <div className="zen-checkbox__input-item-wrapper">
          <input
            className="zen-checkbox__input-item"
            onChange={this.onItemSelect}
            type="checkbox"
            id={id === undefined ? this._checkboxUniqueId : id}
            name={name}
            value={name}
            checked={isChecked}
            disabled={disabled}
            onMouseEnter={this.onMouseEnterCheckbox}
            onMouseLeave={this.onMouseLeaveCheckbox}
          />
          <span className={overrideClassName} />
        </div>
      );
    }

    // if we're using custom children then it's up to the user to change
    // the child accordingly to look checked/unchecked/disabled
    return (
      <div
        role="checkbox"
        aria-checked={isChecked}
        onClick={this.onItemSelect}
        className="zen-checkbox__custom-item-wrapper"
      >
        {children}
      </div>
    );
  }

  renderWithLabel(label: string) {
    const { labelPlacement, id } = this.props;
    return (
      <LabelWrapper
        inline
        label={label}
        labelAfter={labelPlacement === 'right'}
        htmlFor={id === undefined ? this._checkboxUniqueId : id}
      >
        {this.renderCheckboxItem()}
      </LabelWrapper>
    );
  }

  render() {
    const { className, label, disabled } = this.props;
    const checkboxClassName = classNames('zen-checkbox', className, {
      'zen-checkbox--disabled': disabled,
    });

    const contents =
      label !== undefined
        ? this.renderWithLabel(label)
        : this.renderCheckboxItem();
    return <div className={checkboxClassName}>{contents}</div>;
  }
}
