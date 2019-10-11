// @flow
import * as React from 'react';

import BaseCheckbox from 'components/ui/Checkbox/internal/BaseCheckbox';
import UncontrolledCheckbox from 'components/ui/Checkbox/UncontrolledCheckbox';

type ControlledProps = {
  /** **Required for a controlled checkbox** */
  value: boolean,

  /** **Required for a controlled checkbox** */
  onChange: (
    isSelected: boolean,
    name: string,
    event: SyntheticEvent<HTMLElement>,
  ) => void,
};

type BaseProps = {
  children: React.Node,
  className: string,

  /** Disables the checkbox. The `onChange` event will no longer fire. */
  disabled: boolean,

  /** DOM id for this checkbox */
  id?: string,

  /** The label to attach to this checkbox */
  label?: string,

  /** Whether the label should go to the left or right of the checkbox */
  labelPlacement: 'left' | 'right',

  /**
   * An optional name used to identify the checkbox in the `onChange` handler
   */
  name: string,
};

type Props = ControlledProps & BaseProps;

const defaultProps = {
  children: null,
  className: '',
  disabled: false,
  id: undefined,
  label: undefined,
  labelPlacement: 'right',
  name: '',
};

/**
 * `<Checkbox>` is a single on/off togglable checkbox. This is a controlled
 * component.
 *
 * For the uncontrolled version, use `<Checkbox.Uncontrolled>`.
 *
 * If you needed to track an array of values, toggleable through checkboxes,
 * then `<CheckboxGroup>` is better suited for your needs.
 *
 * If you don't want to use the default input checkbox appearance, but instead
 * want your own custom checkbox (e.g. using icons), you will need to use the
 * children prop. You will have to handle the logic to flip the appearance based
 * on the checked state yourself.
 */
export default function Checkbox(props: Props) {
  return <BaseCheckbox isControlled {...props} />;
}

Checkbox.Uncontrolled = UncontrolledCheckbox;
Checkbox.defaultProps = defaultProps;
