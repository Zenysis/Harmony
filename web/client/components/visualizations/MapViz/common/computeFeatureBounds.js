// @flow
import type {
  Feature,
  LonLatPointFeaturePair,
} from 'components/ui/visualizations/MapCore/types';

// This is the mapbox-gl bounds structure. It's compact, so it makes a good
// candidate for storing directly in a feature's properties.
type Bounds = [LonLatPointFeaturePair, LonLatPointFeaturePair];

// Cache the lat/lon bounds for a given feature so that we only have to compute
// it *once* while the Feature is still in memory.
const BOUNDS_CACHE: WeakMap<Feature, Bounds> = new WeakMap();

// This is the type of all possible geometries that a GeoJSON feature can hold.
type GeometryCoordinates =
  | LonLatPointFeaturePair
  | $ReadOnlyArray<LonLatPointFeaturePair>
  | $ReadOnlyArray<$ReadOnlyArray<LonLatPointFeaturePair>>
  | $ReadOnlyArray<$ReadOnlyArray<$ReadOnlyArray<LonLatPointFeaturePair>>>;

/**
 * Recursively find all coordinate pairs in the geometry given. When a
 * coordinate pair is found, pass it to the `onEachPoint` callback.
 *
 * NOTE: This recursion should be fairly safe, since the max depth
 * _should_ be 3. However if we are given a malformed coordinates value, it's
 * possible a deeper depth would be used. The depth parameter helps enforce
 * this.
 */
export function recursivelyIterateCoordinatePoints(
  coordinates: GeometryCoordinates,
  onEachPoint: (latitude: number, longitude: number) => void,
  depth: number = 0,
) {
  if (coordinates.length === 0 || depth > 3) {
    return;
  }

  if (
    typeof coordinates[0] === 'number' &&
    typeof coordinates[1] === 'number'
  ) {
    onEachPoint(coordinates[1], coordinates[0]);
    return;
  }

  coordinates.forEach(coordinate => {
    if (typeof coordinate !== 'number') {
      recursivelyIterateCoordinatePoints(coordinate, onEachPoint, depth + 1);
    }
  });
}

/**
 * Compute the min/max lat/lon for the provided feature. Return the bounds data
 * in the MapboxGL format of [[minLon, minLat], [maxLon, maxLat]].
 */
export default function computeFeatureBounds(feature: Feature): Bounds {
  const cachedValue = BOUNDS_CACHE.get(feature);
  if (cachedValue !== undefined) {
    return cachedValue;
  }

  const boundsData = {
    maxLat: -Infinity,
    maxLon: -Infinity,
    minLat: Infinity,
    minLon: Infinity,
  };

  function onEachPoint(latitude: number, longitude: number) {
    // Ignore points located at 0,0 since that indicates a "missing" data point
    // that should not be displayed.
    if (!latitude || !longitude) {
      return;
    }

    boundsData.maxLat = Math.max(boundsData.maxLat, latitude);
    boundsData.maxLon = Math.max(boundsData.maxLon, longitude);
    boundsData.minLat = Math.min(boundsData.minLat, latitude);
    boundsData.minLon = Math.min(boundsData.minLon, longitude);
  }

  // NOTE: It's safe to cast here since we are following the GeoJSON
  // spec correctly. We just haven't updated the types in MapCore to handle all
  // the possible cases since they don't actually come up in our platform right
  // now. Handling all the valid possibile geometry types was easy to do,
  // though, so I went ahead and implemented it.
  recursivelyIterateCoordinatePoints(
    (feature.geometry.coordinates: $Cast),
    onEachPoint,
  );

  const bounds = [
    [boundsData.minLon, boundsData.minLat],
    [boundsData.maxLon, boundsData.maxLat],
  ];
  BOUNDS_CACHE.set(feature, bounds);
  return bounds;
}
