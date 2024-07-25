// @flow
import * as React from 'react';
import { FixedSizeList } from 'react-window';

import Header from 'components/ui/visualizations/Table/internal/Header';
import useElementSize from 'lib/hooks/useElementSize';
import useMergedRef from 'lib/hooks/useMergedRef';
import useSynchronousHorizontalScrolling from 'components/ui/visualizations/Table/internal/Columns/useSynchronousHorizontalScrolling';
import type {
  ColumnSpec,
  SortState,
} from 'components/ui/visualizations/Table/types';
import type { StyleObject } from 'types/jsCore';

type Props<RowData, ColData> = {
  bodyHeight?: number,
  columnSpecs: $ReadOnlyArray<ColumnSpec<RowData, ColData>>,
  enablePagination: boolean,
  fitWidth: boolean,
  getHeaderCellStyle:
    | ((ColumnSpec<RowData, ColData>) => StyleObject | void)
    | void,
  headerRowStyle: StyleObject | void,
  maxColumnWidth: number,
  minColumnWidth: number,
  minHeaderHeight: number,
  onHeaderHeightUpdate: number => void,
  onScrollbarHeightUpdate: number => void,
  onSortClick: (sortBy: string, event: MouseEvent) => void,
  renderTableRow: ({ index: number, style: StyleObject }) => React.Node,
  rowHeight: number,
  scrollbarHeight: number,
  sortState: $ReadOnly<SortState>,
  visibleRowCount: number,
  width: number,
  wrapColumnTitles: boolean,
};

/**
 * A component to render a series of table columns including both the header and
 * rows for those columns.
 */
export default function Columns<RowData, ColData>({
  bodyHeight,
  columnSpecs,
  enablePagination,
  fitWidth,
  getHeaderCellStyle,
  headerRowStyle,
  maxColumnWidth,
  minColumnWidth,
  minHeaderHeight,
  onHeaderHeightUpdate,
  onScrollbarHeightUpdate,
  onSortClick,
  renderTableRow,
  rowHeight,
  scrollbarHeight,
  sortState,
  visibleRowCount,
  width,
  wrapColumnTitles,
}: Props<RowData, ColData>): React.Node {
  const bodyScrollingRef = React.useRef(null);
  const headerRef = React.useRef(null);

  // NOTE: We need to keep track fo the table body dimensions to make
  // sure that we account the space taken up by scorllbars in both directions.
  // We need to account for a vertical scrollbar in setting the header width and
  // a horizontal scrollbar in setting the body height and page size.
  const [
    { height: bodyClientHeight, width: bodyWidth },
    bodyWidthRef,
  ] = useElementSize();

  const bodyRef = useMergedRef([bodyScrollingRef, bodyWidthRef]);
  useSynchronousHorizontalScrolling(headerRef, bodyRef);

  React.useEffect(() => {
    if (fitWidth) {
      // There should never be a horizontal scrollbar in fitWidth mode.
      onScrollbarHeightUpdate(0);
    } else {
      const newScrollbarHeight = bodyRef.current
        ? Math.max(
            bodyRef.current.offsetHeight - Math.round(bodyClientHeight),
            0,
          )
        : 0;
      onScrollbarHeightUpdate(newScrollbarHeight);
    }
  }, [bodyClientHeight, bodyRef, onScrollbarHeightUpdate, fitWidth]);

  const getTableOverflowStyle = () => {
    if (enablePagination) {
      // not scrollable vertically
      return { overflowX: !fitWidth ? 'auto' : 'hidden', overflowY: 'auto' };
    }

    // enable vertical scroll
    return !fitWidth
      ? { overflowX: 'visible', overflowY: 'auto' }
      : { overflowX: 'hidden', overflowY: 'auto' };
  };

  const height = Math.min(
    bodyHeight || Infinity,
    rowHeight * visibleRowCount + scrollbarHeight,
  );

  return (
    <>
      <Header
        columns={columnSpecs}
        containerRef={headerRef}
        fitWidth={fitWidth}
        getHeaderCellStyle={getHeaderCellStyle}
        maxColumnWidth={maxColumnWidth}
        minColumnWidth={minColumnWidth}
        minHeight={minHeaderHeight}
        onColumnClick={onSortClick}
        onHeightUpdate={onHeaderHeightUpdate}
        sortState={sortState}
        style={headerRowStyle}
        width={bodyWidth}
        wrapColumnTitles={wrapColumnTitles}
      />
      <FixedSizeList
        className="ui-table-visualization__react-window-list"
        height={height}
        itemCount={visibleRowCount}
        itemSize={rowHeight}
        outerRef={bodyRef}
        style={{
          ...getTableOverflowStyle(),
          willChange: undefined,
        }}
        width={width}
      >
        {renderTableRow}
      </FixedSizeList>
    </>
  );
}
