// @flow
import * as React from 'react';
import classNames from 'classnames';

import Group from 'components/ui/Group';
import I18N from 'lib/I18N';

type Props = {
  activated?: boolean,

  className?: string,

  /** Label for the disabled state of the toggle. */
  disabledLabel?: string,

  /**
   * This prop determines which labels to show on the switch.
   *
   * If it is set to "both" then the disabledLabel is shown on the left and the
   * enabledLabel on the right.
   *
   * If it is set to "left" or "right" then only the label representing the
   * current state of the switch is shown on the side specified. For example, if
   * this prop is set to "left" and the value prop is true then the only label
   * shown is the enabledLabel on the left of the switch.
   */
  displayLabels?: 'left' | 'right' | 'both',

  /** Label for the enabled state of the toggle. */
  enabledLabel?: string,

  /**
   * Determines if we highlight the toggle in blue when it is enabled. It
   * should only be set to false when switching between two valid options. It
   * should always be true for the normal use case of an on/off switch.
   */
  highlightEnabledState?: boolean,

  /** DOM id for this toggle */
  id?: string,

  /**
   * Label to display for all states. Only displays when one of 'left' or
   * 'right' is chosen for displayLabels. Overrides display and enabled labels.
   */
  label?: string,

  /** Gets called when the toggle is clicked */
  onChange: () => void,

  /** The current value of the toggle. It is true if it is set to enabled. */
  value: boolean,
};

/**
 * A simple toggle to enable/disable something or switch between two options.
 * ToggleSwitch is a controlled component so does not track its state
 * internally. This is managed by the value and onChange props.
 */
function ToggleSwitch({
  onChange,
  value,
  activated = true,
  className = '',
  disabledLabel = I18N.textById('Disabled'),
  enabledLabel = I18N.textById('Enabled'),
  displayLabels = 'both',
  label = '',
  highlightEnabledState = true,
  id = undefined,
}: Props) {
  const toggleClassName = classNames('zen-toggle', {
    'zen-toggle--deactivated': !activated,
    'zen-toggle--disabled': activated && !value,
    'zen-toggle--enabled': activated && value,
    'zen-toggle--highlight': activated && value && highlightEnabledState,
  });
  const labelClassName = classNames('zen-toggle__label', {
    'zen-toggle__label--activated': activated,
    'zen-toggle__label--deactivated': !activated,
  });

  let leftLabel = null;
  let rightLabel = null;
  if (displayLabels === 'both') {
    leftLabel = disabledLabel;
    rightLabel = enabledLabel;
  } else if (displayLabels === 'left') {
    if (label !== '') {
      leftLabel = label;
    } else {
      leftLabel = activated && value ? enabledLabel : disabledLabel;
    }
  } else if (displayLabels === 'right') {
    if (label !== '') {
      rightLabel = label;
    } else {
      rightLabel = activated && value ? enabledLabel : disabledLabel;
    }
  }

  return (
    <Group.Horizontal
      className={`zen-toggle-container ${className}`}
      spacing="xs"
    >
      {leftLabel === null ? null : (
        <span className="zen-toggle__label">{leftLabel}</span>
      )}
      <div
        aria-checked={value.toString()}
        className={toggleClassName}
        id={id}
        onClick={(activated && onChange) || undefined}
        role="switch"
      >
        <div className="zen-toggle__circle" />
      </div>
      {rightLabel === null ? null : (
        <span className={labelClassName}>{rightLabel}</span>
      )}
    </Group.Horizontal>
  );
}

export default (React.memo(ToggleSwitch): React.AbstractComponent<Props>);
