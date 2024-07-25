// @flow
import * as React from 'react';

import BaseRadioGroup from 'components/ui/RadioGroup/internal/BaseRadioGroup';
import type { RadioItemElement } from 'components/ui/RadioGroup/RadioItem';

type UncontrolledRequiredProps<T> = {
  /** **Required for an uncontrolled RadioGroup.** */
  initialValue: T,
};

type UncontrolledDefaultProps<T> = {
  /** **Optional for an uncontrolled RadioGroup.** */
  onChange?: (
    selectedValue: T,
    name: string,
    event: SyntheticMouseEvent<HTMLInputElement>,
  ) => void,
};

type DefaultProps<T> = {
  ...UncontrolledDefaultProps<T>,
  className: string,

  /** Render the radio items as a horizontal or vertical list */
  direction: 'horizontal' | 'vertical',

  /**
   * An optional name used to identify the radio group. This is not displayed
   * anywhere and is used only as an additional way to identify the radio
   * group in the `onChange` callback.
   */
  name: string,

  /**
   * The test id to add to the radio group. This adds a `data-testid`
   * attribute and is useful for working with testing libraries.
   */
  testId: string | void,
};

type Props<T> = {
  ...DefaultProps<T>,
  ...UncontrolledRequiredProps<T>,
  children: React.ChildrenArray<RadioItemElement<T>>,
};

/**
 * A group of radio items. This is an uncontrolled component.
 *
 * For the controlled version, use [`<RadioGroup>`](#radiogroup).
 *
 * @visibleName RadioGroup.Uncontrolled
 */
export default class UncontrolledRadioGroup<T> extends React.Component<
  Props<T>,
> {
  static defaultProps: DefaultProps<T> = {
    className: '',
    direction: 'horizontal',
    name: '',
    onChange: undefined,
    testId: undefined,
  };

  _radioGroupRef: $ElementRefObject<
    Class<BaseRadioGroup<T>>,
  > = React.createRef();

  /**
   * Get the value currently selected in the RadioGroup.
   * @public
   */
  getValue(): T {
    if (this._radioGroupRef.current) {
      return this._radioGroupRef.current.getValue();
    }
    throw new Error(
      '[UncontrolledRadioGroup] Could not getValue because the ref is not defined',
    );
  }

  render(): React.Element<typeof BaseRadioGroup> {
    return (
      <BaseRadioGroup
        ref={this._radioGroupRef}
        isControlled={false}
        {...this.props}
      />
    );
  }
}
