// @flow
import * as React from 'react';

type SetTrueFunc = () => void;
type SetFalseFunc = () => void;
type ToggleFunc = () => void;

/**
 * This hook allows simple management of a boolean variable.
 * It returns the current boolean value, a function to set true, a
 * function to set false and a function to toggle the value.
 *
 * This is very common usage for modals or other things that need to be
 * shown/hidden.
 * @param {boolean} initialValue The initial value for the boolean
 * @returns {[boolean, SetTrueFunc, SetFalseFunc, ToggleFunc]} The current
 * value, a function to set the value to true, a function to set the value to
 * false and a function to toggle the value..
 */
export default function useBoolean(
  initialValue: boolean,
): [boolean, SetTrueFunc, SetFalseFunc, ToggleFunc] {
  const [isOn, setIsOn] = React.useState(initialValue);
  const setTrue = React.useCallback(() => setIsOn(true), []);
  const setFalse = React.useCallback(() => setIsOn(false), []);
  const toggle = React.useCallback(() => setIsOn(prevIsOn => !prevIsOn), []);
  return [isOn, setTrue, setFalse, toggle];
}
