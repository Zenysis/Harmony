// @flow
import HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import HierarchySearchResults from 'models/ui/HierarchicalSelector/HierarchySearchResults';
import { uniqueId } from 'util/util';

const SEARCH_COLUMN_ID = '__search-column__';

type RequiredValues<T> = {
  parentItem: HierarchyItem<T>,
  searchResults: HierarchySearchResults<T>,
};

export default class SearchResultColumnData<T> {
  /** The HierarchyItem under which we searched for results */
  +_parentItem: HierarchyItem<T>;

  /** All search results to show in the column */
  +_searchResults: HierarchySearchResults<T>;

  +_id: string = `${SEARCH_COLUMN_ID}${uniqueId()}`;

  static create<V>(vals: RequiredValues<V>): SearchResultColumnData<V> {
    return new SearchResultColumnData(vals);
  }

  constructor({ parentItem, searchResults }: RequiredValues<T>): void {
    this._parentItem = parentItem;
    this._searchResults = searchResults;
  }

  id(): string {
    return this._id;
  }

  parentItem(): HierarchyItem<T> {
    return this._parentItem;
  }

  searchResults(): HierarchySearchResults<T> {
    return this._searchResults;
  }
}
