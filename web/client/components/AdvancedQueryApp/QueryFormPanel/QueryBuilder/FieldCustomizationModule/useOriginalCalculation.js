// @flow
import * as React from 'react';

import type Field from 'models/core/wip/Field';
import type HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import type LinkedCategory from 'models/core/wip/LinkedCategory';
import type { Calculation } from 'models/core/wip/Calculation/types';

// Add a caching layer to speed up subsequent searches since
// `HierarchyItem.findItemById` is a recursive call that can potentially be
// costly.
const SEARCH_CACHE: WeakMap<
  HierarchyItem<Field | LinkedCategory>,
  Map<string, Field | void>,
> = new WeakMap();

function getSearchCache(
  fieldHierarchyRoot: HierarchyItem<Field | LinkedCategory>,
): Map<string, Field | void> {
  const currentCache = SEARCH_CACHE.get(fieldHierarchyRoot);
  if (currentCache !== undefined) {
    return currentCache;
  }

  const newCache = new Map();
  SEARCH_CACHE.set(fieldHierarchyRoot, newCache);
  return newCache;
}

function findFieldInTree(
  id: string,
  fieldHierarchyRoot: HierarchyItem<Field | LinkedCategory>,
  searchCache: Map<string, Field | void>,
): Field | void {
  if (searchCache.has(id)) {
    return searchCache.get(id);
  }

  const foundItem = fieldHierarchyRoot.findItemById(id);

  let output;
  if (foundItem !== undefined) {
    const metadata = foundItem.metadata();
    if (metadata.tag === 'FIELD') {
      output = metadata;
    }
  }

  searchCache.set(id, output);
  return output;
}

// Find the original, uncustomized calculation for the provided field ID. Also,
// find any constituent fields for the original calculation. Use the field
// hierarchy tree to find the fields instead of making a call through a service
// or over the network.
export default function useOriginalCalculation(
  fieldId: string,
  fieldHierarchyRoot: HierarchyItem<Field | LinkedCategory>,
): [Calculation | void, $ReadOnlyArray<Field>] {
  const calculation = React.useMemo(() => {
    const field = findFieldInTree(
      fieldId,
      fieldHierarchyRoot,
      getSearchCache(fieldHierarchyRoot),
    );

    return field !== undefined ? field.calculation() : undefined;
  }, [fieldId, fieldHierarchyRoot]);

  // Find the constituent field IDs for the provided calculation.
  const constituentIds = React.useMemo(() => {
    if (calculation === undefined) {
      return [];
    }

    // If the calculation is a "formula" type, we can easily find the
    // constituent field IDs just by inspecting the formula.
    if (calculation.tag === 'FORMULA') {
      return calculation.constituents().map(c => c.id());
    }

    // HACK(stephen): After moving to GraphQL with DataCatalog, we lose access
    // to the `constituentIds` property of `FieldMetadata`. This was originally
    // produced on the backend by inspecting the type of calculation and would
    // generally be produced for calculated and composite indicators. The
    // calculated indicator case is now handled with the FormulaCalculation
    // check above, however we do not have an equivalent test for the
    // composite indicator calculation. This is because composite indicators are
    // not really a thing when it comes to the frontend. Composite indicators
    // basically just take the SUM of the children. This means the calculation
    // type we receive on the frontend will be just a normal calculation. To
    // try and detect if a composite indicator is in use, we look at the
    // calculation filter. If it is a `FieldInFilter` then we are likely working
    // with a composite calculation and can assume that all the fields in the
    // filter are the composite children.
    const calculationFilter = calculation.get('filter');
    if (calculationFilter !== null && calculationFilter.tag === 'FIELD_IN') {
      return calculationFilter.fieldIds();
    }

    return [];
  }, [calculation]);

  const constituentFields = React.useMemo(() => {
    if (constituentIds.length === 0) {
      return [];
    }

    const searchCache = getSearchCache(fieldHierarchyRoot);

    const output = [];
    constituentIds.forEach(id => {
      const field = findFieldInTree(id, fieldHierarchyRoot, searchCache);
      if (field !== undefined) {
        output.push(field);
      }
    });

    return output;
  }, [constituentIds, fieldHierarchyRoot]);

  return [calculation, constituentFields];
}
