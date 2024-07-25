// @flow
import * as React from 'react';
import { ParentSize } from '@vx/responsive';

import * as Zen from 'lib/Zen';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';
import Table from 'components/ui/visualizations/Table';
import { COLUMN_TYPE_ORDER } from 'models/DataUploadApp/registry';
import { DataUploadModalContext } from 'components/DataUploadApp/AddDataModal/useDataUploadModalContext';
import {
  SORT_DIRECTION,
  mixedValueSort,
} from 'components/ui/visualizations/Table/sorting';
import { sortColumns } from 'components/DataUploadApp/util';
import type ColumnSpec from 'models/DataUploadApp/ColumnSpec';
import type { SortState } from 'components/ui/visualizations/Table/types';
import type { StyleObject } from 'types/jsCore';

const TABLE_HEIGHT = 465;
const TABLE_CELL_STYLE = {
  alignItems: 'center',
  display: 'flex',
  paddingLeft: 8,
  paddingRight: 8,
};

function compareColumnsFunction(
  firstElement: ColumnSpec,
  secondElement: ColumnSpec,
): number {
  // Check type of column for ordering first
  const firstElementOrder = COLUMN_TYPE_ORDER.indexOf(
    firstElement.columnType(),
  );
  const secondElementOrder = COLUMN_TYPE_ORDER.indexOf(
    secondElement.columnType(),
  );
  const typeOrder = firstElementOrder - secondElementOrder;
  if (typeOrder !== 0) {
    return typeOrder;
  }

  // Then alphabetize the columns (note that this is different from the sortColumns)
  // below. This sortColumns sorts the order that the columns appear in the table.
  return sortColumns(firstElement, secondElement);
}

type Props = {
  showErrorMessage: boolean,
};

export default function PreviewPage({ showErrorMessage }: Props): React.Node {
  const { fileSummaries } = React.useContext(DataUploadModalContext);
  // $SingleInputSourceHack: The file being previewed should be passed in
  // or else the file preview should include all input files.
  const { columnMapping, filePreview } = fileSummaries.values()[0];

  const [sortState, setSortState] = React.useState<SortState>({
    // NOTE: This sortColumns is different from the one referenced above.
    // It keeps track of which column will be used to sort the rows in the table.
    sortColumns: Zen.Array.create(),
    sortDirectionMap: Zen.Map.create(),
  });

  const maybeRenderErrorMessage = () => {
    return (
      showErrorMessage && [
        <Group.Item key="icon" className="data-upload-preview-page__error-icon">
          <Icon type="svg-error-outline" />
        </Group.Item>,
        <Group.Item
          key="text"
          className="u-paragraph-text data-upload-preview-page__error-text"
        >
          <I18N>
            There are mapping requirements which must be resolved before
            completing setup
          </I18N>
        </Group.Item>,
      ]
    );
  };

  const columnSpecs = React.useMemo(() => {
    const displayColumns = columnMapping
      .filter(column => !column.ignoreColumn())
      .values();
    const sortedDisplayColumns = [...displayColumns].sort(
      compareColumnsFunction,
    );

    return sortedDisplayColumns.map(column => ({
      cellDataGetter: ({ rowData }) => rowData[column.name()],
      columnData: {},
      dataKey: column.name(),
      label: column.canonicalName(),
    }));
  }, [columnMapping]);

  const getRowCellStyle = (rowData, index: number): StyleObject => {
    return {
      ...TABLE_CELL_STYLE,
      // give odd rows a gray background like in AQT
      backgroundColor: index % 2 === 1 ? '#f0f0f0' : 'white',
    };
  };

  const rows = React.useMemo(() => {
    const { sortColumns: sortColNames, sortDirectionMap } = sortState;
    if (sortColNames.size() === 0) {
      return filePreview;
    }
    const sortColumn = sortColNames.get(0);
    return filePreview.slice().sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      return mixedValueSort(
        aVal,
        bVal,
        sortDirectionMap.get(sortColumn) === SORT_DIRECTION.DESC,
      );
    });
  }, [filePreview, sortState]);

  const table = (
    <ParentSize>
      {({ width }) => (
        <Table
          columnSpecs={columnSpecs}
          enablePagination
          enableSearch={false}
          fitWidth={false}
          getHeaderCellStyle={() => TABLE_CELL_STYLE}
          getRowCellStyle={getRowCellStyle}
          height={TABLE_HEIGHT}
          onSortChange={setSortState}
          rows={rows}
          sortState={sortState}
          width={width}
          wrapColumnTitles
        />
      )}
    </ParentSize>
  );

  return (
    <Group.Vertical spacing="xxs">
      <Heading.Small
        infoTooltip={I18N.text(
          'The rows displayed here are a sample of rows from the uploaded CSV file. They have not gone through any aggregation or dimension matching, so they do not match exactly with what will be displayed in AQT.',
          'previewRowsTooltip',
        )}
      >
        <I18N>Preview</I18N>
      </Heading.Small>
      <Group.Horizontal
        alignItems="center"
        firstItemFlexValue={1}
        flex
        marginBottom="s"
      >
        <Group.Item className="u-caption-text data-upload-preview-page__caption">
          <I18N>Sample of 20 rows from the uploaded file</I18N>
        </Group.Item>
        {maybeRenderErrorMessage()}
      </Group.Horizontal>
      <Group.Item className="data-upload-preview-page__table" padding="m">
        {table}
      </Group.Item>
    </Group.Vertical>
  );
}
