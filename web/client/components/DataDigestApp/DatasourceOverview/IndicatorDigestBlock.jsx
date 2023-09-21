// @flow
import * as React from 'react';

import Alert from 'components/ui/Alert';
import AnimateHeight from 'components/ui/AnimateHeight';
import DatasourceDigest from 'models/DataDigestApp/DatasourceDigest';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import Icon from 'components/ui/Icon';
import InputText from 'components/ui/InputText';
import LoadingSpinner from 'components/ui/LoadingSpinner';
import Table from 'components/ui/Table';
import Tooltip from 'components/ui/Tooltip';
import useIndicatorDigestData from 'components/DataDigestApp/DatasourceOverview/useIndicatorDigestData';
import useToggleBoolean from 'lib/hooks/useToggleBoolean';
import useXLSDownload from 'components/DataDigestApp/useXLSDownload';
import type { ExportDataRow } from 'util/export';
import type { FieldSummary } from 'models/DataDigestApp/IndicatorDigestData';

type Props = {
  digest: DatasourceDigest | void,
};

const READABLE_DATE_FORMAT = 'MMM D, YYYY';

const TABLE_HEADERS = [
  {
    displayContent: 'Field Name',
    id: 'fieldName',
    searchable: fieldSummary => fieldSummary.fieldName,
    sortFn: Table.Sort.string(fieldSummary => fieldSummary.fieldName),
  },
  {
    displayContent: 'Field Id',
    id: 'fieldId',
    searchable: fieldSummary => fieldSummary.fieldId,
    sortFn: Table.Sort.string(fieldSummary => fieldSummary.fieldId),
  },
  {
    displayContent: 'Datapoints Integrated',
    id: 'count',
    searchable: fieldSummary => String(fieldSummary.count),
    sortFn: Table.Sort.number(fieldSummary => fieldSummary.count),
  },
  {
    displayContent: 'Start Date',
    id: 'startDate',
    searchable: fieldSummary =>
      fieldSummary.startDate.format(READABLE_DATE_FORMAT),
    sortFn: Table.Sort.moment(fieldSummary => fieldSummary.startDate),
  },
  {
    displayContent: 'End Date',
    id: 'endDate',
    searchable: fieldSummary =>
      fieldSummary.endDate.format(READABLE_DATE_FORMAT),
    sortFn: Table.Sort.moment(fieldSummary => fieldSummary.endDate),
  },
];

const CSV_HEADERS = ['fieldId', 'count', 'startDate', 'endDate'];
const CSV_DATE_FORMAT = 'YYYY-MM-DD';

function fieldSummaryToExportableRow(
  fieldSummary: FieldSummary,
): ExportDataRow {
  return {
    count: fieldSummary.count,
    endDate: fieldSummary.endDate.format(CSV_DATE_FORMAT),
    fieldId: fieldSummary.fieldId,
    startDate: fieldSummary.startDate.format(CSV_DATE_FORMAT),
  };
}

export default function IndicatorDigestBlock({ digest }: Props): React.Node {
  const [indicatorDigestData, isLoadingIndicatorData] = useIndicatorDigestData(
    digest,
  );
  const [showTable, toggleShowTable] = useToggleBoolean(true);

  const downloadDataFn = useXLSDownload(
    CSV_HEADERS,
    fieldSummaryToExportableRow,
  );

  const [searchText, setSearchText] = React.useState('');

  const renderTableRow = React.useCallback(
    fieldSummary => (
      <Table.Row id={fieldSummary.fieldId}>
        <Table.Cell>{fieldSummary.fieldName}</Table.Cell>
        <Table.Cell>{fieldSummary.fieldId}</Table.Cell>
        <Table.Cell>{fieldSummary.count.toLocaleString()}</Table.Cell>
        <Table.Cell>
          {fieldSummary.startDate.format(READABLE_DATE_FORMAT)}
        </Table.Cell>
        <Table.Cell>
          {fieldSummary.endDate.format(READABLE_DATE_FORMAT)}
        </Table.Cell>
      </Table.Row>
    ),
    [],
  );

  const renderTable = () => {
    if (isLoadingIndicatorData) {
      return <LoadingSpinner />;
    }

    if (!indicatorDigestData) {
      return (
        <Alert
          intent="error"
          title={
            <p>
              <b>No indicator digest found</b>
            </p>
          }
        >
          <p>
            This datasource does not have an indicator digest report generated
            by the pipeline.
          </p>
        </Alert>
      );
    }

    return (
      <div className="dd-table-container">
        <Table
          className="dd-table-container__table"
          data={indicatorDigestData.fieldSummaries()}
          headers={TABLE_HEADERS}
          initialColumnToSort="fieldId"
          pageSize={10}
          renderRow={renderTableRow}
          searchText={searchText}
        />
      </div>
    );
  };

  return (
    <Group.Vertical spacing="l">
      <Group.Horizontal alignItems="center" flex>
        <Icon
          onClick={toggleShowTable}
          type={showTable ? 'svg-caret-down' : 'svg-caret-right'}
        />
        <Heading.Medium>Indicator summaries</Heading.Medium>
      </Group.Horizontal>
      <AnimateHeight height={showTable ? 'auto' : 0}>
        <Group.Horizontal>
          <InputText
            icon="search"
            onChange={setSearchText}
            placeholder="Search table"
            value={searchText}
          />
          <Tooltip content="Download indicator summaries to Excel">
            <Icon
              ariaName="download indicator summaries"
              onClick={() =>
                downloadDataFn(
                  'Indicator summaries',
                  indicatorDigestData
                    ? indicatorDigestData.fieldSummaries()
                    : [],
                )
              }
              type="download-alt"
            />
          </Tooltip>
        </Group.Horizontal>
        <p>
          These are all the indicators that were integrated into the platform.
        </p>
        {renderTable()}
      </AnimateHeight>
    </Group.Vertical>
  );
}
