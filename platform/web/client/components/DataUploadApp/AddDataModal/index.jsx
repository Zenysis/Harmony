// @flow
import * as React from 'react';

import BaseModal from 'components/ui/BaseModal';
import DataUploadService from 'services/DataUploadService';
import I18N from 'lib/I18N';
import Intents from 'components/ui/Intents';
import MappingPage from 'components/DataUploadApp/AddDataModal/MappingPage';
import PreviewPage from 'components/DataUploadApp/AddDataModal/PreviewPage';
import ProgressModal from 'components/ui/ProgressModal';
import UploadPage from 'components/DataUploadApp/AddDataModal/UploadPage';
import useBoolean from 'lib/hooks/useBoolean';
import useDataUploadModalContext, {
  DataUploadModalContext,
  DataUploadModalDispatch,
  buildColumnStructures,
} from 'components/DataUploadApp/AddDataModal/useDataUploadModalContext';
import useSelfServeMutation from 'components/DataUploadApp/AddDataModal/useSelfServeMutation';
import { DATAPREP_TYPE } from 'models/DataUploadApp/types';
import { cancelPromise } from 'util/promiseUtil';
import { relayIdToDatabaseNumberId } from 'util/graphql';
import type Dimension from 'models/core/wip/Dimension';
import type Field from 'models/core/wip/Field';
import type HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import type LinkedCategory from 'models/core/wip/LinkedCategory';
import type { DataUploadModalState } from 'components/DataUploadApp/AddDataModal/useDataUploadModalContext';
import type { DataUploadSource } from 'components/DataUploadApp/SourceTable/ActionCell';
import type { DataprepSetUp_pipelineDatasourceConnection$key } from './UploadPage/DataprepSources/__generated__/DataprepSetUp_pipelineDatasourceConnection.graphql';

type Props = {
  dimensionHierarchyRoot: HierarchyItem<LinkedCategory | Dimension>,
  existingDataUploadSources: $ReadOnlySet<string>,
  fieldHierarchyRoot: HierarchyItem<LinkedCategory | Field>,
  initialSelfServeSource?: DataUploadSource | void,
  onCloseModal: (DataUploadModalState | void) => void,
  pipelineDatasourceRef: DataprepSetUp_pipelineDatasourceConnection$key,
  refetchDataprepJobs: () => void,
};

export default function AddDataModal({
  existingDataUploadSources,
  dimensionHierarchyRoot,
  fieldHierarchyRoot,
  onCloseModal,
  initialSelfServeSource = undefined,
  pipelineDatasourceRef,
  refetchDataprepJobs,
}: Props): React.Node {
  const [dataUploadState, dataUploadDispatch] = useDataUploadModalContext();
  const [loading, startLoading, endLoading] = useBoolean(true);

  React.useEffect(() => {
    startLoading();
    // $SingleInputSourceHack: Will need to figure out how to build the columns
    // for all dataUploadFileSummaries.
    const initialColumnMapping =
      initialSelfServeSource &&
      initialSelfServeSource.dataUploadFileSummaries.length > 0
        ? initialSelfServeSource.dataUploadFileSummaries[0].columnMapping
        : [];
    const statePromise = buildColumnStructures(initialColumnMapping).then(
      ([columnMapping, columnOrder]) => {
        dataUploadDispatch({
          columnMapping,
          columnOrder,
          initialSelfServeSource,
          type: 'INITIALIZE',
        });
        endLoading();
        // Dataprep sources don't show file previews
        let filePreviewPromise;
        if (
          initialSelfServeSource &&
          !initialSelfServeSource.dataprepFlow &&
          initialSelfServeSource.dataUploadFileSummaries.length > 0
        ) {
          filePreviewPromise = DataUploadService.getDataFilePreview(
            initialSelfServeSource.sourceId,
          ).then(filePreview =>
            dataUploadDispatch({ filePreview, type: 'SET_FILE_PREVIEW' }),
          );
        }
        return () => {
          cancelPromise(statePromise);
          cancelPromise(filePreviewPromise);
        };
      },
    );
    // NOTE: Should only run on component mount as initialSelfServeSource will not ever
    // change when the modal is open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [disableUploadButton, setDisableUploadButton] = React.useState<boolean>(
    true,
  );
  const [
    disableCompleteButton,
    setDisableCompleteButton,
  ] = React.useState<boolean>(true);

  // If the self serve source already existed, get the numerical ids for all
  // connected file summary records.
  const initialFileSummaryIds = React.useMemo(
    () =>
      initialSelfServeSource
        ? initialSelfServeSource.dataUploadFileSummaries.map(fileSummary =>
            relayIdToDatabaseNumberId(fileSummary.id),
          )
        : [],
    [initialSelfServeSource],
  );
  // For the updated self serve source object, get the ids for all connected
  // file summary records. For new file summary objects, the id will be
  // undefined.
  const newFileSummaryIds = new Set(
    dataUploadState.fileSummaries
      .values()
      .map(fileSummary => fileSummary.fileSummaryId),
  );
  // File summaries that used to be connected to the self serve source, but
  // no longer are.
  const fileSummariesToUnlink = initialFileSummaryIds.filter(
    summaryId => !newFileSummaryIds.has(summaryId),
  );
  const selfServeCommit = useSelfServeMutation(
    initialSelfServeSource,
    fileSummariesToUnlink,
    dataUploadState,
    refetchDataprepJobs,
  );
  const onSubmit = () => {
    if (!dataUploadState.stateChanged) {
      return;
    }
    selfServeCommit();
  };

  const existingSource = initialSelfServeSource !== undefined;
  const title = existingSource
    ? I18N.text('Update data')
    : I18N.text('Add data');

  const [
    confirmationModalVisible,
    showConfirmationModal,
    hideConfirmationModal,
  ] = useBoolean(false);
  const onRequestClose = (e: SyntheticEvent<>) => {
    // onRequestClose is also triggered when the complete button is clicked.
    if (
      e.currentTarget instanceof HTMLElement &&
      e.currentTarget.textContent === 'Complete setup'
    ) {
      onCloseModal();
    } else if (dataUploadState.stateChanged) {
      showConfirmationModal();
    } else {
      onCloseModal();
    }
  };

  const pages =
    dataUploadState.sourceType === DATAPREP_TYPE
      ? [
          <ProgressModal.Page
            key="Upload"
            disableMainButton={disableUploadButton}
            mainButtonText={I18N.textById('Complete setup')}
            name={I18N.textById('Upload')}
            onMainButtonClick={onSubmit}
          >
            <UploadPage
              existingDataUploadSources={existingDataUploadSources}
              existingSource={existingSource}
              pipelineDatasourceRef={pipelineDatasourceRef}
              setDisableUploadButton={setDisableUploadButton}
            />
          </ProgressModal.Page>,
        ]
      : [
          <ProgressModal.Page
            key="Upload"
            disableMainButton={disableUploadButton}
            mainButtonText={I18N.text('Mapping')}
            name={I18N.text('Upload')}
          >
            <UploadPage
              existingDataUploadSources={existingDataUploadSources}
              existingSource={existingSource}
              pipelineDatasourceRef={pipelineDatasourceRef}
              setDisableUploadButton={setDisableUploadButton}
            />
          </ProgressModal.Page>,
          <ProgressModal.Page
            key="Mapping"
            className="data-upload-modal__mapping-page"
            mainButtonText={I18N.text('Review')}
            name={I18N.textById('Mapping')}
          >
            <MappingPage
              dimensionHierarchyRoot={dimensionHierarchyRoot}
              fieldHierarchyRoot={fieldHierarchyRoot}
              setDisableCompleteButton={setDisableCompleteButton}
            />
          </ProgressModal.Page>,
          <ProgressModal.Page
            key="Review"
            disableMainButton={disableCompleteButton}
            mainButtonText={I18N.text('Complete setup')}
            name={I18N.textById('Review')}
            onMainButtonClick={onSubmit}
          >
            <PreviewPage showErrorMessage={disableCompleteButton} />
          </ProgressModal.Page>,
        ];

  return (
    <>
      <DataUploadModalContext.Provider value={dataUploadState}>
        <DataUploadModalDispatch.Provider value={dataUploadDispatch}>
          <ProgressModal
            childWrapperClassName="data-upload-modal__body"
            className="data-upload-modal"
            height={780}
            onRequestClose={onRequestClose}
            // NOTE: Wait for the useEffect to finish so there isn't a flicker.
            show={!loading}
            title={title}
            width={1096}
          >
            {pages}
          </ProgressModal>
        </DataUploadModalDispatch.Provider>
      </DataUploadModalContext.Provider>
      <BaseModal
        onPrimaryAction={hideConfirmationModal}
        onSecondaryAction={() => onCloseModal(dataUploadState)}
        primaryButtonOutline
        primaryButtonText={I18N.text('Continue Working')}
        secondaryButtonIntent={Intents.DANGER}
        secondaryButtonText={I18N.text('Cancel Setup')}
        shouldCloseOnOverlayClick={false}
        show={confirmationModalVisible}
        showCloseButton={false}
        showSecondaryButton
        showXButton={false}
        title={I18N.text('Cancel Setup?')}
        width="450px"
      >
        <p>
          <I18N id="modalExitConfirmation">
            Any changes you made will be lost once you exit.
          </I18N>
        </p>
      </BaseModal>
    </>
  );
}
