// @flow
import * as React from 'react';

import DataUploadService from 'services/DataUploadService';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';
import Moment from 'models/core/wip/DateTime/Moment';
import Table from 'components/ui/Table';
import Toaster from 'components/ui/Toaster';
import { DATAPREP_TYPE } from 'models/DataUploadApp/types';
import { DATE_TIME_FORMAT } from 'components/DataUploadApp/constants';
import {
  DataUploadModalContext,
  DataUploadModalDispatch,
} from 'components/DataUploadApp/AddDataModal/useDataUploadModalContext';
import type { FileSummaryState } from 'components/DataUploadApp/AddDataModal/useDataUploadModalContext';

type Props = {
  modifiable?: boolean,
};

const HEADERS = [
  {
    displayContent: I18N.text('File name'),
    id: 'fileName',
    sortFn: Table.Sort.string(fileSummary => fileSummary.userFileName),
  },
  {
    displayContent: I18N.text('Date uploaded'),
    id: 'dateUploaded',
    sortFn: Table.Sort.moment(
      fileSummary => fileSummary.lastModified || new Moment(),
    ),
  },
  { displayContent: '', id: 'manage' },
].map(header => ({
  ...header,
  headerClassName: 'data-status-table__header-cell',
}));

export default function FileTable({ modifiable = true }: Props): React.Node {
  const { fileSummaries, sourceId, sourceType } = React.useContext(
    DataUploadModalContext,
  );
  const dispatch = React.useContext(DataUploadModalDispatch);

  const onDownloadClick = (fileSummary: FileSummaryState) => () => {
    DataUploadService.downloadInputFile(
      sourceId,
      fileSummary.filePath,
      fileSummary.userFileName,
      sourceType === DATAPREP_TYPE,
    ).catch(() => Toaster.error(I18N.text('Error downloading file')));
  };
  const onDeleteClick = (fileSummary: FileSummaryState) => () =>
    dispatch({
      filePathToDelete: fileSummary.filePath,
      type: 'DELETE_FILE',
    });

  const renderRow = fileSummary => {
    return (
      <Table.Row className="data-status-table__row" id={fileSummary.filePath}>
        <Table.Cell className="data-status-table__cell">
          {fileSummary.userFileName}
        </Table.Cell>
        <Table.Cell className="data-status-table__cell">
          {fileSummary.lastModified
            ? fileSummary.lastModified.format(DATE_TIME_FORMAT)
            : I18N.textById('Pending')}
        </Table.Cell>
        <Table.Cell className="data-status-table__cell">
          <Group.Horizontal
            flex
            itemClassName="data-upload-file-table__icon"
            justifyContent="flex-end"
            marginRight="l"
          >
            {(!modifiable || fileSummary.fileSummaryId) && (
              <Icon
                ariaName={I18N.text('download file')}
                onClick={onDownloadClick(fileSummary)}
                type="svg-download-outline"
              />
            )}
            {modifiable && (
              <Icon
                ariaName={I18N.text('delete file')}
                onClick={onDeleteClick(fileSummary)}
                type="svg-trash-can"
              />
            )}
          </Group.Horizontal>
        </Table.Cell>
      </Table.Row>
    );
  };

  return (
    <Group.Vertical spacing="m">
      <Heading.Small>
        <I18N numberFiles={fileSummaries.size()}>
          Existing Files (%(numberFiles)s)
        </I18N>
      </Heading.Small>
      <Group.Item className="u-info-text">
        <I18N>
          The files that appear below are the current Dataprep inputs. When the
          Dataprep job is run, these files are merged and processed through the
          Dataprep recipe.
        </I18N>
        {modifiable && (
          <I18N>
            You can download the existing input files below to see what format
            new files must adhere to. You may also remove files, which will have
            the effect of removing files from cloud storage.
          </I18N>
        )}
      </Group.Item>
      <Table
        className="data-status-table"
        data={fileSummaries.values()}
        headers={HEADERS}
        initialColumnToSort="dateUploaded"
        noDataText={I18N.text('There are no uploaded input files.')}
        noResultsClassName="data-status-table__no-data-cell"
        renderRow={renderRow}
      />
    </Group.Vertical>
  );
}
