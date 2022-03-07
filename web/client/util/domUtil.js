// @flow
/**
 * Utility functions to interact with the DOM
 */

/**
 * Get the vertical scroll position of the document.
 */
export function getScrollTop(): number {
  if (document.documentElement) {
    return window.pageYOffset || document.documentElement.scrollTop;
  }
  return window.pageYOffset || 0;
}

/**
 * Get the horizontal scroll position of the document.
 */
export function getScrollLeft(): number {
  if (document.documentElement) {
    return window.pageXOffset || document.documentElement.scrollLeft;
  }
  return window.pageXOffset || 0;
}

/**
 * Get the position of an HTML element relative to the document.
 * Code pulled from:
 *   https://stackoverflow.com/questions/5598743/
 *   finding-elements-position-relative-to-the-document
 * @param {HTMLElement} elt The element whose position we want to get
 */
export function getPositionRelativeToDocument(
  elt: HTMLElement,
): { top: number, left: number } {
  const { top, left } = elt.getBoundingClientRect();
  const scrollTop = getScrollTop();
  const scrollLeft = getScrollLeft();

  let htmlBorderTop = 0;
  let htmlBorderLeft = 0;
  if (document.documentElement) {
    htmlBorderTop = document.documentElement.clientTop;
    htmlBorderLeft = document.documentElement.clientLeft;
  } else if (document.body) {
    htmlBorderTop = document.body.clientTop;
    htmlBorderLeft = document.body.clientLeft;
  }

  // clientTop/clientLeft are the widths of the borders (if any) on the
  // root <html> element. If there is a document border, then we need to
  // subtract them.
  return {
    top: Math.round(top + scrollTop - htmlBorderTop),
    left: Math.round(left + scrollLeft - htmlBorderLeft),
  };
}
