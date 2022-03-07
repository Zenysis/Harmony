// @flow
import * as React from 'react';

import normalizeARIAName from 'components/ui/util/normalizeARIAName';

type Props = {
  children: React.Node,
  onClick: (event: SyntheticEvent<HTMLButtonElement>) => void,

  /**
   * The accessibility name for this button. If none is specified, we will
   * use the button contents if it is a string.
   */
  ariaName?: string,
  className?: string,
  disabled?: boolean,
};

/**
 * This is a button that spans 100% the width of its container.
 *
 * TODO(pablo): make this into a core UI component. it is already being used
 * in other places. E.g. in CustomizableTag/CustomizationModuleWrapper.jsx
 */
export default function FullButton({
  children,
  onClick,
  ariaName = undefined,
  className = '',
  disabled = false,
}: Props): React.Element<'button'> {
  // if no ARIA Name was specified, use the button contents if it's a string
  const ariaNameToUse =
    ariaName ||
    (typeof children === 'string' || typeof children === 'number'
      ? String(children)
      : undefined);

  return (
    <button
      type="button"
      aria-label={normalizeARIAName(ariaNameToUse)}
      className={`zen-date-picker-apply-btn ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
