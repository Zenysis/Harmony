// @flow
import * as Zen from 'lib/Zen';
import { GEO_FIELD_ORDERING } from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/FilterSelectionBlock/useGeoFieldOrdering/registry';
import type { GeoDimensionFilterMap } from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/FilterSelectionBlock/useGeoFieldOrdering/types';
import type { QueryFilterItem } from 'models/core/wip/QueryFilterItem/types';

/**
 * This function is responsible for building a map of geo dimension
 * filters each to a list of selected values for that dimension. If the
 * dimension already exists in the map, then we have come across a duplicate
 * top-level selection, and just OR the selections together as if only
 * one top-level filter was selected.
 */
function _buildSelectedGeoFilterItemMap(
  dimensionId: string,
  geoFilterMap: GeoDimensionFilterMap,
  selectedValues: Zen.Array<string>,
): GeoDimensionFilterMap {
  const initialValues = geoFilterMap.get(dimensionId, undefined);

  // If there are no initial values, then create a new set with the
  // selected values. Otherwise, using the set of initial values, add any
  // new unique values from the selected values
  return initialValues === undefined
    ? geoFilterMap.set(dimensionId, new Set(selectedValues))
    : geoFilterMap.set(
        dimensionId,
        selectedValues.reduce(
          (values, selectedValue) => values.add(selectedValue),
          initialValues,
        ),
      );
}

/**
 * NOTE(nina): This function is responsible for building two maps. One
 * tracks a mapping of selected geo dimension filters to a list of values
 * for that filter that must be INCLUDED in the query. The other does the
 * same, only for values that must be EXCLUDED from the query. In the case
 * of two top-level filters for the same geo dimension, we ignore the typical
 * logic of ANDing the two filters, and instead OR them together. This is
 * equivalent to if a user had selected one top-level filter for the dimension
 * with all the values between the two top-level filters. This case only
 * applies for duplicate geo dimensions, as there are very few edge cases
 * to consider for now (like a more granular dimension that is truly
 * attached to two less granular dimensions at the same level).
 */
export default function buildSelectedGeoFilterItemMaps(
  selectedItems: Zen.Array<QueryFilterItem>,
): [GeoDimensionFilterMap, GeoDimensionFilterMap] {
  let includeGeoDimensionFilterMap = Zen.Map.create();
  let excludeGeoDimensionFilterMap = Zen.Map.create();

  // For each item, we need to determine if it has filters that must be
  // INCLUDED or EXCLUDED from the query
  selectedItems.forEach(item => {
    // Do nothing if the selected top-level filter is not a geo dimension
    if (
      item.tag !== 'DIMENSION_VALUE_FILTER_ITEM' ||
      !GEO_FIELD_ORDERING.includes(item.dimension())
    ) {
      return;
    }

    const dimensionId = item.dimension();

    // List of selected values for this dimension filter
    const dimensionValues = item
      .dimensionValues()
      .map(dimensionValue => dimensionValue.name());

    // If NOT flag is on, then populate the exclude map. Otherwise, populate
    // the include map
    if (item.invert()) {
      excludeGeoDimensionFilterMap = _buildSelectedGeoFilterItemMap(
        dimensionId,
        excludeGeoDimensionFilterMap,
        dimensionValues,
      );
    } else {
      includeGeoDimensionFilterMap = _buildSelectedGeoFilterItemMap(
        dimensionId,
        includeGeoDimensionFilterMap,
        dimensionValues,
      );
    }
  });
  return [includeGeoDimensionFilterMap, excludeGeoDimensionFilterMap];
}
