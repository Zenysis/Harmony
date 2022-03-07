// @flow
import * as Zen from 'lib/Zen';
import { TOTAL_DIMENSION_VALUE } from 'models/visualizations/common/constants';
import type {
  SortDirection,
  SortDirectionMap,
  SortState,
} from 'components/ui/visualizations/Table/types';

export const SORT_DIRECTION: SortDirectionMap = {
  ASC: 'ASC',
  DESC: 'DESC',
};
const STRING_COMPARATOR = new Intl.Collator(undefined, { numeric: true });

// Sort two values that could be of any type. If the values are strings or
// finite numbers, provide a normal sort. Prefer sorting values first that are
// sortable (i.e. string or finite number) over values that are unsortable (like
// objects or undefined). If both values are sortable but not of the same type
// (i.e. string and number) then fallback to JS comparison. Non-sortable values
// will always be sorted to the end regardless of `descending` flag.
export function mixedValueSort(
  aVal: mixed,
  bVal: mixed,
  descending: boolean = false,
): number {
  if (aVal === bVal) {
    return 0;
  }

  const offset = descending ? -1 : 1;

  // NOTE(moriah, stephen): When includeTotal is selected for a given dimension
  // we don't actually want to sort it in with the other values when
  // sorting alphabetically. This will allow the data point representing the
  // total value to be the greatest string. When ascending alphabetically
  // it will come last.
  if (aVal === TOTAL_DIMENSION_VALUE) {
    return offset;
  }

  if (bVal === TOTAL_DIMENSION_VALUE) {
    return -offset;
  }

  // Handle the sortable cases:
  // 1) Both values are strings
  if (typeof aVal === 'string' && typeof bVal === 'string') {
    return STRING_COMPARATOR.compare(aVal, bVal) * offset;
  }

  // 2) Both values are numbers
  if (typeof aVal === 'number' && typeof bVal === 'number') {
    if (Number.isFinite(aVal) && Number.isFinite(bVal)) {
      return (aVal - bVal) * offset;
    }

    // Things get weird now because aVal or bVal could be any combination
    // of Inf, -Inf, or NaN. They should always be at the end of the list
    // regardless of sort order.
    if (!Number.isFinite(aVal) && !Number.isFinite(bVal)) {
      return 0;
    }

    if (!Number.isFinite(aVal)) {
      return 1;
    }

    if (!Number.isFinite(bVal)) {
      return -1;
    }
  }

  // Handle non-sortable cases first. Preference the sortable value if one
  // exists. Otherwise, consider the two values equal.
  const aType = typeof aVal;
  const bType = typeof bVal;
  const aSortable =
    aType === 'string' || (aType === 'number' && Number.isFinite(aVal));
  const bSortable =
    bType === 'string' || (bType === 'number' && Number.isFinite(bVal));

  if (!aSortable && !bSortable) {
    return 0;
  }
  if (aSortable && !bSortable) {
    return -1;
  }
  if (bSortable && !aSortable) {
    return 1;
  }

  // In theory, this can't happen. But include it as a fallthrough case just as
  // a backup. Also satisfies flow.
  return 0;
}

function updateSortState(
  dataKey: string,
  sortColumns: Zen.Array<string>,
  sortDirectionMap: Zen.Map<SortDirection>,
  action: 'append' | 'remove' | 'replace',
): SortState {
  // Preserve the existing columns sort selections and add the column to the
  // sort state. If the column is not new, swap its sort direction.
  if (action === 'append') {
    // If a column had not been sorted on previously, add it to the map.
    if (!sortDirectionMap.has(dataKey)) {
      return {
        sortColumns: sortColumns.push(dataKey),
        sortDirectionMap: sortDirectionMap.set(dataKey, SORT_DIRECTION.ASC),
      };
    }

    // If a column already being sorted on was clicked, swap the direction.
    return {
      sortColumns,
      sortDirectionMap: sortDirectionMap.set(
        dataKey,
        sortDirectionMap.get(dataKey) === SORT_DIRECTION.ASC
          ? SORT_DIRECTION.DESC
          : SORT_DIRECTION.ASC,
      ),
    };
  }

  // Remove the column from the current sort state.
  if (action === 'remove') {
    return {
      sortColumns: sortColumns.findAndDelete(c => c === dataKey),
      sortDirectionMap: sortDirectionMap.delete(dataKey),
    };
  }

  // Default action is to replace the existing sort state with a single sort
  // selection on the given column.

  // If the column was already sorted on, swap the direction.
  const sortDirection =
    sortDirectionMap.get(dataKey) === SORT_DIRECTION.ASC
      ? SORT_DIRECTION.DESC
      : SORT_DIRECTION.ASC;

  return {
    sortColumns: Zen.Array.create([dataKey]),
    sortDirectionMap: Zen.Map.create({ [dataKey]: sortDirection }),
  };
}

export function updateSortFromEvent(
  event: MouseEvent,
  dataKey: string,
  sortColumns: Zen.Array<string>,
  sortDirectionMap: Zen.Map<SortDirection>,
  mandatorySortColumns: $ReadOnlyArray<string>,
): SortState {
  let action = 'replace';
  // Shift + click appends a column to existing sorted column list.
  if (event.shiftKey) {
    action = 'append';
  } else if (event.ctrlKey || event.metaKey) {
    // Ctrl + click removes a column from sort, if present.
    action = 'remove';
  }

  const newState = updateSortState(
    dataKey,
    sortColumns,
    sortDirectionMap,
    action,
  );

  // If there are no mandatory columns to sort on, there is nothing left to do.
  if (mandatorySortColumns.length === 0) {
    return newState;
  }

  // If there *are* mandatory columns, we need to ensure that they are included
  // first.
  newState.sortColumns = Zen.Array.create([
    ...mandatorySortColumns,
    ...newState.sortColumns
      .arrayView()
      .filter(c => !mandatorySortColumns.includes(c)),
  ]);

  // Ensure all the mandatory sort columns have a sort direction set.
  mandatorySortColumns.forEach(c => {
    // Preserve the previously selected sort direction since the update step
    // might have lost it depending on what action was taken.
    const sortDirection =
      newState.sortDirectionMap.get(c) ||
      sortDirectionMap.get(c, SORT_DIRECTION.ASC);
    newState.sortDirectionMap = newState.sortDirectionMap.set(c, sortDirection);
  });

  return newState;
}
