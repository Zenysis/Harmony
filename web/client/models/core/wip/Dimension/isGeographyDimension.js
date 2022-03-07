// @flow
import HierarchicalDimensionService from 'services/AdvancedQueryApp/HierarchicalDimensionService';

/**
 * Checks if a dimension id is a Geography dimension.
 *
 * TODO(pablo, nina): we really need a better way of doing this that doesn't
 * involve reading from window.__JSON_FROM_BACKEND (which is how
 * HierarchicalDimensionService gives access to the geoFieldOrdering).
 */
export default function isGeographyDimension(dimensionId: string): boolean {
  return HierarchicalDimensionService.getGeoFieldOrdering().includes(
    dimensionId,
  );
}
