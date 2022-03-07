// @flow
import * as React from 'react';

import BaseRadioGroup from 'components/ui/RadioGroup/internal/BaseRadioGroup';
import RadioItem from 'components/ui/RadioGroup/RadioItem';
import UncontrolledRadioGroup from 'components/ui/RadioGroup/UncontrolledRadioGroup';
import type { RadioItemElement } from 'components/ui/RadioGroup/RadioItem';

type ControlledProps<T> = {
  /** **Required for a controlled RadioGroup** */
  value: T,

  /** **Required for a controlled RadioGroup** */
  onChange: (
    selectedValue: T,
    name: string,
    event: SyntheticMouseEvent<HTMLInputElement>,
  ) => void,
};

type DefaultProps = {
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
  ...DefaultProps,
  ...ControlledProps<T>,
  children: React.ChildrenArray<RadioItemElement<T>>,
};

/**
 * A group of radio items. This is a controlled component.
 *
 * For the uncontrolled version, use [`<RadioGroup.Uncontrolled>`](#uncontrolledradiogroup).
 */
export default class RadioGroup<T> extends React.Component<Props<T>> {
  static Item: typeof RadioItem = RadioItem;
  static Uncontrolled: typeof UncontrolledRadioGroup = UncontrolledRadioGroup;

  static defaultProps: DefaultProps = {
    className: '',
    direction: 'horizontal',
    name: '',
    testId: undefined,
  };

  render(): React.Element<typeof BaseRadioGroup> {
    return <BaseRadioGroup isControlled {...this.props} />;
  }
}
