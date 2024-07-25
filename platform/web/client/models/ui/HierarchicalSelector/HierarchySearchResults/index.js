// @flow
import * as Zen from 'lib/Zen';
import GraphSearchResults from 'models/ui/common/GraphSearchResults';
import HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import HierarchyItemGraphNodeView from 'models/ui/HierarchicalSelector/HierarchyItemGraphNodeView';
import memoizeOne from 'decorators/memoizeOne';
import processGraphSearchResults from 'models/ui/HierarchicalSelector/HierarchySearchResults/processGraphSearchResults';
import type { HierarchicalSearchResult } from 'models/ui/HierarchicalSelector/HierarchySearchResults/processGraphSearchResults';
import type { NamedItem } from 'models/ui/HierarchicalSelector/types';

type Values<T> = {
  graphSearchResults: GraphSearchResults<string, string>,
  searchRoot: HierarchyItem<T>,
};

export default class HierarchySearchResults<T: NamedItem> {
  +_graphSearchResults: GraphSearchResults<string, string>;
  +_searchRoot: HierarchyItem<T>;
  static create<V: NamedItem>(vals: Values<V>): HierarchySearchResults<V> {
    return new HierarchySearchResults(vals);
  }

  static fromSearchText<V: NamedItem>(
    searchText: string,
    searchRoot: HierarchyItem<V>,
  ): HierarchySearchResults<V> {
    const graphSearchResults = GraphSearchResults.fromSearchText(
      HierarchyItemGraphNodeView,
      searchText,
      searchRoot.children() || Zen.Array.create([]),
    );

    return HierarchySearchResults.create({
      graphSearchResults,
      searchRoot,
    });
  }

  constructor({ graphSearchResults, searchRoot }: Values<T>): void {
    this._graphSearchResults = graphSearchResults;
    this._searchRoot = searchRoot;
  }

  graphSearchResults(): GraphSearchResults<string, string> {
    return this._graphSearchResults;
  }

  searchRoot(): HierarchyItem<T> {
    return this._searchRoot;
  }

  @memoizeOne
  resultList(): $ReadOnlyArray<HierarchicalSearchResult<T>> {
    return processGraphSearchResults(
      this.searchRoot(),
      this.graphSearchResults(),
    );
  }
}
