// @flow
import * as React from 'react';
import classNames from 'classnames';

import ElementResizeService from 'services/ui/ElementResizeService';
import Popover from 'components/ui/Popover';
import SortIndicator from 'components/ui/visualizations/Table/internal/SortIndicator';
import useBoolean from 'lib/hooks/useBoolean';
import type {
  ColumnSpec,
  SortState,
} from 'components/ui/visualizations/Table/types';
import type { StyleObject } from 'types/jsCore';

type Props<RowData, ColData> = {
  columns: $ReadOnlyArray<ColumnSpec<RowData, ColData>>,
  containerRef: $ElementRefObject<'div'>,
  fitWidth: boolean,
  maxColumnWidth: number,
  minColumnWidth: number,
  minHeight: number,
  onColumnClick: (dataKey: string, event: MouseEvent) => void,
  onHeightUpdate: number => void,
  sortState: $ReadOnly<SortState>,
  style: StyleObject | void,
  width: number,
  wrapColumnTitles: boolean,

  getHeaderCellStyle?:
    | ((ColumnSpec<RowData, ColData>) => StyleObject | void)
    | void,
};

export default function Header<RowData, ColData>({
  columns,
  containerRef,
  fitWidth,
  getHeaderCellStyle,
  maxColumnWidth,
  minColumnWidth,
  minHeight,
  onColumnClick,
  onHeightUpdate,
  sortState,
  style,
  width,
  wrapColumnTitles,
}: Props<RowData, ColData>): React.Node {
  const firstColumnRef = React.createRef();
  const resizeRegistration = React.useMemo(() => {
    return ElementResizeService.register(
      ({ contentRect }) => onHeightUpdate(contentRect.height),
      elt => {
        // eslint-disable-next-line no-param-reassign
        containerRef.current = elt || null;
      },
    );
  }, [containerRef, onHeightUpdate]);

  const HeaderCell = React.forwardRef(({ columnSpec }, ref) => {
    const { dataKey, label, rotateHeader } = columnSpec;

    const cellRef = React.useRef();
    const [isShowingTooltip, showTooltip, hideTooltip] = useBoolean(false);

    const cellStyle =
      getHeaderCellStyle !== undefined
        ? getHeaderCellStyle(columnSpec)
        : undefined;

    const maxWidth = maxColumnWidth;
    const minWidth = minColumnWidth;
    const showSortIndicator = sortState.sortColumns.includes(dataKey);

    const cellWrapperClassName = classNames(
      'ui-table-visualization-header__cell-wrapper',
      {
        'ui-table-visualization-header__cell-wrapper--vertical': rotateHeader,
      },
    );
    const cellClassName = classNames('ui-table-visualization-header__cell', {
      'ui-table-visualization-header__cell--vertical': rotateHeader,
      'ui-table-visualization-header__cell--sorted': showSortIndicator,
      'ui-table-visualization-header__cell--wrapped': wrapColumnTitles,
    });
    return (
      <div
        className={cellWrapperClassName}
        onClick={e => onColumnClick(dataKey, e)}
        role="columnheader"
        style={!fitWidth ? { maxWidth, minWidth, ...cellStyle } : cellStyle}
        ref={ref}
      >
        <span
          className={cellClassName}
          data-testid="ui-table-viz-header-cell"
          onMouseLeave={hideTooltip}
          onMouseEnter={showTooltip}
          onBlur={hideTooltip}
          onFocus={showTooltip}
          ref={cellRef}
        >
          {label}
        </span>
        {/* NOTE(david): We directly use a Popover rather than using the Tooltip
        component as doing so introduces an extra span element wrapper which
        causes several styling issues. */}
        <Popover
          anchorElt={cellRef.current}
          className="zen-tooltip__popover"
          isOpen={isShowingTooltip}
          blurType={Popover.BlurTypes.DOCUMENT}
        >
          {label}
        </Popover>

        {showSortIndicator && (
          <SortIndicator direction={sortState.sortDirectionMap.get(dataKey)} />
        )}
      </div>
    );
  });

  return (
    <div
      className="ui-table-visualization-header"
      ref={resizeRegistration.setRef}
      style={{ ...style, minHeight, width }}
      data-testid="ui-table-viz-header"
    >
      {columns.map((column, index) => (
        <HeaderCell
          columnSpec={column}
          key={column.dataKey}
          index={index}
          ref={index === 0 ? firstColumnRef : undefined}
        />
      ))}
    </div>
  );
}
