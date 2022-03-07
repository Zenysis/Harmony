// @flow
import * as Zen from 'lib/Zen';
import HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import SearchResultColumnData from 'models/ui/HierarchicalSelector/SearchResultColumnData';
import type { NamedItem } from 'models/ui/HierarchicalSelector/types';

export type AnimatableColumn<T: NamedItem> =
  | HierarchyItem<T>
  | SearchResultColumnData<T>;

type ColumnsArray<T> = Zen.Array<AnimatableColumn<T>>;

/**
 * A collection of helper functions to work with an array of animatable columns
 * columns.
 */
const AnimatableColumns = {
  hasSearchColumn<T: NamedItem>(columns: ColumnsArray<T>): boolean {
    return columns.some(c => c instanceof SearchResultColumnData);
  },

  getSearchColumnWidth(columnWidth: number, maxWidth: number): number {
    return Math.max(maxWidth, columnWidth);
  },

  /**
   * Get the total width of an array of columns. This width is adjusted
   * depending on whether or not there is a search result column.
   * This is the width that would be rendered if we never clamped the
   * hierarchical selector with a maxWidth.
   */
  getTotalColumnWidth<T: NamedItem>(
    columns: ColumnsArray<T>,
    hasSearchResults: boolean,
    columnWidth: number,
    maxWidth: number,
  ): number {
    const numColumns = columns.size();
    const searchColWidth = AnimatableColumns.getSearchColumnWidth(
      columnWidth,
      maxWidth,
    );
    return hasSearchResults
      ? (numColumns - 1) * columnWidth + searchColWidth
      : numColumns * columnWidth;
  },

  /**
   * Get the total width of the hierarchical selector. This is the full width
   * of all columns (adjusted depending on if there's a search result column),
   * clamped by the max width.
   */
  getHierarchicalSelectorWidth<T: NamedItem>(
    hierarchyItems: Zen.Array<HierarchyItem<T>>,
    hasSearchResults: boolean,
    columnWidth: number,
    maxWidth: number,
  ): number {
    const fullWidth = AnimatableColumns.getTotalColumnWidth(
      hierarchyItems,
      hasSearchResults,
      columnWidth,
      maxWidth,
    );
    return Math.min(fullWidth, maxWidth);
  },
};

export default AnimatableColumns;
