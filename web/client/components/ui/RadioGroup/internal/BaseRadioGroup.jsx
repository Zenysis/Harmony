// @flow
import * as React from 'react';
import classNames from 'classnames';
import invariant from 'invariant';

import RadioItemWrapper from 'components/ui/RadioGroup/internal/RadioItemWrapper';
import autobind from 'decorators/autobind';
import { uniqueId } from 'util/util';
import type { RadioItemElement } from 'components/ui/RadioGroup/RadioItem';

type RadioChangeEventHandler<T> = (
  selectedValue: T,
  name: string,
  event: SyntheticMouseEvent<HTMLInputElement>,
) => void;

type ControlledProps<T> = {
  value: T,
  isControlled: true,
  onChange: RadioChangeEventHandler<T>,
};

type UncontrolledProps<T> = {
  initialValue: T,
  isControlled: false,
  onChange?: RadioChangeEventHandler<T>,
};

type DefaultProps = {
  className: string,
  direction: 'horizontal' | 'vertical',
  name: string, // an optional name used to identify the radio group
  testId?: string,
};

type BaseProps<T> = {
  ...DefaultProps,
  children: React.ChildrenArray<RadioItemElement<T>>,
};

type Props<T> =
  | { ...BaseProps<T>, ...ControlledProps<T> }
  | { ...BaseProps<T>, ...UncontrolledProps<T> };

type State<T> = {
  value: T | void,
};

export default class BaseRadioGroup<T> extends React.PureComponent<
  Props<T>,
  State<T>,
> {
  static defaultProps: DefaultProps = {
    className: '',
    direction: 'horizontal',
    name: '',
    testId: undefined,
  };

  state: State<T> = {
    value: this.props.isControlled ? undefined : this.props.initialValue,
  };

  getValue(): T {
    if (this.props.isControlled) {
      return this.props.value;
    }

    invariant(
      this.state.value !== undefined,
      '[RadioGroup] Component cannot be uncontrolled and have an undefined value',
    );
    return this.state.value;
  }

  @autobind
  onItemSelect(
    selectedValue: T,
    name: string,
    event: SyntheticMouseEvent<HTMLInputElement>,
  ) {
    const { onChange, isControlled } = this.props;
    if (!isControlled) {
      this.setState({ value: selectedValue });
    }

    if (onChange) {
      onChange(selectedValue, name, event);
    }
  }

  render(): React.Element<'div'> {
    const { children, className, direction, testId, name } = this.props;
    const currentValue = this.getValue();

    const radioItems = React.Children.map(children, radioItem => (
      <RadioItemWrapper
        key={radioItem.key || radioItem.props.value}
        ariaName={radioItem.props.ariaName}
        id={radioItem.props.id || `zen-radio-item-${uniqueId()}`}
        selected={radioItem.props.value === currentValue}
        disabled={radioItem.props.disabled || false}
        value={radioItem.props.value}
        className={radioItem.props.className || ''}
        name={radioItem.props.name || name}
        testId={radioItem.props.testId}
        onSelect={this.onItemSelect}
      >
        {radioItem.props.children}
      </RadioItemWrapper>
    ));

    const containerClassName = classNames('zen-radio-group', className, {
      'zen-radio-group--vertical': direction === 'vertical',
      'zen-radio-group--horizontal': direction === 'horizontal',
    });

    return (
      <div
        className={containerClassName}
        data-testid={testId}
        role="radiogroup"
      >
        {radioItems}
      </div>
    );
  }
}
