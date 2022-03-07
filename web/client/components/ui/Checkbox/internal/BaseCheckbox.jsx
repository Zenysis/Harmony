// @flow
import * as React from 'react';
import classNames from 'classnames';

import LabelWrapper from 'components/ui/LabelWrapper';
import autobind from 'decorators/autobind';
import normalizeARIAName from 'components/ui/util/normalizeARIAName';
import { uniqueId } from 'util/util';

export type CheckboxValue = boolean | 'indeterminate';

type CheckboxChangeEventHandler = (
  isSelected: boolean,
  name: string,
  event: SyntheticEvent<HTMLElement>,
) => void;

type UncontrolledProps = {
  initialValue: CheckboxValue,
  isControlled: false,
  onChange?: CheckboxChangeEventHandler,
};

type ControlledProps = {
  isControlled: true,
  value: CheckboxValue,
  onChange: CheckboxChangeEventHandler,
};

type DefaultProps = {
  ariaName?: string,
  children: React.Node,
  className: string,
  disabled: boolean,
  id?: string, // DOM ID for this checkbox
  label?: React.Node,
  labelPlacement: 'left' | 'right',

  // an optional name used to identify the checkbox in the `onChange` handler.
  // This is not the same as the `ariaName` which is used for accessibility
  // purposes.
  name: string,
  testId?: string,
};

type Props =
  | { ...DefaultProps, ...ControlledProps }
  | { ...DefaultProps, ...UncontrolledProps };

type State = {
  isSelected: CheckboxValue,

  // due to the custom styling of the checkbox, we cannot capture hover events
  // through CSS (because the hover event is captured on the `input` element,
  // but our custom styles are applied on a separate DOM node). So we need
  // to track the hover state ourselves.
  isHovered: boolean,
};

export default class BaseCheckbox extends React.PureComponent<Props, State> {
  static defaultProps: DefaultProps = {
    ariaName: undefined,
    children: null,
    className: '',
    disabled: false,
    id: undefined,
    label: null,
    labelPlacement: 'right',
    name: '',
    testId: undefined,
  };

  _checkboxUniqueId: string = `zen_checkbox_${uniqueId()}`;

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

  getValue(): CheckboxValue {
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

    // State should go from unselected to selected on click. If the checkbox is
    // indeterminate, the state should go to selected next.
    const isSelected = this.getValue() !== true;
    if (!this.props.isControlled) {
      this.setState({ isSelected });
    }

    if (onChange) {
      onChange(isSelected, name, event);
    }
  }

  renderCheckboxItem(): React.Node {
    const {
      children,
      ariaName,
      label,
      id,
      name,
      disabled,
      testId,
    } = this.props;
    const { isHovered } = this.state;
    const value = this.getValue();
    const isChecked = value === true;
    const isIndeterminate = value === 'indeterminate';

    // if no ARIA Name was specified, use the checkbox label if it's a string
    // or a number
    const ariaNameToUse =
      ariaName ||
      (typeof label === 'string' || typeof label === 'number'
        ? String(label)
        : undefined);

    if (!children) {
      const overrideClassName = classNames(
        'zen-checkbox__input-item-override',
        {
          'zen-checkbox__input-item-override--checked': isChecked && !disabled,
          'zen-checkbox__input-item-override--checked-and-disabled':
            isChecked && disabled,
          'zen-checkbox__input-item-override--is-hovered':
            isHovered && !disabled,
          'zen-checkbox__input-item-override--disabled': disabled,
          'zen-checkbox__input-item-override--indeterminate':
            isIndeterminate && !disabled,
          'zen-checkbox__input-item-override--indeterminate-and-disabled':
            isIndeterminate && disabled,
        },
      );
      return (
        <div className="zen-checkbox__input-item-wrapper">
          <input
            className="zen-checkbox__input-item"
            onChange={this.onItemSelect}
            type="checkbox"
            aria-label={normalizeARIAName(ariaNameToUse)}
            id={id === undefined ? this._checkboxUniqueId : id}
            name={name}
            value={name}
            checked={isChecked}
            disabled={disabled}
            onMouseEnter={this.onMouseEnterCheckbox}
            onMouseLeave={this.onMouseLeaveCheckbox}
            data-testid={testId}
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
        aria-label={normalizeARIAName(ariaNameToUse)}
        aria-disabled={disabled}
        onClick={this.onItemSelect}
        className="zen-checkbox__custom-item-wrapper"
      >
        {children}
      </div>
    );
  }

  renderLabel(label: React.Node): React.Node {
    const { children } = this.props;
    if (!children) {
      return label;
    }

    // if the user is providing their own children then we need to make the
    // label clickable (so that the user can still toggle the checked state
    // by clicking the label). We didn't have to explicitly do this otherwise
    // because the browser automatically handles this with htmlFor and the
    // input's id.
    return (
      <span role="button" onClick={this.onItemSelect}>
        {label}
      </span>
    );
  }

  renderWithLabel(label: React.Node): React.Element<typeof LabelWrapper> {
    const { labelPlacement, id } = this.props;
    return (
      <LabelWrapper
        inline
        label={this.renderLabel(label)}
        labelAfter={labelPlacement === 'right'}
        htmlFor={id === undefined ? this._checkboxUniqueId : id}
      >
        {this.renderCheckboxItem()}
      </LabelWrapper>
    );
  }

  render(): React.Element<'div'> {
    const { className, label, disabled } = this.props;
    const checkboxClassName = classNames('zen-checkbox', className, {
      'zen-checkbox--disabled': disabled,
    });

    const contents =
      label !== undefined && label !== null
        ? this.renderWithLabel(label)
        : this.renderCheckboxItem();
    return <div className={checkboxClassName}>{contents}</div>;
  }
}
