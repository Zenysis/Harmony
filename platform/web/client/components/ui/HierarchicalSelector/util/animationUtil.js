// @flow
/* eslint-disable max-len */
// Performant animated width based on:
// https://developers.google.com/web/updates/2017/03/performant-expand-and-collapse
import { range } from 'util/arrayUtil';

export const DURATION = 400;
export const ANIMATION_STEPS: $ReadOnlyArray<number> = range(0, 101);

// Maps a startWidth and endWidth to a tuple of containerScales and
// contentScales (i.e. the scaleX values for the outer container, and the
// scaleX values for the inner contents).
const ANIMATION_SCALES: {
  [from: number]: {
    [to: number]: [$ReadOnlyArray<number>, $ReadOnlyArray<number>],
    ...,
  },
  ...,
} = {};

// Easing method for pretty animations.
function ease(value: number, pow: number = 4): number {
  return 1 - (1 - value) ** pow;
}

function _getScaleXValue(
  step: number,
  startWidth: number,
  endWidth: number,
): number {
  // Remap the step value to an eased one.
  const easedStep = ease(step / 100);

  // if we are expanding:
  if (endWidth >= startWidth) {
    const ratio = startWidth / endWidth;
    return ratio + (1 - ratio) * easedStep;
  }

  // if we are collapsing:
  const ratio = endWidth / startWidth;
  return 1 + (ratio - 1) * easedStep;
}

function _getScaleXArrays(
  startWidth: number,
  endWidth: number,
): [$ReadOnlyArray<number>, $ReadOnlyArray<number>] {
  const containerScales = ANIMATION_STEPS.map(step =>
    _getScaleXValue(step, startWidth, endWidth),
  );
  const contentScales = containerScales.map(v => 1 / v);
  return [containerScales, contentScales];
}

/**
 * Helper method to preload likely animations based on the provided column
 * widths.
 */
export function preloadAnimations(columnWidth: number, maxWidth: number): void {
  for (let start = columnWidth; start <= maxWidth; start += columnWidth) {
    const end = Math.min(maxWidth, start + columnWidth);

    if (!(start in ANIMATION_SCALES)) {
      ANIMATION_SCALES[start] = {};
    }

    if (!(end in ANIMATION_SCALES[start])) {
      ANIMATION_SCALES[start][end] = _getScaleXArrays(start, end);
    }

    if (!(end in ANIMATION_SCALES)) {
      ANIMATION_SCALES[end] = {};
    }

    if (!(start in ANIMATION_SCALES[end])) {
      ANIMATION_SCALES[end][start] = _getScaleXArrays(end, start);
    }
  }
}

/**
 * Given a start and end width, return the array of scaleX values for the
 * container, and an array of scaleX values to counter-scale the internal
 * contents.
 */
export function getScaleXTransformValues(
  startWidth: number,
  endWidth: number,
): [$ReadOnlyArray<number>, $ReadOnlyArray<number>] {
  if (
    startWidth in ANIMATION_SCALES &&
    endWidth in ANIMATION_SCALES[startWidth]
  ) {
    return ANIMATION_SCALES[startWidth][endWidth];
  }
  return _getScaleXArrays(startWidth, endWidth);
}
