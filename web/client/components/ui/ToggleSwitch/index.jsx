// @flow
import * as React from 'react';
import classNames from 'classnames';

import Group from 'components/ui/Group';

type Props = {
  /** Gets called when the toggle is clicked */
  onChange: () => void,

  /** The current value of the toggle. It is true if it is set to enabled. */
  value: boolean,

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

  /**
   * Label to display for all states. Only displays when one of 'left' or
   * 'right' is chosen for displayLabels. Overrides display and enabled labels.
   */
  label?: string,

  /** DOM id for this toggle */
  id?: string,
};

const TEXT = t('ui.ToggleSwitch');

/**
 * A simple toggle to enable/disable something or switch between two options.
 * ToggleSwitch is a controlled component so does not track its state
 * internally. This is managed by the value and onChange props.
 */
function ToggleSwitch({
  onChange,
  value,
  className = '',
  disabledLabel = TEXT.disabled,
  enabledLabel = TEXT.enabled,
  displayLabels = 'both',
  label = '',
  highlightEnabledState = true,
  id = undefined,
}: Props) {
  const toggleClassName = classNames('zen-toggle', {
    'zen-toggle--enabled': value,
    'zen-toggle--disabled': !value,
    'zen-toggle--highlight': value && highlightEnabledState,
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
      leftLabel = value ? enabledLabel : disabledLabel;
    }
  } else if (displayLabels === 'right') {
    if (label !== '') {
      rightLabel = label;
    } else {
      rightLabel = value ? enabledLabel : disabledLabel;
    }
  }

  return (
    <Group.Horizontal
      className={`zen-toggle-container ${className}`}
      spacing="xs"
    >
      {leftLabel === null ? null : <span>{leftLabel}</span>}
      <div
        className={toggleClassName}
        id={id}
        onClick={onChange}
        role="switch"
        aria-checked={value.toString()}
      >
        <div className="zen-toggle__circle" />
      </div>
      {rightLabel === null ? null : <span>{rightLabel}</span>}
    </Group.Horizontal>
  );
}

export default (React.memo(ToggleSwitch): React.AbstractComponent<Props>);
