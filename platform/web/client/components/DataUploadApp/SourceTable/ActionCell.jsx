// @flow
// NOTE: A helper function accesses the `dataprepJobs` field.
/* eslint-disable relay/unused-fields */
import * as React from 'react';
import classNames from 'classnames';
import { useFragment } from 'react-relay/hooks';

import Button from 'components/ui/Button';
import DestructiveActionModal from 'components/common/DestructiveActionModal';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';
import Moment from 'models/core/wip/DateTime/Moment';
import useBoolean from 'lib/hooks/useBoolean';
import useDeleteSourceMutation from 'components/DataUploadApp/SourceTable/useDeleteSourceMutation';
import {
  DATE_TIME_FORMAT,
  FAILED_DATAPREP_STATUSES,
  RUNNING_DATAPREP_STATUSES,
} from 'components/DataUploadApp/constants';
import { getDataprepJobLink } from 'components/DataUploadApp/util';
import { relayIdToDatabaseNumberId } from 'util/graphql/hasura';
import type {
  ActionCell_selfServeSource,
  ActionCell_selfServeSource$key,
} from './__generated__/ActionCell_selfServeSource.graphql';

// NOTE: Exporting the type from this file rather than the models file,
// so it can be colocated with the fragment it's using. Importing from generated
// graphql fragments in other files can lead to bugs if the name changes, but
// the import isn't updated.
// eslint-disable-next-line camelcase
export type DataUploadSource = ActionCell_selfServeSource;

type Props = {
  actionCellRef: ActionCell_selfServeSource$key,
  buildOnOpenModal: DataUploadSource => () => void,
  isSelfServeAdmin: boolean,
  queuedStatus: boolean,
  updateFailed: boolean,
};

export default function ActionCell({
  actionCellRef,
  buildOnOpenModal,
  isSelfServeAdmin = false,
  queuedStatus,
  updateFailed,
}: Props): React.Node {
  const [
    deleteConfirmationVisible,
    showDeleteConfirmation,
    hideDeleteConfirmation,
  ] = useBoolean(false);
  const deleteSourceCommit = useDeleteSourceMutation();

  const source = useFragment(
    graphql`
      fragment ActionCell_selfServeSource on self_serve_source {
        id
        sourceId: source_id
        pipelineDatasource: pipeline_datasource {
          name
        }
        latestFileSummary: data_upload_file_summaries(
          order_by: { last_modified: desc }
          limit: 1
        ) {
          lastModified: last_modified
        }
        sourceLastModified: last_modified
        dataUploadFileSummaries: data_upload_file_summaries {
          id
          filePath: file_path
          userFileName: user_file_name
          columnMapping: column_mapping
          lastModified: last_modified
        }
        dataprepFlow: dataprep_flow {
          id
          appendable
          expectedColumns: expected_columns
          dataprepJobs: dataprep_jobs(limit: 1, order_by: { created: desc }) {
            jobId: job_id
            status
          }
          recipeId: recipe_id
        }
      }
    `,
    actionCellRef,
  );
  const {
    dataprepFlow,
    id,
    latestFileSummary,
    pipelineDatasource,
    sourceId,
    sourceLastModified,
  } = source;

  const getPillText = (): string | void => {
    if (dataprepFlow) {
      const dataprepJob = dataprepFlow.dataprepJobs[0];
      if (dataprepJob !== undefined) {
        if (FAILED_DATAPREP_STATUSES.has(dataprepJob.status)) {
          return I18N.text('dataprep failed');
        }
        if (RUNNING_DATAPREP_STATUSES.has(dataprepJob.status)) {
          return I18N.text('dataprep running');
        }
      }
    }

    if (queuedStatus) {
      return I18N.text('queued');
    }
    if (updateFailed) {
      return I18N.text('update failed');
    }
    return undefined;
  };

  const renderActionContent = () => {
    const pillText = getPillText();
    const onOpenModal = buildOnOpenModal(source);

    // If there's no pill text it means the source is neither queued nor failed
    if (!pillText) {
      return (
        <Button intent={Button.Intents.PRIMARY} minimal onClick={onOpenModal}>
          {I18N.text('Update Data')}
        </Button>
      );
    }

    const pillClassNames = classNames('u-caption-text', {
      'data-status-table__queued-pill': queuedStatus,
      'data-status-table__update-failed-pill': updateFailed,
    });
    // The graphQL query just fetches a single file summary with the latest last modified date.
    // The latest file summary should always be defined unless the database is in a bad state.
    // But since the foreign keys do not require the latest file summary be populated, falling
    // back to the source last modified guards against the bad state.
    const lastModified = Moment.utc(
      latestFileSummary.length > 0
        ? latestFileSummary[0].lastModified
        : sourceLastModified,
    )
      .local()
      .format(DATE_TIME_FORMAT);
    return (
      <Group.Vertical spacing="none">
        <Group.Item className={pillClassNames} marginBottom="xs">
          {pillText}
        </Group.Item>
        {lastModified}
        <Group.Item className="u-caption-text" marginBottom="s">
          {I18N.text('Date of submission')}
        </Group.Item>
        <Group.Horizontal spacing="s">
          <div
            className="data-status-table__action-link"
            onClick={onOpenModal}
            role="button"
          >
            {I18N.text('Edit setup')}
          </div>
          {isSelfServeAdmin &&
            dataprepFlow?.dataprepJobs &&
            dataprepFlow?.dataprepJobs.length > 0 &&
            // Can't create a job link for a null job id
            dataprepFlow?.dataprepJobs[0].jobId && (
              <a
                className="data-status-table__action-link"
                href={getDataprepJobLink(
                  dataprepFlow.dataprepJobs[0].jobId,
                  '',
                )}
                rel="noreferrer noopener"
                target="_blank"
              >
                {I18N.text('See job')}
              </a>
            )}
        </Group.Horizontal>
      </Group.Vertical>
    );
  };

  const onDeleteSource = () => {
    hideDeleteConfirmation();
    deleteSourceCommit(
      relayIdToDatabaseNumberId(id),
      sourceId,
      dataprepFlow ? relayIdToDatabaseNumberId(dataprepFlow.id) : undefined,
    );
  };
  const warningText = dataprepFlow
    ? I18N.text(
        "By deleting source '%(sourceName)s', the source will be removed from Data Upload. The data will remain in the platform.",
        'deleteDataprepSourceConfirmation',
        { sourceName: pipelineDatasource.name },
      )
    : I18N.text(
        "By deleting source '%(sourceName)s', the data will disappear from the platform. This action cannot be undone. If the data has already been integrated, it will be removed when the pipeline next runs.",
        'deleteCSVSourceConfirmation',
        { sourceName: pipelineDatasource.name },
      );

  return (
    <React.Fragment>
      <Group.Horizontal alignItems="center" firstItemFlexValue={1} flex>
        {renderActionContent()}

        {isSelfServeAdmin && (
          <Group.Item
            className="data-status-table__delete-icon"
            marginRight="m"
          >
            <Icon
              ariaName={I18N.text('delete source')}
              onClick={showDeleteConfirmation}
              type="svg-trash-can"
            />
          </Group.Item>
        )}
      </Group.Horizontal>
      <DestructiveActionModal
        onActionAcknowledged={onDeleteSource}
        onActionCancelled={hideDeleteConfirmation}
        show={deleteConfirmationVisible}
        warningText={warningText}
      />
    </React.Fragment>
  );
}
