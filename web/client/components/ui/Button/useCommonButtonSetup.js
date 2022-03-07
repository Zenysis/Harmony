// @flow
import * as React from 'react';

/** Custom hook to build the ARIA name and onClick callback for a Button */
export default function useCommonButtonSetup(
  ariaName: string | void,
  children: React.Node,
  disabled: boolean,
  onClick: (event: SyntheticMouseEvent<HTMLButtonElement>) => void | void,
): [(event: SyntheticMouseEvent<HTMLButtonElement>) => void, string | void] {
  const onButtonClick = React.useCallback(
    (event: SyntheticMouseEvent<HTMLButtonElement>) => {
      if (disabled) {
        return;
      }
      if (onClick) {
        onClick(event);
      }
    },
    [disabled, onClick],
  );

  // if no ARIA Name was specified, use the button contents if it's a string
  const ariaNameToUse = React.useMemo(
    () =>
      ariaName ||
      (typeof children === 'string' || typeof children === 'number'
        ? String(children)
        : undefined),
    [ariaName, children],
  );

  return [onButtonClick, ariaNameToUse];
}
