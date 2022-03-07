// @flow
import type DimensionValue from 'models/core/wip/Dimension/DimensionValue';
import type { GeoDimensionFilterMap } from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/FilterSelectionBlock/useGeoFieldOrdering/types';

/**
 * For a given geo dimension filter value, we want to build a map of its
 * hierarchical dimensions to the value for each dimension
 */
function _buildGeoItemFilterMap(
  dimensionValue: DimensionValue,
): { [string]: string } {
  const filterMap = {};
  const filter = dimensionValue.filter();
  // HACK(nina): We know that geo dimensions use the AndFilter to represent
  // the hierarchical dimensions for a given value
  if (filter.tag !== 'AND') {
    return filterMap;
  }

  // HACK(nina): We know that geo dimension values are type SelectorFilter
  const fields = filter.fields();
  fields.forEach(field => {
    if (field.tag !== 'SELECTOR') {
      return;
    }

    filterMap[field.dimension()] = field.value();
  });

  return filterMap;
}

/**
 * Given a map of geo dimensions (to their values) associated with this item,
 * and a map of selected geo dimension filters to each of their selected
 * values, determine whether a given geo dimension filter value is
 * selectable. This function assumes that the map of selected geo
 * dimension filters is not empty.
 */
export default function isSelectable(
  // Current dimension that this item belongs to
  dimensionId: string,
  // Value of item
  dimensionValue: DimensionValue,
  // Map of all exclude geo filters
  excludeGeoDimensionFilterMap: GeoDimensionFilterMap,
  // Pre-existing EXCLUDE values for the current dimension
  excludeValuesForCurrDimension: Set<string> | void,
  // Map of all include geo filter
  includeGeoDimensionFilterMap: GeoDimensionFilterMap,
  // Pre-existing INCLUDE values for the current dimension
  includeValuesForCurrDimension: Set<string> | void,
): boolean {
  // If no filters have been selected, then item is automatically selectable
  if (
    excludeGeoDimensionFilterMap.size() === 0 &&
    includeGeoDimensionFilterMap.size() === 0
  ) {
    return true;
  }

  // NOTE(nina): Edge case: This value has already been selected for the
  // given dimensionId, and we need to make sure that it does not become
  // 'unselectable'. implicitly, due to less granular filters. It should
  // only become 'unselectable' once a user actively deselects it.
  if (
    (excludeValuesForCurrDimension &&
      excludeValuesForCurrDimension.has(dimensionValue.name())) ||
    (includeValuesForCurrDimension &&
      includeValuesForCurrDimension.has(dimensionValue.name()))
  ) {
    return true;
  }

  // For this potentially selectable filter value, we need to build
  // a map representing the geo dimension values associated with it
  // (such as a District item's Province value), and find if the
  // (nonempty) collection of selected geo dimension filters supports
  // this value
  const itemFilterMap = _buildGeoItemFilterMap(dimensionValue);

  // For each hierarchy dimension associated with this potentially
  // selectable filter value, we need to compare it against the INCLUDE
  // and EXCLUDE maps
  return Object.keys(itemFilterMap).reduce(
    (isValueSelectable, geoDimension) => {
      // In the case that the dimension we are evaluating on is the same
      // dimension that this item has, then it is automatically selectable.
      // Otherwise, this would be equivalent to removing all other options in
      // the dropdown immediately after selecting one value. We should
      // only be evaluating based on selections from less granular dimensions
      if (geoDimension === dimensionId) {
        return isValueSelectable;
      }

      // Get item's value for a given geo dimension
      const hierarchyValue = itemFilterMap[geoDimension];
      const excludeValues = excludeGeoDimensionFilterMap.get(geoDimension);
      const includeValues = includeGeoDimensionFilterMap.get(geoDimension);

      // If a list of values to EXCLUDE for this dimension exist, and this
      // value is in that list, then it is automatically unselectable
      if (excludeValues && excludeValues.has(hierarchyValue)) {
        return false;
      }

      // If a list of values to INCLUDE for this dimension exist, and this
      // value is not in that list, then it is unselectable
      if (includeValues && !includeValues.has(hierarchyValue)) {
        return false;
      }

      // If all cases are passed, leave the value unchanged
      return isValueSelectable;
    },
    true,
  );
}
