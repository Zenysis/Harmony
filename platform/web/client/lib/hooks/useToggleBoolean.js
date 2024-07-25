// @flow
import * as React from 'react';

type ToggleBoolFunc = () => void;

/**
 * This hook allows toggling of a boolean variable.
 * It returns the current boolean value and a function to toggle the boolean
 * from true to false and vice versa.
 *
 * @param {boolean} initialValue The initial value for the boolean
 * @returns {[boolean, ToggleBoolFunc]} The current value and a function to
 * toggle the boolean value.
 */
export default function useToggleBoolean(
  initialValue: boolean,
): [boolean, ToggleBoolFunc] {
  const [isOn, setIsOn] = React.useState(initialValue);
  const toggleBool = React.useCallback(
    () => setIsOn(prevIsOn => !prevIsOn),
    [],
  );
  return [isOn, toggleBool];
}
