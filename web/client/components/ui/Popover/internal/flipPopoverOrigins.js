// @flow
import type { OriginPlacement } from 'components/ui/Popover/internal/types';

/**
 * This file maps all the ways that the popover can be flipped, either
 * horizontally or vertically. This is commonly used when we determine that
 * the popover will go off screen, so we flip its position to keep it visible
 * for longer. Sometimes, flipping the popover also involves flipping the
 * anchor's position too. This is entirely a case-by-case thing, based on
 * what arrangement is aesthetically more pleasing.
 *
 * NOTE(pablo): attempts were made to do this purely algorithmically, but
 * there were SO many edge cases that the code was just way too ugly and
 * buggy. It was easier to just list out all the cases and decide what is
 * the best way to flip the popover/anchor in each situation.
 */

type OriginMap = {
  'top center': 'top center',
  'top left': 'top left',
  'top right': 'top right',
  'bottom center': 'bottom center',
  'bottom left': 'bottom left',
  'bottom right': 'bottom right',
  'right center': 'right center',
  'left center': 'left center',
  center: 'center',
};

type FlippedOriginMap = $ObjMap<
  OriginMap,
  () => $ObjMap<
    OriginMap,
    () => { anchor: OriginPlacement, popover: OriginPlacement } | void,
  >,
>;

const VERTICAL_FLIPS: FlippedOriginMap = {
  'top center': {
    'top center': { anchor: 'top center', popover: 'bottom center' },
    'top left': { anchor: 'top center', popover: 'bottom left' },
    'top right': { anchor: 'top center', popover: 'bottom right' },
    'bottom center': { anchor: 'bottom center', popover: 'top center' },
    'bottom left': { anchor: 'bottom center', popover: 'top left' },
    'bottom right': { anchor: 'bottom center', popover: 'top right' },
    'right center': undefined,
    'left center': undefined,
    center: undefined,
  },
  'top left': {
    'top center': { anchor: 'top left', popover: 'bottom center' },
    'top left': { anchor: 'top left', popover: 'bottom left' },
    'top right': { anchor: 'bottom left', popover: 'bottom right' },
    'bottom center': { anchor: 'bottom left', popover: 'top center' },
    'bottom left': { anchor: 'bottom left', popover: 'top left' },
    'bottom right': { anchor: 'top left', popover: 'top right' },
    'right center': undefined,
    'left center': undefined,
    center: undefined,
  },
  'top right': {
    'top center': { anchor: 'top right', popover: 'bottom center' },
    'top left': { anchor: 'bottom right', popover: 'bottom left' },
    'top right': { anchor: 'top right', popover: 'bottom right' },
    'bottom center': { anchor: 'bottom right', popover: 'top center' },
    'bottom left': { anchor: 'top right', popover: 'top left' },
    'bottom right': { anchor: 'bottom right', popover: 'top right' },
    'right center': undefined,
    'left center': undefined,
    center: undefined,
  },
  'bottom center': {
    'top center': { anchor: 'top center', popover: 'bottom center' },
    'top left': { anchor: 'top center', popover: 'bottom left' },
    'top right': { anchor: 'top center', popover: 'bottom right' },
    'bottom center': { anchor: 'bottom center', popover: 'top center' },
    'bottom left': { anchor: 'bottom center', popover: 'top left' },
    'bottom right': { anchor: 'bottom center', popover: 'top right' },
    'right center': undefined,
    'left center': undefined,
    center: undefined,
  },
  'bottom left': {
    'top center': { anchor: 'top left', popover: 'bottom center' },
    'top left': { anchor: 'top left', popover: 'bottom left' },
    'top right': { anchor: 'bottom left', popover: 'bottom right' },
    'bottom center': { anchor: 'bottom left', popover: 'top center' },
    'bottom left': { anchor: 'bottom left', popover: 'top left' },
    'bottom right': { anchor: 'top left', popover: 'top right' },
    'right center': undefined,
    'left center': undefined,
    center: undefined,
  },
  'bottom right': {
    'top center': { anchor: 'top right', popover: 'bottom center' },
    'top left': { anchor: 'bottom right', popover: 'bottom left' },
    'top right': { anchor: 'top right', popover: 'bottom right' },
    'bottom center': { anchor: 'bottom right', popover: 'top center' },
    'bottom left': { anchor: 'top right', popover: 'top left' },
    'bottom right': { anchor: 'bottom right', popover: 'top right' },
    'right center': undefined,
    'left center': undefined,
    center: undefined,
  },
  'right center': {
    'top center': { anchor: 'right center', popover: 'bottom center' },
    'top left': { anchor: 'right center', popover: 'bottom left' },
    'top right': { anchor: 'right center', popover: 'bottom right' },
    'bottom center': { anchor: 'right center', popover: 'top center' },
    'bottom left': { anchor: 'right center', popover: 'top left' },
    'bottom right': { anchor: 'right center', popover: 'top right' },
    'right center': undefined,
    'left center': undefined,
    center: undefined,
  },
  'left center': {
    'top center': { anchor: 'left center', popover: 'bottom center' },
    'top left': { anchor: 'left center', popover: 'bottom left' },
    'top right': { anchor: 'left center', popover: 'bottom right' },
    'bottom center': { anchor: 'left center', popover: 'top center' },
    'bottom left': { anchor: 'left center', popover: 'top left' },
    'bottom right': { anchor: 'left center', popover: 'top right' },
    'right center': undefined,
    'left center': undefined,
    center: undefined,
  },
  center: {
    'top center': { anchor: 'center', popover: 'bottom center' },
    'top left': { anchor: 'center', popover: 'bottom left' },
    'top right': { anchor: 'center', popover: 'bottom right' },
    'bottom center': { anchor: 'center', popover: 'top center' },
    'bottom left': { anchor: 'center', popover: 'top left' },
    'bottom right': { anchor: 'center', popover: 'top right' },
    'right center': undefined,
    'left center': undefined,
    center: undefined,
  },
};

const HORIZONTAL_FLIPS: FlippedOriginMap = {
  'top center': {
    'top center': undefined,
    'top left': { anchor: 'top center', popover: 'top right' },
    'top right': { anchor: 'top center', popover: 'top left' },
    'bottom center': undefined,
    'bottom left': { anchor: 'top center', popover: 'bottom left' },
    'bottom right': { anchor: 'top center', popover: 'bottom right' },
    'right center': { anchor: 'top center', popover: 'left center' },
    'left center': { anchor: 'top center', popover: 'right center' },
    center: undefined,
  },
  'top left': {
    'top center': undefined,
    'top left': { anchor: 'top left', popover: 'top right' },
    'top right': { anchor: 'top right', popover: 'top left' },
    'bottom center': undefined,
    'bottom left': { anchor: 'top right', popover: 'bottom right' },
    'bottom right': { anchor: 'top left', popover: 'bottom left' },
    'right center': { anchor: 'top right', popover: 'left center' },
    'left center': { anchor: 'top left', popover: 'right center' },
    center: undefined,
  },
  'top right': {
    'top center': undefined,
    'top left': { anchor: 'top left', popover: 'top right' },
    'top right': { anchor: 'top right', popover: 'top left' },
    'bottom center': undefined,
    'bottom left': { anchor: 'top right', popover: 'bottom right' },
    'bottom right': { anchor: 'top left', popover: 'bottom left' },
    'right center': { anchor: 'top right', popover: 'left center' },
    'left center': { anchor: 'top left', popover: 'right center' },
    center: undefined,
  },
  'bottom center': {
    'top center': undefined,
    'top left': { anchor: 'bottom center', popover: 'top right' },
    'top right': { anchor: 'bottom center', popover: 'top left' },
    'bottom center': undefined,
    'bottom left': { anchor: 'bottom center', popover: 'bottom right' },
    'bottom right': { anchor: 'bottom center', popover: 'bottom left' },
    'right center': { anchor: 'bottom center', popover: 'left center' },
    'left center': { anchor: 'bottom center', popover: 'right center' },
    center: undefined,
  },
  'bottom left': {
    'top center': undefined,
    'top left': { anchor: 'bottom right', popover: 'top right' },
    'top right': { anchor: 'bottom left', popover: 'top left' },
    'bottom center': undefined,
    'bottom left': { anchor: 'bottom left', popover: 'bottom right' },
    'bottom right': { anchor: 'bottom right', popover: 'bottom left' },
    'right center': { anchor: 'bottom right', popover: 'left center' },
    'left center': { anchor: 'bottom left', popover: 'right center' },
    center: undefined,
  },
  'bottom right': {
    'top center': undefined,
    'top left': { anchor: 'bottom right', popover: 'top right' },
    'top right': { anchor: 'bottom left', popover: 'top left' },
    'bottom center': undefined,
    'bottom left': { anchor: 'bottom left', popover: 'bottom right' },
    'bottom right': { anchor: 'bottom right', popover: 'bottom left' },
    'right center': { anchor: 'bottom right', popover: 'left center' },
    'left center': { anchor: 'bottom left', popover: 'right center' },
    center: undefined,
  },
  'right center': {
    'top center': undefined,
    'top left': { anchor: 'left center', popover: 'top right' },
    'top right': { anchor: 'right center', popover: 'top left' },
    'bottom center': undefined,
    'bottom left': { anchor: 'left center', popover: 'bottom right' },
    'bottom right': { anchor: 'right center', popover: 'bottom left' },
    'right center': { anchor: 'right center', popover: 'left center' },
    'left center': { anchor: 'left center', popover: 'right center' },
    center: undefined,
  },
  'left center': {
    'top center': undefined,
    'top left': { anchor: 'left center', popover: 'top right' },
    'top right': { anchor: 'right center', popover: 'top left' },
    'bottom center': undefined,
    'bottom left': { anchor: 'left center', popover: 'bottom right' },
    'bottom right': { anchor: 'right center', popover: 'bottom left' },
    'right center': { anchor: 'right center', popover: 'left center' },
    'left center': { anchor: 'left center', popover: 'right center' },
    center: undefined,
  },
  center: {
    'top center': undefined,
    'top left': { anchor: 'center', popover: 'top right' },
    'top right': { anchor: 'center', popover: 'top left' },
    'bottom center': undefined,
    'bottom left': { anchor: 'center', popover: 'bottom right' },
    'bottom right': { anchor: 'center', popover: 'bottom left' },
    'right center': { anchor: 'center', popover: 'left center' },
    'left center': { anchor: 'center', popover: 'right center' },
    center: undefined,
  },
};

/**
 * Flip the anchor and popover origins in the direction given. This is used
 * for when opening a popover will cause it to go offscreen, sometimes flipping
 * it looks aesthetically better by making sure all contents can be seen.
 * For other use cases, you might want to make sure only the popover origin
 * gets flipped (and the anchor remains static), so that is also an argument
 * you can pass in.
 * @param {object} origins The anchor and popover origins
 * @param {'horizontal' | 'vertical'} direction What direction to flip
 * @param {boolean} canAnchorBeFlipped If the anchor can be flipped
 * @returns {object} the new anchorOrigin and popoverOrigin
 */
export default function flipPopoverOrigins(
  origins: {
    anchorOrigin: OriginPlacement,
    popoverOrigin: OriginPlacement,
  },
  direction: 'horizontal' | 'vertical',
  canAnchorBeFlipped?: boolean = true,
): { anchorOrigin: OriginPlacement, popoverOrigin: OriginPlacement } {
  const { anchorOrigin, popoverOrigin } = origins;
  const flippedOrigins =
    direction === 'horizontal'
      ? HORIZONTAL_FLIPS[anchorOrigin][popoverOrigin]
      : VERTICAL_FLIPS[anchorOrigin][popoverOrigin];
  if (flippedOrigins) {
    const { anchor, popover } = flippedOrigins;
    return {
      anchorOrigin: canAnchorBeFlipped ? anchor : anchorOrigin,
      popoverOrigin: popover,
    };
  }

  return origins;
}
