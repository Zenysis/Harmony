// @flow
import { QUERY_RESULT_LAYER_ID } from 'components/visualizations/MapViz/defaults';
import { recursivelyIterateCoordinatePoints } from 'components/visualizations/MapViz/common/computeFeatureBounds';
import type { BoundsData } from 'components/visualizations/MapViz/hooks/useViewportSettings/types';
import type { MapboxGLMap } from 'components/ui/visualizations/MapCore/types';

/**
 * Update the bounds structure to include the new latitude and longitude in its
 * min/max lat/lon calculation. This operation happens in-place.
 */
export function updateBoundsFromPointInPlace(
  bounds: BoundsData,
  latitude: number,
  longitude: number,
) {
  // Ignore points located at 0,0 since that indicates a "missing" data point
  // that should not be displayed.
  if (!latitude || !longitude) {
    return;
  }

  /* eslint-disable no-param-reassign */
  bounds.maxLat = Math.max(bounds.maxLat, latitude);
  bounds.maxLon = Math.max(bounds.maxLon, longitude);
  bounds.minLat = Math.min(bounds.minLat, latitude);
  bounds.minLon = Math.min(bounds.minLon, longitude);
  /* eslint-enable no-param-reassign */
}

/**
 * Deserialize the bounds property that is attached to features in the
 * `ShapeLayer`. If the property is the valid type, process it, and return true
 * to indicate success. Otherwise, skip it and return false.
 */
function processSerializedBounds(
  serializedBounds: string,
  onEachPoint: (latitude: number, longitude: number) => void,
): boolean {
  // NOTE: We need to be safe since we can't fully guarantee that the
  // features that have a `bounds` property are in the shape we expect.
  try {
    const bounds = JSON.parse(serializedBounds);
    if (
      bounds.length === 2 &&
      bounds[0].length === 2 &&
      bounds[0].every(b => typeof b === 'number') &&
      bounds[1].length === 2 &&
      bounds[1].every(b => typeof b === 'number')
    ) {
      onEachPoint(bounds[0][1], bounds[0][0]);
      onEachPoint(bounds[1][1], bounds[1][0]);
      return true;
    }
  } catch (error) {
    // We were unable to deserialize the bounds.
  }

  return false;
}

/**
 *
 */
export default function calculateQueryResultLayerBounds(
  mapboxGLInstance: MapboxGLMap,
  queryResultDataBounds: BoundsData,
): BoundsData | void {
  // Limit the area that we search for features to only the edges of the current
  // visible map area. We are searching for any shapes that intersect with the
  // edge of the map. If we find any, we want to update the map bounds so that
  // those shapes are fully visible. We are safe to perform this operation
  // because this method should only have been called _after_ the map bounds
  // were updated to show the full query result data points. Since the query
  // result data contains the centroids of each shape, we are guaranteed that
  // when this method is called, the map is already zoomed out to show at least
  // some part of every shape.
  // NOTE: The `queryRenderedFeatures` bounds parameter uses *pixels*,
  // which is confusing because everything else we do operates in *lat/lon*.
  const { x, y }: { x: number, y: number } = mapboxGLInstance
    .project(mapboxGLInstance.getBounds().getSouthEast())
    .round();

  // The pixel coordinate system goes from (0,0) at the top-left to
  // (width, height) at the bottom-right.
  const boundingLines = [
    [
      [0, 0],
      [0, y],
    ],
    [
      [0, 0],
      [x, 0],
    ],
    [
      [x, 0],
      [x, y],
    ],
    [
      [x, y],
      [0, y],
    ],
  ];

  // Collect all the features that intersect the bounding lines.
  const features = boundingLines.flatMap(lineBounds =>
    mapboxGLInstance.queryRenderedFeatures(lineBounds, {
      layers: [QUERY_RESULT_LAYER_ID],
    }),
  );

  // Initialize our bounds data to be the query result data's bounds since we
  // know that the map must include _at least_ those points. Since we are
  // performing a limited search over the features that only intersect the map
  // edge, we cannot initialize this to Infinity. There may not be a shape that
  // intersects every edge.
  const output = { ...queryResultDataBounds };

  const onEachPoint = (latitude, longitude) =>
    updateBoundsFromPointInPlace(output, latitude, longitude);

  features.forEach(({ geometry, properties }) => {
    // If bounds exist on the feature, we can use them directly.
    const { bounds } = properties;
    if (
      typeof bounds === 'string' &&
      processSerializedBounds(bounds, onEachPoint)
    ) {
      return;
    }

    // Otherwise, we will want to compute the min/max lat/lon of the feature
    // directly.
    // NOTE: It's safe to cast here since MapboxGL guarantees the
    // return type.
    recursivelyIterateCoordinatePoints(
      (geometry.coordinates: $Cast),
      onEachPoint,
    );
  });

  // Ensure that all the bounds are valid. If any are still Infinity, we were
  // unable to compute the bounds.
  return Object.values(output).every(Number.isFinite) ? output : undefined;
}
