// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import buildSelectedGeoFilterItemMaps from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/FilterSelectionBlock/useGeoFieldOrdering/buildSelectedGeoFilterItemMaps';
import isSelectable from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/FilterSelectionBlock/useGeoFieldOrdering/isSelectable';
import { GEO_FIELD_ORDERING } from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/FilterSelectionBlock/useGeoFieldOrdering/registry';
import type DimensionValue from 'models/core/wip/Dimension/DimensionValue';
import type DimensionValueFilterItem from 'models/core/wip/QueryFilterItem/DimensionValueFilterItem';
import type { QueryFilterItem } from 'models/core/wip/QueryFilterItem/types';

/**
 * The useGeoFieldOrdering custom hook is responsible for generating
 * a function that determines which dimension values in a geo dimension
 * filter are selectable by the user. This is determined by checking whether
 * other geographical dimensions have also been selected, thus narrowing
 * down the list of filter values that should be available to the user.
 *
 * NOTE(nina): This is a short-term fix for a relatively small use case.
 * Ideally, we would construct ANY set of hierarchical dimension values as
 * a tree, using that to populate the filter selector. We would need to
 * handle selecting non-leaf nodes that double as values for a less
 * granular dimension, as well as being able to click through to the
 * bottom of a hierarchy. Still, it would map better to our internal logic,
 * and be usable beyond just geo dimensions.
 */
export default function useGeoFieldOrdering(
  selectedItems: Zen.Array<QueryFilterItem>,
): (
  item: DimensionValueFilterItem,
  dimensionValues: $ReadOnlyArray<DimensionValue>,
) => $ReadOnlyArray<DimensionValue> {
  const [includeFilterMap, excludeFilterMap] = React.useMemo(
    () => buildSelectedGeoFilterItemMaps(selectedItems),
    [selectedItems],
  );

  // Given a list of values for a geo dimension filter, and an item
  // representing that geo dimension filter, return a subset of this list
  // that can actually be selected by the user. This is determined by
  // previously selected geo dimension filters, if any.
  const buildSelectableDimensionValues = React.useCallback(
    (
      item: DimensionValueFilterItem,
      dimensionValues: $ReadOnlyArray<DimensionValue>,
    ): $ReadOnlyArray<DimensionValue> => {
      const dimensionId = item.dimension();
      // If the current filter item being customized is not a geo dimension,
      // or if no other geo dimension filters have also been selected,
      // then do not filter out any values
      if (
        !GEO_FIELD_ORDERING.includes(dimensionId) ||
        (includeFilterMap.size() === 0 && excludeFilterMap.size() === 0)
      ) {
        return dimensionValues;
      }

      const excludeValuesForCurrentDimension = excludeFilterMap.get(
        dimensionId,
      );
      const includeValuesForCurrentDimension = includeFilterMap.get(
        dimensionId,
      );

      return dimensionValues.filter(dimensionValue =>
        isSelectable(
          dimensionId,
          dimensionValue,
          excludeFilterMap,
          excludeValuesForCurrentDimension,
          includeFilterMap,
          includeValuesForCurrentDimension,
        ),
      );
    },
    [includeFilterMap, excludeFilterMap],
  );

  return buildSelectableDimensionValues;
}
