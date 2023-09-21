// @flow
import * as React from 'react';

import BaseCheckbox from 'components/ui/Checkbox/internal/BaseCheckbox';
import UncontrolledCheckbox from 'components/ui/Checkbox/UncontrolledCheckbox';
import type { CheckboxValue } from 'components/ui/Checkbox/internal/BaseCheckbox';

type DefaultProps = {
  /** The accessibility name for this checkbox. */
  ariaName?: string,
  children?: React.Node,
  className?: string,

  /** Disables the checkbox. The `onChange` event will no longer fire. */
  disabled?: boolean,

  /** DOM id for this checkbox */
  id?: string,

  /** The label to attach to this checkbox */
  label?: React.Node,

  /** Whether the label should go to the left or right of the checkbox */
  labelPlacement?: 'left' | 'right',

  /**
   * An optional name used to identify the checkbox in the `onChange` handler
   * This is not the same as the `ariaName` which is used for accessibility
   * purposes.
   */
  name?: string,

  /**
   * Sets data-testid used in webdriver tests
   */
  testId?: string,
};

type Props = {
  ...DefaultProps,
  /** **Required for a controlled checkbox** */
  onChange: (
    isSelected: boolean,
    name: string,
    event: SyntheticEvent<HTMLElement>,
  ) => void,

  /**
   * **Required for a controlled checkbox**
   *
   * One of: `true`, `false`, `'indeterminate'`
   */
  value: CheckboxValue,
};

/**
 * `<Checkbox>` is a single on/off togglable checkbox. This is a controlled
 * component.
 *
 * For the uncontrolled version, use `<Checkbox.Uncontrolled>`.
 *
 * If you don't want to use the default input checkbox appearance, but instead
 * want your own custom checkbox (e.g. using icons), you will need to use the
 * children prop. You will have to handle the logic to flip the appearance based
 * on the checked state yourself.
 */
export default function Checkbox({
  onChange,
  value,
  ariaName = undefined,
  children = null,
  className = '',
  disabled = false,
  id = undefined,
  label = null,
  labelPlacement = 'right',
  name = '',
  testId = undefined,
}: Props): React.Element<typeof BaseCheckbox> {
  return (
    <BaseCheckbox
      ariaName={ariaName}
      className={className}
      disabled={disabled}
      id={id}
      isControlled
      label={label}
      labelPlacement={labelPlacement}
      name={name}
      onChange={onChange}
      testId={testId}
      value={value}
    >
      {children}
    </BaseCheckbox>
  );
}

Checkbox.Uncontrolled = UncontrolledCheckbox;
