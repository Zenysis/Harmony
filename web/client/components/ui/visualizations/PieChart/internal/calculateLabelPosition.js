// @flow
import { getStringWidth } from '@vx/text';

import type { LabelPosition } from 'components/ui/visualizations/PieChart/types';

/**
 * Determine how to place the pie label so that it is located right outside the
 * center of the pie's segment. This is a little tricky to compute since we're
 * dealing with angles in radians instead of x/y coordinates.
 */
export default function calculateLabelPosition(
  label: string,
  fontSize: number,
  startAngle: number,
  endAngle: number,
  radius: number,
  distanceFromPieSegment: number,
): LabelPosition {
  const center = (endAngle + startAngle) / 2;
  const midpoint = {
    x: (radius + distanceFromPieSegment) * Math.sin(center),
    y: -(radius + distanceFromPieSegment) * Math.cos(center),
  };

  // Adjust the text box position so that it is completely outside the pie
  // segment. Wrap around the pie and adjust the placement based on the angle.
  const yFactor = Math.abs(Math.sin((center - Math.PI) / 2));
  const xFactor =
    center >= 0 && center <= Math.PI
      ? -Math.abs(Math.cos(center)) / 2
      : Math.abs(Math.cos(center)) / 2 - 1;

  const textWidth = getStringWidth(label, { fontSize: `${fontSize}px` });
  const textHeight = fontSize * 1.25;
  const top = midpoint.y - textHeight * yFactor;
  const left = midpoint.x + textWidth * xFactor;
  return {
    left,
    top,
    bottom: top + textHeight,
    right: left + textWidth,
  };
}
