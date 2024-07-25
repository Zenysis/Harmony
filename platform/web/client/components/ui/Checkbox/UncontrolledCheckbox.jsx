// @flow
import * as React from 'react';

import BaseCheckbox from 'components/ui/Checkbox/internal/BaseCheckbox';
import type { CheckboxValue } from 'components/ui/Checkbox/internal/BaseCheckbox';

type DefaultProps = {
  /** The accessibility name for this checkbox. */
  ariaName?: string,
  children: React.Node,
  className: string,

  /** Disables the checkbox. The `onChange` event will no longer fire. */
  disabled: boolean,

  /** DOM id for this checkbox */
  id?: string,

  /** The label to attach to this checkbox */
  label?: React.Node,

  /** Whether the label should go to the left or right of the checkbox */
  labelPlacement: 'left' | 'right',

  /**
   * An optional name used to identify the checkbox in the `onChange` handler
   */
  name: string,

  /** **Optional for an uncontrolled checkbox** */
  onChange?: (
    isSelected: boolean,
    name: string,
    event: SyntheticEvent<HTMLElement>,
  ) => void,
};

type Props = {
  ...DefaultProps,

  /**
   * **Required for an uncontrolled checkbox.**
   *
   * One of: `true`, `false`, `'indeterminate'`
   */
  initialValue: CheckboxValue,
};

/**
 * `<Checkbox.Uncontrolled>` is a single on/off togglable checkbox.
 * This is an uncontrolled component.
 *
 * For the controlled version, use the default `<Checkbox>`.
 *
 * If you don't want to use the default input checkbox appearance, but instead
 * want your own custom checkbox (e.g. using icons), you will need to use the
 * children prop. You will have to handle the logic to flip the appearance based
 * on the checked state yourself.
 *
 * @visibleName Checkbox.Uncontrolled
 */
export default class UncontrolledCheckbox extends React.Component<Props> {
  static defaultProps: DefaultProps = {
    ariaName: undefined,
    children: null,
    className: '',
    disabled: false,
    id: undefined,
    label: null,
    labelPlacement: 'right',
    name: '',
    onChange: undefined,
  };

  _checkboxRef: $ElementRefObject<typeof BaseCheckbox> = React.createRef();

  /**
   * Get the current selection state of the checkbox
   * @public
   */
  getValue(): CheckboxValue {
    if (this._checkboxRef.current) {
      return this._checkboxRef.current.getValue();
    }
    throw new Error(
      '[UncontrolledCheckbox] Could not getValue because the ref is not defined',
    );
  }

  render(): React.Element<typeof BaseCheckbox> {
    return <BaseCheckbox isControlled={false} {...this.props} />;
  }
}
