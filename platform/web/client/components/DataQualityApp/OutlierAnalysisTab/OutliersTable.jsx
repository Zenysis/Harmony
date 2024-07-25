// @flow
import * as React from 'react';
import { ParentSize } from '@vx/responsive';

import * as Zen from 'lib/Zen';
import DataQualityService from 'services/wip/DataQualityService';
import Dimension from 'models/core/wip/Dimension';
import Field from 'models/core/wip/Field';
import I18N from 'lib/I18N';
import ProgressBar from 'components/ui/ProgressBar';
import StringMatcher from 'lib/StringMatcher';
import Table from 'components/ui/visualizations/Table';
import TableQueryResultData from 'models/visualizations/Table/TableQueryResultData';
import { cancelPromise } from 'util/promiseUtil';
import { round } from 'util/numberUtil';
// TODO: Put this function somewhere sensible so we are not importing
// from an unrelated component
import { sortRowsInplace } from 'components/visualizations/Table';
import type { DataRow } from 'models/visualizations/Table/types';
import type { Filters } from 'components/DataQualityApp/util';
import type { OutlierType } from 'components/DataQualityApp/OutlierAnalysisTab/util';
import type { SortState } from 'components/ui/visualizations/Table/types';

type Props = {
  field: Field,
  filters: Filters,
  geographyGroupBys: $ReadOnlyArray<Dimension>,
  onRowClick: DataRow => void,
  outlierType: OutlierType,
};

const TABLE_HEIGHT = 400;
const TABLE_CELL_STYLE = {
  paddingRight: 8,
};

const VALUE_COLUMN_IDS = {
  NUM_OUTLIERS: 'num_outliers',
  NUM_VALUES: 'num_values',
  PERCENTAGE_OUTLIERS: 'percentage_outliers',
};

const VALUE_COLUMN_SPECS = [
  {
    cellDataGetter: ({ rowData }) => rowData[VALUE_COLUMN_IDS.NUM_VALUES],
    columnData: {},
    dataKey: VALUE_COLUMN_IDS.NUM_VALUES,
    label: I18N.text('# All Reports'),
  },
  {
    cellDataGetter: ({ rowData }) => rowData[VALUE_COLUMN_IDS.NUM_OUTLIERS],
    columnData: {},
    dataKey: VALUE_COLUMN_IDS.NUM_OUTLIERS,
    label: I18N.text('# Outlier Reports'),
  },
  {
    cellDataGetter: ({ rowData }) => {
      const rawValue = rowData[VALUE_COLUMN_IDS.PERCENTAGE_OUTLIERS];
      return typeof rawValue === 'number' ? `${round(rawValue, 2)}%` : rawValue;
    },
    columnData: {},
    dataKey: VALUE_COLUMN_IDS.PERCENTAGE_OUTLIERS,
    label: I18N.text('%% Outlier Reports'),
  },
];

function OutliersTable({
  field,
  filters,
  geographyGroupBys,
  onRowClick,
  outlierType,
}: Props) {
  const [queryResult, setQueryResult] = React.useState<TableQueryResultData>(
    TableQueryResultData.create({}),
  );

  const [loading, setLoading] = React.useState<boolean>(true);

  const [sortState, setSortState] = React.useState<SortState>({
    sortColumns: Zen.Array.create(),
    sortDirectionMap: Zen.Map.create(),
  });

  const [searchText, setSearchText] = React.useState<string>('');

  // Run query
  React.useEffect(() => {
    setLoading(true);
    const queryPromise = DataQualityService.getOutliersTable(
      field,
      geographyGroupBys,
      filters,
      outlierType,
    ).then(result => {
      setQueryResult(result);
      setLoading(false);
    });
    return () => cancelPromise(queryPromise);
  }, [field, filters, geographyGroupBys, outlierType]);

  const columnSpecs = React.useMemo(() => {
    const dimensionColumns = geographyGroupBys.map(dimension => ({
      cellDataGetter: ({ rowData }) => rowData[dimension.id()],
      columnData: {},
      dataKey: dimension.id(),
      label: dimension.name(),
    }));
    return [...dimensionColumns, ...VALUE_COLUMN_SPECS];
  }, [geographyGroupBys]);

  const rows = React.useMemo(() => {
    const matcher = new StringMatcher([searchText]);

    const filteredRows =
      searchText === ''
        ? queryResult.data().slice()
        : queryResult.data().filter(row =>
            queryResult.dimensions().some(dimensionId => {
              const dimensionValue = row[dimensionId];
              return (
                typeof dimensionValue === 'string' &&
                dimensionValue.length > 0 &&
                matcher.matchesSome(dimensionValue)
              );
            }),
          );

    return sortRowsInplace(
      filteredRows,
      sortState.sortColumns,
      sortState.sortDirectionMap,
      queryResult.dimensions(),
    );
  }, [queryResult, searchText, sortState]);

  if (loading) {
    return (
      <div className="dq-viz-container__progress-bar-wrapper">
        <ProgressBar />
      </div>
    );
  }

  return (
    <ParentSize>
      {({ width }) => (
        <Table
          columnSpecs={columnSpecs}
          enablePagination
          getHeaderCellStyle={() => TABLE_CELL_STYLE}
          getRowCellStyle={() => TABLE_CELL_STYLE}
          height={TABLE_HEIGHT}
          onRowClick={onRowClick}
          onSearchTextChange={setSearchText}
          onSortChange={setSortState}
          rows={rows}
          sortState={sortState}
          width={width}
          wrapColumnTitles
        />
      )}
    </ParentSize>
  );
}

export default (React.memo(OutliersTable): React.AbstractComponent<Props>);
