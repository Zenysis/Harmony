// @flow
import * as React from 'react';
import invariant from 'invariant';

import I18N from 'lib/I18N';
import MatchTextHighlighter from 'components/ui/TextHighlighter/MatchTextHighlighter';
import NullDimensionCell from 'components/visualizations/Table/DimensionTableCell/NullDimensionCell';
import QueryResultGrouping from 'models/core/QueryResultSpec/QueryResultGrouping';
import StringMatcher from 'lib/StringMatcher';
import { TOTAL_DIMENSION_VALUE } from 'models/visualizations/common/constants';
import type { StyleObject } from 'types/jsCore';

type Props = {
  cellData: string | number | null,
  grouping: QueryResultGrouping | void,
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
    // NOTE: If this cell's value indicates the row is a Total row,
    // highlight the label.
    // TODO: This isn't the worst hack and might be kept in when we
    // support totals for real with AQT.
    // $CycloneIdaiHack
    if (rawValue === TOTAL_DIMENSION_VALUE) {
      if (isGrandTotal) {
        return I18N.textById('Total');
      }
      return I18N.text('Subtotal');
    }

    if (cellData === null) {
      return (
        <NullDimensionCell
          dimensionLabel={grouping ? grouping.displayLabel() : ''}
          isTotalRow={isTotalRow}
        />
      );
    }

    const groupingCellData = grouping
      ? grouping.formatGroupingValue(cellData, false)
      : cellData;

    const formattedCellData = cellData ? groupingCellData : cellData;

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
