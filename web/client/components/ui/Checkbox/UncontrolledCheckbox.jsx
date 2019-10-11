// @flow
import * as React from 'react';

import BaseCheckbox from 'components/ui/Checkbox/internal/BaseCheckbox';

type UncontrolledProps = {
  /** **Required for an uncontrolled checkbox.** */
  initialValue: boolean,

  /** **Optional for an uncontrolled checkbox** */
  onChange?: (
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

  /**
   * An optional name used to identify the checkbox in the `onChange` handler
   */
  name: string,
};

type Props = UncontrolledProps & BaseProps;

/**
 * `<Checkbox.Uncontrolled>` is a single on/off togglable checkbox.
 * This is an uncontrolled component.
 *
 * For the controlled version, use the default `<Checkbox>`.
 *
 * If you needed to track an array of values, toggleable through checkboxes,
 * then `<CheckboxGroup>` is better suited for your needs.
 *
 * If you don't want to use the default input checkbox appearance, but instead
 * want your own custom checkbox (e.g. using icons), you will need to use the
 * children prop. You will have to handle the logic to flip the appearance based
 * on the checked state yourself.
 *
 * @visibleName Checkbox.Uncontrolled
 */
export default class UncontrolledCheckbox extends React.Component<Props> {
  static defaultProps = {
    children: null,
    className: '',
    disabled: false,
    id: undefined,
    name: '',
    onChange: undefined,
  };

  _checkboxRef: $RefObject<typeof BaseCheckbox> = React.createRef();

  /**
   * Get the current selection state of the checkbox
   * @public
   */
  getValue(): boolean {
    if (this._checkboxRef.current) {
      return this._checkboxRef.current.getValue();
    }
    throw new Error(
      '[UncontrolledCheckbox] Could not getValue because the ref is not defined',
    );
  }

  render() {
    return <BaseCheckbox isControlled={false} {...this.props} />;
  }
}
