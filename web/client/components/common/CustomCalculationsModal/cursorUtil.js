// @flow
import FormulaCursor from 'models/QueryResult/QueryResultActionButtons/CustomCalculationsModal/FormulaCursor';

/**
 * Given a DOM node, recursively get all children that are of type
 * Node.TEXT_NODE
 * @param {Node} el - a DOM Node
 * @returns {Array<Node>} An array of DOM Nodes
 */
function _getAllTextChildren(el: ?Node): Array<Node> {
  if (!el || !el.childNodes || el.childNodes.length === 0) {
    return [];
  }

  const result = [];
  const children = el.childNodes;

  // eslint-disable-next-line no-restricted-syntax
  for (const child of children) {
    if (child.nodeType === window.Node.TEXT_NODE) {
      result.push(child);
    } else {
      _getAllTextChildren(child).forEach(c => result.push(c));
    }
  }
  return result;
}

/**
 * Given a div (that represents a line), and a character offset, this function
 * sets up a DOM Range object to set the start|end cursor position at the
 * right place.
 * This function has side effects: the `range` object that is passed will be
 * mutated.
 */
function _setCursorPosition(
  line: HTMLElement,
  offset: number,
  range: Range,
  startOrEnd: 'start' | 'end',
): void {
  const textNodes = _getAllTextChildren(line);

  if (textNodes.length === 0) {
    return startOrEnd === 'start'
      ? range.setStart(line, 0)
      : range.setEnd(line, 0);
  }

  let oldLength = 0;
  let length = 0;

  // Using for..of instead of .forEach() so we can save time and break out
  // of the loop early.
  // Iterate over the text nodes in this line until we find the one that
  // contains our cursor position
  // eslint-disable-next-line no-restricted-syntax
  for (const node of textNodes) {
    const textLength = node.textContent.length;
    oldLength = length;
    length += textLength;
    if (offset <= length) {
      const charIdxToSet = offset - oldLength;
      return startOrEnd === 'start'
        ? range.setStart(node, charIdxToSet)
        : range.setEnd(node, charIdxToSet);
    }
  }
  return undefined;
}

/**
 * Modifies the DOM and sets the cursor position for the given element.
 * @param {Node} el - an HTML Element where the cursor will be set. Each
 * line must be a separate div.
 * @param {FormulaCursor} cursor - holds the cursor positions we want to set
 */
export function setCursorInDOM(
  el: HTMLDivElement,
  cursor: FormulaCursor,
): void {
  const range = document.createRange();
  const lines = Array.from(el.children).filter(
    child => child instanceof HTMLDivElement,
  );
  const [startPos, endPos] = [cursor.start(), cursor.end()];

  _setCursorPosition(
    lines[startPos.lineNumber()],
    startPos.offset(),
    range,
    'start',
  );
  _setCursorPosition(lines[endPos.lineNumber()], endPos.offset(), range, 'end');

  // Now that we've set up the Range object, we can set it in the DOM
  const selection = window.getSelection();
  el.focus();
  selection.removeAllRanges();
  selection.addRange(range);
}
