// @flow
import * as Zen from 'lib/Zen';
import { sortNumeric } from 'util/arrayUtil';
import type GraphSearchResults from 'models/ui/common/GraphSearchResults';
import type HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import type { NamedItem } from 'models/ui/HierarchicalSelector/types';

export type HierarchicalSearchResult<T> = {
  key: string,
  path: Zen.Array<HierarchyItem<T>>,
  items: Zen.Array<HierarchyItem<T>>,
};

// while we are processing results, we use this temporary
// HierarchicalSearchResult type which is mutable
type MutableHierarchicalSearchResult<T> = {
  key: string,
  path: Array<HierarchyItem<T>>,
  items: Array<HierarchyItem<T>>,
};

function _getMaxMatchScore<T: NamedItem>(
  items: Array<HierarchyItem<T>>,
  searchResults: GraphSearchResults<string, string>,
): number {
  let maxScore = 0;
  items.forEach(item => {
    const score = searchResults.getMatchScore(item.id());
    if (score > maxScore) {
      maxScore = score;
    }
  });
  return maxScore;
}

function _concatItemIds<T: NamedItem>(items: Array<HierarchyItem<T>>): string {
  return items.map(item => item.id()).join('-');
}

function _addPathToResults<T: NamedItem>(
  currentPath: Array<HierarchyItem<T>>,
  itemsByPath: { [string]: MutableHierarchicalSearchResult<T>, ... },
): void {
  const pathStr = _concatItemIds(currentPath);
  // eslint-disable-next-line no-param-reassign
  itemsByPath[pathStr] = {
    key: pathStr,
    path: currentPath,
    items: [],
  };
}

function _addItemToPath<T: NamedItem>(
  item: HierarchyItem<T>,
  currentPath: Array<HierarchyItem<T>>,
  itemsByPath: { [string]: MutableHierarchicalSearchResult<T>, ... },
): void {
  const pathStr = _concatItemIds(currentPath);
  if (pathStr in itemsByPath) {
    itemsByPath[pathStr].items.push(item);
  } else {
    // eslint-disable-next-line no-param-reassign
    itemsByPath[pathStr] = {
      key: pathStr,
      path: currentPath,
      items: [item],
    };
  }
}

function _processSearchResultsHelper<T: NamedItem>(
  items: Zen.Array<HierarchyItem<T>>,
  currentPath: Array<HierarchyItem<T>>,
  searchResults: GraphSearchResults<string, string>,
  itemsByPath: { [string]: MutableHierarchicalSearchResult<T>, ... },
): void {
  items.forEach(item => {
    const id = item.id();
    const children = item.children();
    if (children === undefined && searchResults.someLeafMatchesValue(id)) {
      _addItemToPath(item, currentPath, itemsByPath);
    } else if (children && searchResults.someParentOrChildMatchesValue(id)) {
      _addPathToResults(currentPath.concat(item), itemsByPath);
      _processSearchResultsHelper(
        children,
        currentPath.concat(item),
        searchResults,
        itemsByPath,
      );
    }
  });
}

/**
 * Convert a GraphSearchResults model to a read-only array of
 * HierarchicalSearchResult (which are tuples of a category path and a list
 * of items)
 *
 * Sort the results by match score. All items within a group get sorted by
 * match scores, and the groups themselves get sorted based off of who has
 * the highest match score. A group's match score is the max of its own
 * matchScore and the max of all of its item's match scores.
 *
 * @param {HierarchyItem<T>} hierarchyRoot the root at which we want to start
 * collecting search results
 * @param {GraphSearchResults} searchResults the result of our search
 */
export default function processGraphSearchResults<T: NamedItem>(
  hierarchyRoot: HierarchyItem<T>,
  searchResults: GraphSearchResults<string, string>,
): $ReadOnlyArray<HierarchicalSearchResult<T>> {
  const itemsByPath: { [string]: MutableHierarchicalSearchResult<T>, ... } = {};
  const children = hierarchyRoot.children();
  if (children === undefined) {
    return [];
  }

  _processSearchResultsHelper(
    children,
    [hierarchyRoot],
    searchResults,
    itemsByPath,
  );
  const pathStrs = Object.keys(itemsByPath);

  // go through each path and sort the items by score
  pathStrs.forEach(p => {
    const { items } = itemsByPath[p];
    items.sort((item1, item2) =>
      sortNumeric(
        searchResults.getMatchScore(item1.id()),
        searchResults.getMatchScore(item2.id()),
        true,
      ),
    );
  });

  // now sort the path groups themselves based off of who has the highest max score
  pathStrs.sort((p1, p2) => {
    const { path, items } = itemsByPath[p1];
    const { path: path2, items: items2 } = itemsByPath[p2];
    const maxScore1 = Math.max(
      _getMaxMatchScore(path, searchResults),
      _getMaxMatchScore(items, searchResults),
    );
    const maxScore2 = Math.max(
      _getMaxMatchScore(path2, searchResults),
      _getMaxMatchScore(items2, searchResults),
    );
    return sortNumeric(maxScore1, maxScore2, true);
  });

  return pathStrs.map(pathStr => {
    const { key, path, items } = itemsByPath[pathStr];
    return {
      key,
      path: Zen.Array.create(path),
      items: Zen.Array.create(items),
    };
  });
}
