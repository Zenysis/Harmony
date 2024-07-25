// @flow
import type { AdminBoundaryFilterLocation } from 'models/visualizations/MapViz/types';

/**
 * Build a mapbox-gl filter expression that will say "any shape that
 * contains the locations passed in will be included".
 */
function buildFilter(
  locations: $ReadOnlyArray<AdminBoundaryFilterLocation>,
): $ReadOnlyArray<mixed> {
  return [
    'any',
    ...locations.map(location => [
      'all',
      ...Object.keys(location).map(property => [
        '==',
        ['get', property],
        ['literal', location[property]],
      ]),
    ]),
  ];
}

/**
 * Build a filter that will restrict the admin boundary shapes that are drawn
 * based on a list of locations to include/exclude.
 */
export default function buildAdminBoundaryFilter(
  includeLocations: $ReadOnlyArray<AdminBoundaryFilterLocation>,
  excludeLocations: $ReadOnlyArray<AdminBoundaryFilterLocation>,
): $ReadOnlyArray<mixed> | void {
  if (includeLocations.length === 0 && excludeLocations.length === 0) {
    return undefined;
  }

  const includeFilter = buildFilter(includeLocations);
  if (excludeLocations.length === 0) {
    return includeFilter;
  }

  const excludeFilter = ['!', buildFilter(excludeLocations)];
  if (includeLocations.length === 0) {
    return excludeFilter;
  }

  return ['all', includeFilter, excludeFilter];
}
