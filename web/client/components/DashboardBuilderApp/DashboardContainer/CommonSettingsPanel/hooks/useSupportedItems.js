// @flow
import * as React from 'react';
import Promise from 'bluebird';

import DimensionService from 'services/wip/DimensionService';
import GranularityService from 'services/wip/GranularityService';
import { cancelPromise } from 'util/promiseUtil';
import type Dimension from 'models/core/wip/Dimension';
import type Granularity from 'models/core/wip/Granularity';

// Build a list of enabled items based on the selected categories.
function filterItems<T: Dimension | Granularity>(
  items: $ReadOnlyArray<T>,
  selectedCategories: $ReadOnlyArray<string>,
): $ReadOnlyArray<T> {
  // When there are no categories specifically selected, this means that they
  // should *all* be selected. This reduces the number of items we need to store
  // in the spec AND it allows us to be future proof to new categories that are
  // added.
  const includeAllCategories = selectedCategories.length === 0;
  if (includeAllCategories) {
    return items;
  }

  return items.filter(item => {
    const category = item.get('category');
    return category !== undefined && selectedCategories.includes(category.id());
  });
}

// Return a list of supported dimension IDs and granularity IDs based on the
// categories a user has selected as available to use in the dashboard filter
// settings.
export default function useSupportedItems(
  selectedCategories: $ReadOnlyArray<string>,
): [$ReadOnlyArray<string>, $ReadOnlyArray<string>] {
  // Store all possible dimensions and granularities.
  const [dimensions, setDimensions] = React.useState<$ReadOnlyArray<Dimension>>(
    [],
  );
  const [granularities, setGranularities] = React.useState<
    $ReadOnlyArray<Granularity>,
  >([]);

  // Fetch the list of all dimensions and granularities when the hook is first
  // loaded. These will not change.
  React.useEffect(() => {
    const promise = Promise.all([
      DimensionService.getAll(),
      GranularityService.getAll(),
    ]).then(([allDimensions, allGranularities]) => {
      setDimensions(allDimensions);
      setGranularities(allGranularities);
    });

    return () => cancelPromise(promise);
  }, []);

  const supportedDimensions = React.useMemo(
    () => filterItems(dimensions, selectedCategories).map(d => d.id()),
    [dimensions, selectedCategories],
  );

  const supportedGranularities = React.useMemo(
    () => filterItems(granularities, selectedCategories).map(g => g.id()),
    [granularities, selectedCategories],
  );

  return [supportedDimensions, supportedGranularities];
}
