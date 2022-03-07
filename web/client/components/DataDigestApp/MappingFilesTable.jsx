// @flow
import * as React from 'react';

import Card from 'components/ui/Card';
import Group from 'components/ui/Group';
import MappingFileSummaryModal from 'components/DataDigestApp/MappingFileSummaryModal';
import ProgressBar from 'components/ui/ProgressBar';
import Table from 'components/ui/Table';
import useToggleBoolean from 'lib/hooks/useToggleBoolean';
import { uuid } from 'util/util';

type Props = {
  /** A digest file is an array of rows, where each cell is a string */
  digestFile: $ReadOnlyArray<$ReadOnlyArray<string>>,
};

export default function MappingFilesTable({ digestFile }: Props): React.Node {
  const isLoading = digestFile.length === 0;

  const [
    showMappingFileSummaryModal,
    toggleShowMappingFileSummaryModal,
  ] = useToggleBoolean(false);

  const { digestData, tableHeader } = React.useMemo(() => {
    if (isLoading) {
      return { digestData: [], tableHeader: [] };
    }

    const [headerRow, ...otherRows] = digestFile;
    return {
      digestData: otherRows,
      tableHeader: headerRow.map(headerItem => ({
        displayContent: headerItem,
        id: headerItem,
      })),
    };
  }, [digestFile, isLoading]);

  const renderMappingFilesTableRow = React.useCallback(
    (digestRow: $ReadOnlyArray<string>) => {
      const tableCells = digestRow.map((cell, i) => (
        <Table.Cell key={tableHeader[i].id}>{cell}</Table.Cell>
      ));
      return <Table.Row id={uuid()}>{tableCells}</Table.Row>;
    },
    [tableHeader],
  );

  if (isLoading) {
    return <ProgressBar />;
  }

  let initialColumnToSort;
  if (tableHeader.length > 0) {
    initialColumnToSort = tableHeader[0].id;
  }

  const cardTitle = (
    <Group.Horizontal spacing="xs">
      <div>This table represents the data for the selected mapping file.</div>
      <div
        className="mapping-info-button"
        onClick={toggleShowMappingFileSummaryModal}
        role="button"
      >
        Learn more about the standard mapping file CSV structure.
      </div>
    </Group.Horizontal>
  );

  return (
    <Card title={cardTitle}>
      <MappingFileSummaryModal
        onRequestClose={toggleShowMappingFileSummaryModal}
        showModal={showMappingFileSummaryModal}
      />
      <Table
        data={digestData}
        headers={tableHeader}
        initialColumnToSort={initialColumnToSort}
        pageSize={20}
        renderRow={renderMappingFilesTableRow}
      />
    </Card>
  );
}
