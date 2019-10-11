// @flow
import ZenArray from 'util/ZenModel/ZenArray';
import type GraphSearchResults from 'models/ui/common/GraphSearchResults';
import type HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';

export type HierarchicalSearchResult = {
  key: string,
  path: ZenArray<HierarchyItem>,
  items: ZenArray<HierarchyItem>,
};

// while we are processing results, we use this temporary
// HierarchicalSearchResult type which is mutable
type MutableHierarchicalSearchResult = {
  key: string,
  path: Array<HierarchyItem>,
  items: Array<HierarchyItem>,
};

function _concatItemIds(items: Array<HierarchyItem>): string {
  return items.map(item => item.id()).join('-');
}

function _addPathToResults(
  currentPath: Array<HierarchyItem>,
  itemsByPath: { [string]: MutableHierarchicalSearchResult },
): void {
  const pathStr = _concatItemIds(currentPath);
  // eslint-disable-next-line no-param-reassign
  itemsByPath[pathStr] = {
    key: pathStr,
    path: currentPath,
    items: [],
  };
}

function _addItemToPath(
  item: HierarchyItem,
  currentPath: Array<HierarchyItem>,
  itemsByPath: { [string]: MutableHierarchicalSearchResult },
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

function _processSearchResultsHelper(
  items: ZenArray<HierarchyItem>,
  currentPath: Array<HierarchyItem>,
  searchResults: GraphSearchResults<string, string>,
  itemsByPath: { [string]: MutableHierarchicalSearchResult },
): void {
  items.forEach(item => {
    const id = item.id();
    const isLeaf = item.isLeafItem();
    if (isLeaf && searchResults.someLeafMatchesValue(id)) {
      _addItemToPath(item, currentPath, itemsByPath);
    } else if (!isLeaf && searchResults.someParentOrChildMatchesValue(id)) {
      _addPathToResults(currentPath.concat(item), itemsByPath);
      _processSearchResultsHelper(
        item.children(),
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
 * @param {HierarchyItem} hierarchyRoot the root at which we want to start
 * collecting search results
 * @param {GraphSearchResults} searchResults the result of our search
 */
export default function processGraphSearchResults(
  hierarchyRoot: HierarchyItem,
  searchResults: GraphSearchResults<string, string>,
): $ReadOnlyArray<HierarchicalSearchResult> {
  const itemsByPath = {};
  _processSearchResultsHelper(
    hierarchyRoot.children(),
    [hierarchyRoot],
    searchResults,
    itemsByPath,
  );
  const pathStrs = Object.keys(itemsByPath);
  pathStrs.sort(
    (p1, p2) => itemsByPath[p2].items.length - itemsByPath[p1].items.length,
  );

  return pathStrs.map(pathStr => {
    const { key, path, items } = itemsByPath[pathStr];
    return {
      key,
      path: ZenArray.create(path),
      items: ZenArray.create(items),
    };
  });
}
