// @flow
import * as React from 'react';
import invariant from 'invariant';

import MatchTextHighlighter from 'components/ui/TextHighlighter/MatchTextHighlighter';
import NullDimensionCell from 'components/visualizations/Table/DimensionTableCell/NullDimensionCell';
import QueryResultGrouping from 'models/core/QueryResultSpec/QueryResultGrouping';
import StringMatcher from 'lib/StringMatcher';
import { TOTAL_DIMENSION_VALUE } from 'models/visualizations/common/constants';
import type { StyleObject } from 'types/jsCore';

type Props = {
  cellData: string | number | null,
  grouping: QueryResultGrouping,
  isGrandTotal: boolean,
  isTotalRow: boolean,
  rawValue: string | number | null,
  searchTextMatcher: StringMatcher | void,
  style: StyleObject | void,
};

function DimensionTableCell({
  cellData,
  grouping,
  isGrandTotal,
  isTotalRow,
  rawValue,
  searchTextMatcher,
  style,
}: Props): React.Node {
  const cellContent = React.useMemo(() => {
    // If this cell's value indicates the row is a Total row,
    // highlight the label.
    // TODO(stephen): Translate.
    if (rawValue === TOTAL_DIMENSION_VALUE) {
      if (isGrandTotal) {
        return 'Total';
      }
      return 'Subtotal';
    }

    if (cellData === null) {
      return (
        <NullDimensionCell
          dimensionLabel={grouping.displayLabel()}
          isTotalRow={isTotalRow}
        />
      );
    }

    const formattedCellData = cellData
      ? grouping.formatGroupingValue(cellData, false)
      : cellData;
    if (searchTextMatcher === undefined || rawValue === null) {
      return formattedCellData;
    }

    invariant(
      typeof formattedCellData === 'string',
      'Dimension values are always returned as strings by the server.',
    );

    return (
      <MatchTextHighlighter
        matcher={searchTextMatcher}
        text={formattedCellData}
      />
    );
  }, [
    cellData,
    grouping,
    isGrandTotal,
    isTotalRow,
    rawValue,
    searchTextMatcher,
  ]);

  return (
    <div className="table-visualization__table-cell" style={style}>
      {cellContent}
    </div>
  );
}

export default (React.memo(DimensionTableCell): React.AbstractComponent<Props>);
