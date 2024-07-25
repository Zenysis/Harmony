// @flow
import HierarchicalDimensionService from 'services/AdvancedQueryApp/HierarchicalDimensionService';

/** List of geo dimension values for this deployment */
export const GEO_FIELD_ORDERING: $ReadOnlyArray<string> = HierarchicalDimensionService.getGeoFieldOrdering();
