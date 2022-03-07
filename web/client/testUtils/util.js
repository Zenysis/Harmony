// @flow
import invariant from 'invariant';
import { fireEvent, screen } from '@testing-library/react';

/**
 * This is a thin wrapper for the most common and encouraged way to get a DOM
 * element in a test. It requires a role and a name, where the name can be a
 * string or a RegEx.
 * This function uses the `screen.getByRole` function. If you need to get an
 * element any other way, then just use the `screen.getX` API directly.
 *
 * @param {string} role The ARIA role to look for.
 * @param {string | RegExp} name The accessible name to identify the element.
 * @returns {HTMLElement}
 */
export function getEl(role: string, name?: string | RegExp): HTMLElement {
  return screen.getByRole(role, { name });
}

/**
 * A helper function to type text into an HTMLInputElement.
 * This is a wrapper around `fireEvent.change` which can be a bit unintuitive
 * to use for typing text.
 *
 * @param {HTMLElement} el The element we will type into. It must be an
 * HTMLInputElement, otherwise it will throw an error.
 */
export function typeText(el: HTMLElement, text: string): void {
  invariant(
    el instanceof HTMLInputElement,
    '`typeText` function expects an HTMLInputElement',
  );
  fireEvent.change(el, { target: { value: text } });
}

/**
 * A helper function to trigger a click event on an element. This is a thin
 * wrapper around `firEvent.click`. When passed an HTMLElement, it is the exact
 * same as `fireEvent.click(el)`. But it can also be passed a string role and
 * name in order to do both a `getEl` and `fireEvent.click` at the same time,
 * which is a very common operation.
 *
 * For example, instead of `fireEvent.click(getEl('button', 'my btn'));` you
 * can just do `click('button', 'my btn');` which is more readable.
 *
 * @param {HTMLElement | string} elOrRole Either the HTMLElement to click on, or
 * the ARIA role for this element, in order to find it.
 * @param {string | RegExp} name The accessibility name used to identify this
 * element.
 */
/* ::
declare function click(el: HTMLElement): void;
declare function click(role: string, name?: string | RegExp): void;
*/
export function click(
  elOrRole: HTMLElement | string,
  name?: string | RegExp,
): void {
  let elt;
  if (typeof elOrRole === 'string') {
    const role = elOrRole;
    elt = screen.getByRole(role, { name });
  } else {
    elt = elOrRole;
  }

  fireEvent.click(elt);
}
