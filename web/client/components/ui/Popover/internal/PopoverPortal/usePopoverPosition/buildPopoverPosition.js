// @flow
import flipPopoverOrigins from 'components/ui/Popover/internal/flipPopoverOrigins';
import { getPositionRelativeToDocument, getScrollTop } from 'util/domUtil';
import type {
  OriginPlacement,
  WindowEdgeThresholds,
} from 'components/ui/Popover/internal/types';

type PopoverPosition = {
  popoverLeft: number,
  popoverTop: number,
};

// keep track of which edges the popover overflows
type OverflowInfo = {
  documentTop: boolean,
  windowBottom: boolean,
  windowLeft: boolean,
  windowRight: boolean,
  windowTop: boolean,
};

const TOP_PLACEMENTS: $ReadOnlySet<OriginPlacement> = new Set([
  'top left',
  'top center',
  'top right',
]);
const BOTTOM_PLACEMENTS: $ReadOnlySet<OriginPlacement> = new Set([
  'bottom left',
  'bottom center',
  'bottom right',
]);
const LEFT_PLACEMENTS: $ReadOnlySet<OriginPlacement> = new Set([
  'left center',
  'top left',
  'bottom left',
]);
const RIGHT_PLACEMENTS: $ReadOnlySet<OriginPlacement> = new Set([
  'right center',
  'top right',
  'bottom right',
]);

/**
 * Check if an origin flipped vertically.
 * @param {OriginPlacement} oldOrigin
 * @param {OriginPlacement} newOrigin
 * @returns {boolean} did the origin flip vertically
 */
function _didOriginsFlipVertically(
  oldOrigin: OriginPlacement,
  newOrigin: OriginPlacement,
): boolean {
  return (
    (TOP_PLACEMENTS.has(oldOrigin) && BOTTOM_PLACEMENTS.has(newOrigin)) ||
    (BOTTOM_PLACEMENTS.has(oldOrigin) && TOP_PLACEMENTS.has(newOrigin))
  );
}

/**
 * Check if an origin flipped horizontallyf.
 * @param {OriginPlacement} oldOrigin
 * @param {OriginPlacement} newOrigin
 * @returns {boolean} did the origin flip horizontally
 */
function _didOriginsFlipHorizontally(
  oldOrigin: OriginPlacement,
  newOrigin: OriginPlacement,
): boolean {
  return (
    (LEFT_PLACEMENTS.has(oldOrigin) && RIGHT_PLACEMENTS.has(newOrigin)) ||
    (RIGHT_PLACEMENTS.has(oldOrigin) && LEFT_PLACEMENTS.has(newOrigin))
  );
}

/**
 * Build a {PopoverPosition} from the provided left and top coordinates.
 * @param {number} left
 * @param {number} top
 * @returns {PopoverPosition}
 */
function _buildPopoverPosition(left: number, top: number): PopoverPosition {
  // NOTE(stephen): Sometimes popover positions that are not integers will cause
  // the browser to miscalculate the offsetWidth/offsetHeight of the Popover
  // element. This can lead to an oscillation of one of the values from 0 to 0.5
  // after every popover position change (i.e. popoverLeft -> 172.5 -> 172 ->
  // 172.5 -> 172) and eventually resulting in a crash due to too many setState
  // calls being made. By rounding the value, we can help the browser calculate
  // an accurate value each time and prevent oscillation. See T5374 for an
  // example where this happened before this change was implemented.
  return {
    popoverLeft: Math.floor(left),
    popoverTop: Math.floor(top),
  };
}

/*
 * Get the coordinates of the anchor's position relative to the document.
 * @param {HTMLElement} anchorElt The anchor element
 * @param {OriginPlacement} anchorOrigin The anchor's origin point
 * @returns {object} The x and y coordinates of the anchor
 */
function _getAnchorPosition(
  anchorElt: HTMLElement,
  anchorOrigin: OriginPlacement,
): { anchorX: number, anchorY: number } {
  const { height, width } = anchorElt.getBoundingClientRect();
  let horizontalOffset;
  let verticalOffset;
  switch (anchorOrigin) {
    case 'top center':
      horizontalOffset = width / 2;
      verticalOffset = 0;
      break;
    case 'top left':
      horizontalOffset = 0;
      verticalOffset = 0;
      break;
    case 'top right':
      horizontalOffset = width;
      verticalOffset = 0;
      break;
    case 'bottom center':
      horizontalOffset = width / 2;
      verticalOffset = height;
      break;
    case 'bottom left':
      horizontalOffset = 0;
      verticalOffset = height;
      break;
    case 'bottom right':
      horizontalOffset = width;
      verticalOffset = height;
      break;
    case 'right center':
      horizontalOffset = width;
      verticalOffset = height / 2;
      break;
    case 'left center':
      horizontalOffset = 0;
      verticalOffset = height / 2;
      break;
    case 'center':
      horizontalOffset = width / 2;
      verticalOffset = height / 2;
      break;
    default:
      throw new Error(
        `[Popover] Invalid anchor origin placement ${anchorOrigin}`,
      );
  }

  const { top, left } = getPositionRelativeToDocument(anchorElt);
  return {
    anchorX: left + horizontalOffset,
    anchorY: top + verticalOffset,
  };
}

/**
 * Return which edges of the window the popover overflows
 * @param {HTMLElement} popoverElt The popover element
 * @param {PopoverPosition} position Popover's left and top positions relative
 * to the document
 * @param {WindowEdgeThresholds} windowEdgeThresholds How close we can get to the
 * window's edges before auto-adjusting the popover's position
 * @returns {OverflowInfo} a boolean object of which window edges are overflowed
 */
function _getPopoverOverflows(
  popoverElt: HTMLElement,
  position: PopoverPosition,
  windowEdgeThresholds: WindowEdgeThresholds,
): OverflowInfo {
  const { popoverLeft, popoverTop } = position;
  const popoverRightEdge = popoverLeft + popoverElt.offsetWidth;
  const popoverBottomEdge = popoverTop + popoverElt.offsetHeight;
  const windowBottomEdge =
    window.innerHeight + getScrollTop() - windowEdgeThresholds.bottom;

  return {
    documentTop: popoverTop < windowEdgeThresholds.top,
    windowBottom: popoverBottomEdge > windowBottomEdge,
    windowLeft: popoverLeft < windowEdgeThresholds.left,
    windowRight:
      popoverRightEdge > window.innerWidth - windowEdgeThresholds.right,
    windowTop: popoverTop < getScrollTop() + windowEdgeThresholds.top,
  };
}

/**
 * Change the anchor and popover origins if the popover is overflowing past
 * any window edges. The origins to change, and what they change to, depends
 * on the current origin points and which window edges are being overflowed.
 * This logic is very case dependent to make the aesthetically best choice for
 * every situation.
 * @param {HTMLElement} popoverElt The popover element
 * @param {PopoverPosition} popoverPosition The popover's left and top positions
 * relative to the document
 * @param {OriginPlacement} anchorOrigin The anchor's origin point
 * @param {OriginPlacement} popoverOrigin The popover's origin point
 * @param {EdgeThresholds} windowEdgeThresholds How close we can get to the
 * window's edges before auto-adjusting the popover's position
 * @returns {object} The new anchor and popover origins
 */
function _getAdjustedOrigins(
  popoverElt: HTMLElement,
  popoverPosition: PopoverPosition,
  anchorOrigin: OriginPlacement,
  popoverOrigin: OriginPlacement,
  windowEdgeThresholds: WindowEdgeThresholds,
): { anchorOrigin: OriginPlacement, popoverOrigin: OriginPlacement } {
  const popoverOverflows = _getPopoverOverflows(
    popoverElt,
    popoverPosition,
    windowEdgeThresholds,
  );
  const origins = { anchorOrigin, popoverOrigin };

  switch (popoverOrigin) {
    case 'top center':
      return popoverOverflows.windowBottom
        ? flipPopoverOrigins(origins, 'vertical')
        : origins;
    case 'bottom center':
      return popoverOverflows.windowTop
        ? flipPopoverOrigins(origins, 'vertical')
        : origins;
    case 'top left': {
      const newOrigins = popoverOverflows.windowRight
        ? flipPopoverOrigins(origins, 'horizontal')
        : origins;

      return popoverOverflows.windowBottom
        ? flipPopoverOrigins(newOrigins, 'vertical')
        : newOrigins;
    }
    case 'top right': {
      const newOrigins = popoverOverflows.windowLeft
        ? flipPopoverOrigins(origins, 'horizontal')
        : origins;

      return popoverOverflows.windowBottom
        ? flipPopoverOrigins(newOrigins, 'vertical')
        : newOrigins;
    }
    case 'bottom left': {
      const newOrigins = popoverOverflows.windowRight
        ? flipPopoverOrigins(origins, 'horizontal')
        : origins;

      return popoverOverflows.windowTop
        ? flipPopoverOrigins(newOrigins, 'vertical')
        : newOrigins;
    }
    case 'bottom right': {
      const newOrigins = popoverOverflows.windowLeft
        ? flipPopoverOrigins(origins, 'horizontal')
        : origins;

      return popoverOverflows.windowTop
        ? flipPopoverOrigins(newOrigins, 'vertical')
        : newOrigins;
    }
    case 'left center': {
      return popoverOverflows.windowRight
        ? flipPopoverOrigins(origins, 'horizontal')
        : origins;
    }
    case 'right center': {
      return popoverOverflows.windowLeft
        ? flipPopoverOrigins(origins, 'horizontal')
        : origins;
    }
    case 'center':
      return origins;
    default:
      throw new Error(`Invalid popover origin: '${popoverOrigin}'`);
  }
}

/**
 * Get the adjusted user offsets for the new popover origin. If the new origin
 * has been flipped either horizontally or vertically (or both), then we want
 * to use the user's flippedOffset property, instead of the original offset.
 * @param {object} userOffsets x and y popover offsets specified by the user
 * @param {object} flippedUserOffsets x and y popover offsets specified by
 * the user, only applied if the popover's origin was flipped
 * @param {OriginPlacement} oldPopoverOrigin
 * @param {OriginPlacement} newPopoverOrigin
 * @returns {object} The final user-specified offsets to apply on the popover
 */
function _getAdjustedUserOffsets(
  userOffsets: { offsetX: number, offsetY: number },
  flippedUserOffsets: { flippedOffsetX: number, flippedOffsetY: number },
  oldPopoverOrigin: OriginPlacement,
  newPopoverOrigin: OriginPlacement,
): { offsetX: number, offsetY: number } {
  // nothing changed, return original user offsets
  if (oldPopoverOrigin === newPopoverOrigin) {
    return userOffsets;
  }

  let newOffsetX = userOffsets.offsetX;
  let newOffsetY = userOffsets.offsetY;

  // did things flip horizontally?
  if (_didOriginsFlipHorizontally(oldPopoverOrigin, newPopoverOrigin)) {
    newOffsetX = flippedUserOffsets.flippedOffsetX;
  }

  // did things flip vertically?
  if (_didOriginsFlipVertically(oldPopoverOrigin, newPopoverOrigin)) {
    newOffsetY = flippedUserOffsets.flippedOffsetY;
  }

  return { offsetX: newOffsetX, offsetY: newOffsetY };
}

/**
 * Adjust the popover's position to make sure it fits in the window.
 * @param {HTMLElement} popoverElt The popover element
 * @param {PopoverPosition} position The popover's left and top positions
 * relative to the document
 * @param {WindowEdgeThresholds} windowEdgeThresholds How close we can get to the
 * window's edges before auto-adjusting the popover's position
 * @param {boolean} keepInWindow If true, the popover should be adjusted
 * vertically if it is going off-screen. If false, allow the popover to go
 * off-screen vertically.
 * @returns {PopoverPosition} The new popover position relative to the document
 */
function _getAdjustedPopoverPosition(
  popoverElt: HTMLElement,
  position: PopoverPosition,
  windowEdgeThresholds: WindowEdgeThresholds,
  keepInWindow: boolean,
): PopoverPosition {
  let offsetX = 0;
  let offsetY = 0;
  const { popoverLeft, popoverTop } = position;
  const popoverOverflows = _getPopoverOverflows(
    popoverElt,
    position,
    windowEdgeThresholds,
  );

  // prioritize making sure we don't overflow the window's left edge.
  // (it doesn't matter if this causes the right edge to be overflowed, the
  // user can always scroll to view)
  if (popoverOverflows.windowLeft) {
    offsetX = windowEdgeThresholds.left - popoverLeft;
  } else if (popoverOverflows.windowRight) {
    // if we don't overflow the left edge, then check the right edge so we can
    // hopefully avoid scrolling horizontally
    const windowRightEdge = window.innerWidth - windowEdgeThresholds.right;
    const popoverRightEdge = popoverLeft + popoverElt.offsetWidth;
    offsetX = windowRightEdge - popoverRightEdge;
  }

  // Vertical adjustment: if we specified the Popover should always be kept
  // in the window AND we're not overflowing *both* the top and bottom, then
  // we'll make a vertical adjustment to make sure the Popover is always
  // visible. Otherwise, we'll only care about adjusting such that we don't
  // overflow the document's top edge.
  if (
    keepInWindow &&
    !(popoverOverflows.windowTop && popoverOverflows.windowBottom)
  ) {
    if (popoverOverflows.windowTop) {
      offsetY = windowEdgeThresholds.top - popoverTop;
    } else if (popoverOverflows.windowBottom) {
      const windowBottomEdge =
        window.innerHeight + getScrollTop() - windowEdgeThresholds.bottom;
      const popoverBottomEdge = popoverTop + popoverElt.offsetHeight;
      offsetY = windowBottomEdge - popoverBottomEdge;
    }
  } else if (popoverOverflows.documentTop) {
    // Vertical adjustment: we only care about not overflowing the *document's*
    // top edge (because it cannot be scrolled into view). It is okay if we
    // overflow the window top (as long as we don't overflow the document top),
    // or if this adjustment causes the window bottom to overflow, because the
    // user can scroll things into view. Scrolling vertically isn't a big deal,
    // unlike horizontal scrolls, which is why we had to try harder to avoid
    // horizontally scrolling.
    offsetY = windowEdgeThresholds.top - popoverTop;
  }

  // set a minimum offset equal to the windowEdgeThreshold so that we do not
  // overflow the document top or left as a result of our other adjustments
  return _buildPopoverPosition(
    Math.max(popoverLeft + offsetX, windowEdgeThresholds.left),
    Math.max(popoverTop + offsetY, windowEdgeThresholds.top),
  );
}

/**
 * Get the amount of outer spacing to add between the anchor and the popover,
 * just for aesthetic reasons, so that their borders are not touching. This
 * depends on a combination of the anchor and popover position. (Imagine an
 * outer padding around the border of the anchor element - that's what we're
 * calculating here)
 * @param {OriginPlacement} anchorOrigin The anchor's origin point
 * @param {OriginPlacement} popoverOrigin The popover's origin point
 * @param {number} anchorOuterSpacing The anchor's outer spacing
 * @returns {object} The x and y outer padding around the anchor origin
 */
function _getAnchorOuterSpacing(
  anchorOrigin: OriginPlacement,
  popoverOrigin: OriginPlacement,
  anchorOuterSpacing: number,
): { paddingX: number, paddingY: number } {
  let paddingX = 0;
  let paddingY = 0;
  // add vertical outer spacing between the anchor and popover
  if (
    TOP_PLACEMENTS.has(anchorOrigin) &&
    BOTTOM_PLACEMENTS.has(popoverOrigin)
  ) {
    paddingY = -anchorOuterSpacing;
  } else if (
    BOTTOM_PLACEMENTS.has(anchorOrigin) &&
    TOP_PLACEMENTS.has(popoverOrigin)
  ) {
    paddingY = anchorOuterSpacing;
  }

  // add horizontal outer spacing between the anchor and popover
  if (
    LEFT_PLACEMENTS.has(anchorOrigin) &&
    RIGHT_PLACEMENTS.has(popoverOrigin)
  ) {
    paddingX = -anchorOuterSpacing;
  } else if (
    RIGHT_PLACEMENTS.has(anchorOrigin) &&
    LEFT_PLACEMENTS.has(popoverOrigin)
  ) {
    paddingX = anchorOuterSpacing;
  }
  return { paddingX, paddingY };
}

/**
 * Calculate offsets to place the popover correctly around the anchor's origin.
 * @param {HTMLElement} popoverElt The popover element
 * @param {OriginPlacement} anchorOrigin The anchor's origin point
 * @param {OriginPlacement} popoverOrigin The popover's origin point
 * @param {number} anchorOuterSpacing The anchor's outer spacing
 * @returns {object} The popover's x and y offsets
 */
function _getPopoverOffsets(
  popoverElt: HTMLElement,
  anchorOrigin: OriginPlacement,
  popoverOrigin: OriginPlacement,
  anchorOuterSpacing: number,
): { offsetX: number, offsetY: number } {
  let horizontalOffset;
  let verticalOffset;
  switch (popoverOrigin) {
    case 'top center':
      horizontalOffset = -popoverElt.offsetWidth / 2;
      verticalOffset = 0;
      break;
    case 'top left':
      horizontalOffset = 0;
      verticalOffset = 0;
      break;
    case 'top right':
      horizontalOffset = -popoverElt.offsetWidth;
      verticalOffset = 0;
      break;
    case 'bottom center':
      horizontalOffset = -popoverElt.offsetWidth / 2;
      verticalOffset = -popoverElt.offsetHeight;
      break;
    case 'bottom left':
      horizontalOffset = 0;
      verticalOffset = -popoverElt.offsetHeight;
      break;
    case 'bottom right':
      horizontalOffset = -popoverElt.offsetWidth;
      verticalOffset = -popoverElt.offsetHeight;
      break;
    case 'right center':
      horizontalOffset = -popoverElt.offsetWidth;
      verticalOffset = -popoverElt.offsetHeight / 2;
      break;
    case 'left center':
      horizontalOffset = 0;
      verticalOffset = -popoverElt.offsetHeight / 2;
      break;
    case 'center':
      horizontalOffset = -popoverElt.offsetWidth / 2;
      verticalOffset = -popoverElt.offsetHeight / 2;
      break;
    default:
      throw new Error(
        `[Popover] Invalid popover origin placement ${popoverOrigin}`,
      );
  }

  const { paddingX, paddingY } = _getAnchorOuterSpacing(
    anchorOrigin,
    popoverOrigin,
    anchorOuterSpacing,
  );

  return {
    offsetX: horizontalOffset + paddingX,
    offsetY: verticalOffset + paddingY,
  };
}

/**
 * Get the unadjusted position of the popover relative to the document.
 * Unadjusted means that it has not been adjusted to ensure it fits in the
 * window.
 * @param {object} anchorPosition The x and y position of the anchor relative
 * to the document
 * @param {HTMLElement} popoverElt The popover element
 * @param {OriginPlacement} anchorOrigin The anchor's origin point
 * @param {OriginPlacement} popoverOrigin The popover's origin point
 * @param {number} anchorOuterSpacing The anchor's outer spacing
 * @param {object} userOffsets Additional x and y offsets specified by the user
 * @returns {PopoverPosition} The popover's left and top positions relative to
 * the document
 */
function _getBasePopoverPosition(
  anchorPosition: { anchorX: number, anchorY: number },
  popoverElt: HTMLElement,
  anchorOrigin: OriginPlacement,
  popoverOrigin: OriginPlacement,
  anchorOuterSpacing: number,
  userOffsets: { offsetX: number, offsetY: number },
): PopoverPosition {
  const { anchorX, anchorY } = anchorPosition;
  const { offsetX, offsetY } = _getPopoverOffsets(
    popoverElt,
    anchorOrigin,
    popoverOrigin,
    anchorOuterSpacing,
  );

  return _buildPopoverPosition(
    anchorX + offsetX + userOffsets.offsetX,
    anchorY + offsetY + userOffsets.offsetY,
  );
}

/**
 * Get the exact coordinates of the popover position. This takes into account
 * a variety of different factors to correctly calculate any positions and
 * offsets, and then adjusts the position to make sure it fits nicely inside the
 * document. The final position is relative to the `popoverContainerElt`, or
 * if none is given then it's relative to the document.
 *
 * @param {HTMLElement} anchorElt The anchor element
 * @param {HTMLElement} popoverElt The popover element
 * @param {OriginPlacement} anchorOrigin The anchor's origin point
 * @param {OriginPlacement} popoverOrigin The popover's origin point
 * @param {number} anchorOuterSpacing The anchor's outer spacing
 * @param {object} userOffsets Additional x and y offsets specified by the user
 * @param {object} flippedUserOffsets Additional x and y offsets specified by
 * the user, only to be applied when the popover's origin is flipped so it can
 * fit in the window
 * @param {WindowEdgeThresholds} windowEdgeThresholds How close we can get to the
 * window's edges before auto-adjusting the popover's position
 * @param {HTMLElement | void} popoverContainerElt The element inside which the
 * popover should be rendered. The final position should be relative to this.
 * If no element is given, then the final position is relative to the document.
 * @param {boolean} keepInWindow Whether or not the popover should be kept
 * in-screen no matter what. If true, never let the popover go off-screen either
 * vertically or horizontally.
 * @param {boolean} doNotFlip Disable the popover's flipping mechanic that
 * attempts to keep it in view for longer.
 *
 * @returns {PopoverPosition} The popover's left and top positions
 */
// TODO(pablo): this calculation involves repeated calls to
// getBoundingClientRect() via our getPositionRelativeToDocument function. This
// is an expensive computation. Figure out how to cache results.
export default function buildPopoverPosition(
  anchorElt: HTMLElement,
  popoverElt: HTMLElement,
  anchorOrigin: OriginPlacement,
  popoverOrigin: OriginPlacement,
  anchorOuterSpacing: number,
  userOffsets: { offsetX: number, offsetY: number },
  flippedUserOffsets: { flippedOffsetX: number, flippedOffsetY: number },
  windowEdgeThresholds: WindowEdgeThresholds,
  popoverContainerElt: HTMLElement | void,
  keepInWindow: boolean,
  doNotFlip: boolean,
): PopoverPosition {
  let anchorPosition = _getAnchorPosition(anchorElt, anchorOrigin);
  let popoverPosition = _getBasePopoverPosition(
    anchorPosition,
    popoverElt,
    anchorOrigin,
    popoverOrigin,
    anchorOuterSpacing,
    userOffsets,
  );

  // the initially calculated popover position might overflow the window's
  // edges, so we will adjust the origin positions to make the popover fit
  // in the window
  let newOrigins = doNotFlip
    ? { anchorOrigin, popoverOrigin }
    : _getAdjustedOrigins(
        popoverElt,
        popoverPosition,
        anchorOrigin,
        popoverOrigin,
        windowEdgeThresholds,
      );

  // if the anchor origin changed, recompute the new anchor position
  if (newOrigins.anchorOrigin !== anchorOrigin) {
    anchorPosition = _getAnchorPosition(anchorElt, newOrigins.anchorOrigin);
  }

  // if the popover origin changed then recompute the popover position
  if (newOrigins.popoverOrigin !== popoverOrigin) {
    let adjustedUserOffsets = _getAdjustedUserOffsets(
      userOffsets,
      flippedUserOffsets,
      popoverOrigin,
      newOrigins.popoverOrigin,
    );

    popoverPosition = _getBasePopoverPosition(
      anchorPosition,
      popoverElt,
      newOrigins.anchorOrigin,
      newOrigins.popoverOrigin,
      anchorOuterSpacing,
      adjustedUserOffsets,
    );

    if (_didOriginsFlipVertically(popoverOrigin, newOrigins.popoverOrigin)) {
      const popoverOverflows = _getPopoverOverflows(
        popoverElt,
        popoverPosition,
        windowEdgeThresholds,
      );

      // check if we are *still* overflowing the vertical edges. If so, then
      // flip things back (only vertically), and recalculate base position.
      // We make exceptions for the cases where we are overflowing a window edge
      // that is closest to our popover's origin (because flipping it back would
      // only make things *worse*).
      if (
        (popoverOverflows.windowTop &&
          !TOP_PLACEMENTS.has(newOrigins.popoverOrigin)) ||
        (popoverOverflows.windowBottom &&
          !BOTTOM_PLACEMENTS.has(newOrigins.popoverOrigin))
      ) {
        newOrigins = flipPopoverOrigins(
          newOrigins,
          'vertical',
          _didOriginsFlipVertically(anchorOrigin, newOrigins.anchorOrigin),
        );

        // if the anchor origin changed again, recompute the new anchor position
        // TODO(pablo): there is a lot of duplicate logic here. Figure out how
        // to make code more reusable without sacrificing performance.
        if (newOrigins.anchorOrigin !== anchorOrigin) {
          anchorPosition = _getAnchorPosition(
            anchorElt,
            newOrigins.anchorOrigin,
          );
        }

        adjustedUserOffsets = _getAdjustedUserOffsets(
          userOffsets,
          flippedUserOffsets,
          popoverOrigin,
          newOrigins.popoverOrigin,
        );

        popoverPosition = _getBasePopoverPosition(
          anchorPosition,
          popoverElt,
          newOrigins.anchorOrigin,
          newOrigins.popoverOrigin,
          anchorOuterSpacing,
          adjustedUserOffsets,
        );
      }
    }
  }

  // NOTE(pablo): our final calculated position might *still* not fit in the
  // window, so we might have to do some final adjustments to make it fit.
  const positionInDocument = _getAdjustedPopoverPosition(
    popoverElt,
    popoverPosition,
    windowEdgeThresholds,
    keepInWindow,
  );

  // we finally have the popover's position relative to the document. Now we
  // need to adjust this to fit in the container the popover will render in
  if (popoverContainerElt === undefined) {
    // no adjustments necessary if no popoverContainerElt is specified
    return positionInDocument;
  }

  // the parent's top-left should be treated as 0,0 so we should adjust
  const parentPosition = getPositionRelativeToDocument(popoverContainerElt);
  return _buildPopoverPosition(
    positionInDocument.popoverLeft - parentPosition.left,
    positionInDocument.popoverTop - parentPosition.top,
  );
}
