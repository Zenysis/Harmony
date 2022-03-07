// @flow
import invariant from 'invariant';

import type { DragItemStyle } from 'components/ui/DraggableItemList';

// Simple method for safely pulling the offsetHeight and offsetTop from a
// possibly null element.
function _extractBounds(
  elt: ?(Element | HTMLElement),
): { top: number, height: number } {
  if (elt instanceof HTMLElement) {
    return {
      height: elt.offsetHeight,
      top: elt.offsetTop,
    };
  }

  invariant(
    !elt,
    'Attempting to extract bounds from a non-null non-HTMLElement',
  );
  return { height: 0, top: 0 };
}

function computePreviousNeighborHeight(elt: ?(Element | HTMLElement)): number {
  if (!elt) {
    return 0;
  }
  return _extractBounds(elt.previousElementSibling).height;
}

function computeNextNeighborHeight(elt: ?(Element | HTMLElement)): number {
  if (!elt) {
    return 0;
  }
  return _extractBounds(elt.nextElementSibling).height;
}

// The placeholder element takes the relative position of the drag element as it
// moves up and down the item list. It useful both for calculation of new
// positioning and as a visual cue to the user of where the drag is moving to.
function getPlaceholderElt(dragElt: HTMLElement): HTMLElement {
  // The placeholder always occurs before the element being dragged.
  const placeholderElt = dragElt.previousElementSibling;
  invariant(
    !!placeholderElt && placeholderElt instanceof HTMLElement,
    'Placeholder element should always be defined and be an HTMLElement.',
  );
  return placeholderElt;
}

// Calculate the new top position for the dragging element's placeholder based
// on the direction being dragged.
function _calculateNextTop(dragElt: HTMLElement, usePrevious: boolean): number {
  const placeholderElt = getPlaceholderElt(dragElt);
  if (usePrevious) {
    return _extractBounds(placeholderElt.previousElementSibling).top;
  }

  // NOTE(stephen): nextBounds defaults to 0 if the next element is null. This
  // is fine and makes this calculation easier.
  const nextBounds = _extractBounds(dragElt.nextElementSibling);
  const placeholderBounds = _extractBounds(placeholderElt);
  return placeholderBounds.top + nextBounds.height;
}

// Calculate the absolute Y coordinates that are safe for the current drag item
// to be moved within without causing a reordering. If the drag item extends
// past these bounds, a reordering of the items in the list should be handled.
// The bounds are calculated by finding the midpoint between the combined height
// of the drag element and its immediate siblings. By finding the midpoint, we
// avoid flickering that can happen at the boundary as a smaller item is swapped
// with a larger item.
export function computeDragThreshold(
  top: number,
  height: number,
  previousNeighborHeight: number,
  nextNeighborHeight: number,
): [number, number] {
  // If the previous neighbor height is 0, we are at the top of the list and
  // cannot swap with an earlier element.
  const lowerThreshold =
    previousNeighborHeight > 0
      ? Math.ceil((height + previousNeighborHeight) / 4)
      : 0;

  // The upper threshold offset cannot be more than the height of the next
  // neighbor, because in the case that the next neighbor is the last element
  // and has a height less than the threshold offset, the current element is
  // not able to shift downwards enough to get outside of the upper threshold.
  // Eg. If the current element is height 10, and the next is height 2, then
  // the upper threshold is (10+2)/4 = 3, and the upper bound is 10 + 3 = 13.
  // However, we know that the max Y position possible for the element will be
  // 12 (since the elements combined are height 12), so we can never satisfy
  // the condition (that the element move to position 13). Since we
  // check for strictly greater than, we then subtract 1 from this value so
  // that the max y position will satisfy the condition that it is greater
  // than the upper bound.
  const offset = Math.min(
    Math.ceil((height + nextNeighborHeight) / 4),
    nextNeighborHeight - 1,
  );

  // If the next neighbor height is 0, we are at the bottom of the list and
  // cannot swap with a later element.
  const upperThreshold = nextNeighborHeight > 0 ? offset : top;
  // Need to find the midpoint between the combined height of the two elements
  // (cur + prev) and (cur + next). By finding the midpoint, we avoid flickering
  // that can happen at the boundary.
  // TODO(sophie): There is still flickering in the case that a much larger
  // element is being moved below a small element (which is the case the above
  // comment and offset calculation address). This case should be rare, but if
  // it ends up being an issue, re-evaluate and decide whether we need to
  // change the calculation.
  const lowerBound = top - previousNeighborHeight + lowerThreshold;
  const upperBound = top + upperThreshold;
  return [lowerBound, upperBound];
}

// Calculate the new bounds for the upcoming placement of the drag element based
// on a drag event that moves the item either up (usePrevious = true) or down
// (usePrevious = false).
export function computeNextDragThreshold(
  dragElt: HTMLElement,
  usePrevious: boolean,
): [number, number] {
  let nextNeighborHeight;
  let previousNeighborHeight;
  if (usePrevious) {
    // If the drag motion causes the drag element to move earlier in the list,
    // then the previous sibling of the placeholder element will be the new
    // next sibling after repositioning.
    // Example:
    //   [A, B, Placeholder, DragElt (absolutely positioned), C, D]
    //   ->
    //   [A, Placeholder, DragElt, B, C, D]
    const placeholderElt = getPlaceholderElt(dragElt);
    nextNeighborHeight = computePreviousNeighborHeight(placeholderElt);
    previousNeighborHeight = computePreviousNeighborHeight(
      placeholderElt.previousElementSibling,
    );
  } else {
    // If we are moving later in the list, the next sibling element of the
    // drag element will become the previous.
    // Example:
    //   [A, B, Placeholder, DragElt (absolutely positioned), C, D]
    //   ->
    //   [A, B, C, Placeholder, DragElt, D]
    previousNeighborHeight = computeNextNeighborHeight(dragElt);
    nextNeighborHeight = computeNextNeighborHeight(dragElt.nextElementSibling);
  }
  const newTop = _calculateNextTop(dragElt, usePrevious);
  return computeDragThreshold(
    newTop,
    dragElt.offsetHeight,
    previousNeighborHeight,
    nextNeighborHeight,
  );
}

// Calculate the initial drag bounds based on the current position of the
// element about to be dragged. The placeholder element has not yet been added
// to the DOM, so we use the drag element directly.
export function computeInitialDragThreshold(
  dragItemStyle: DragItemStyle,
  dragElt: HTMLElement,
): [number, number] {
  return computeDragThreshold(
    dragItemStyle.top,
    dragItemStyle.height,
    computePreviousNeighborHeight(dragElt),
    computeNextNeighborHeight(dragElt),
  );
}

export function computeDragItemStyle(dragElement: HTMLElement): DragItemStyle {
  const {
    offsetHeight: height,
    offsetWidth: width,
    offsetLeft: left,
    offsetTop: top,
  } = dragElement;
  return {
    height,
    width,
    left,
    top,
    position: 'absolute',
  };
}
