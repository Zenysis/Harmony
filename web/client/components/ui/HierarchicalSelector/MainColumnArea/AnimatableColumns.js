// @flow
import HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import SearchResultColumnData from 'models/ui/HierarchicalSelector/SearchResultColumnData';
import type ZenArray from 'util/ZenModel/ZenArray';

export type AnimatableColumn = HierarchyItem | SearchResultColumnData;

type ColumnsArray = ZenArray<AnimatableColumn>;

/**
 * A collection of helper functions to work with an array of animatable columns
 * columns.
 */
const AnimatableColumns = {
  hasSearchColumn(columns: ColumnsArray): boolean {
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
  getTotalColumnWidth(
    columns: ColumnsArray,
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
  getHierarchicalSelectorWidth(
    hierarchyItems: ZenArray<HierarchyItem>,
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
