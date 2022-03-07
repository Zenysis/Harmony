// @flow

/**
 * For values like 1.005 the desired value is 1.01
 * Number(Math.round(1.005+'e2')+'e-2') gives a more accurate 1.01
 * than toFixed(1.005) and Math.round(1.005) that give 1.00 and 1 respectively
 *
 * Params:
 *   value: number to round off
 *   decimals: number of decimal places to round off to
 * Return: rounded off number
 */

export function round(value: number, decimals: number): number {
  return Number(`${Math.round(Number(`${value}e${decimals}`))}e-${decimals}`);
}
