// @flow
import ZenArray from 'util/ZenModel/ZenArray';
import ZenMap from 'util/ZenModel/ZenMap';
import type {
  SortDirection,
  SortState,
} from 'components/ui/visualizations/Table/types';

export const SORT_DIRECTION: { [SortDirection]: SortDirection } = {
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

export function updateSortFromEvent(
  event: MouseEvent,
  dataKey: string,
  sortColumns: ZenArray<string>,
  sortDirectionMap: ZenMap<SortDirection>,
): SortState {
  // Shift + click appenda a column to existing sorted column list.
  if (event.shiftKey) {
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

  // Ctrl + click removes a column from sort, if present.
  if (event.ctrlKey || event.metaKey) {
    return {
      sortColumns: sortColumns.findAndDelete(c => c === dataKey),
      sortDirectionMap: sortDirectionMap.delete(dataKey),
    };
  }

  // If the column clicked is the only column being sorted on, swap the
  // direction.
  if (sortColumns.size() === 1 && sortDirectionMap.has(dataKey)) {
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

  // Otherwise, we replace the previous sort with a new sort only on the clicked
  // column. Reset the current page since preserving the page after sorting
  // isn't that useful.
  return {
    sortColumns: ZenArray.create([dataKey]),
    sortDirectionMap: ZenMap.create({ [dataKey]: SORT_DIRECTION.ASC }),
  };
}
