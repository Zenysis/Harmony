// @flow
import type { LonLatPointFeaturePair } from 'components/ui/visualizations/MapCore/types';

/**
 * Given a value, determine if it is of type LonLatPointFeaturePair,
 * which typically represents the coordinates of a Point Feature object.
 */
export default function getPointCoordinates(
  value: mixed,
): LonLatPointFeaturePair | void {
  if (Array.isArray(value) && value.length === 2) {
    const [longitude, latitude] = value;

    return typeof longitude === 'number' && typeof latitude === 'number'
      ? [longitude, latitude]
      : undefined;
  }

  return undefined;
}
