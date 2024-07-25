// @flow
import * as React from 'react';

import DataprepInputValidationFailure from 'components/DataUploadApp/AddDataModal/UploadPage/DataprepSources/DataprepInputValidationFailure';
import DataprepSetUp from 'components/DataUploadApp/AddDataModal/UploadPage/DataprepSources/DataprepSetUp';
import FileTable from 'components/DataUploadApp/AddDataModal/UploadPage/DataprepSources/FileTable';
import FileUploadBlock from 'components/DataUploadApp/AddDataModal/UploadPage/FileUploadBlock';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import I18N from 'lib/I18N';
import LabelWrapper from 'components/ui/LabelWrapper';
import RadioGroup from 'components/ui/RadioGroup';
import SourceName from 'components/DataUploadApp/AddDataModal/UploadPage/SourceName';
import { CSV_TYPE, DATAPREP_TYPE } from 'models/DataUploadApp/types';
import {
  DataUploadModalContext,
  DataUploadModalDispatch,
} from 'components/DataUploadApp/AddDataModal/useDataUploadModalContext';
import { getFileExtension } from 'components/DataUploadApp/util';
import type { DataUploadSourceType } from 'models/DataUploadApp/types';
import type { DataprepSetUp_pipelineDatasourceConnection$key } from './DataprepSources/__generated__/DataprepSetUp_pipelineDatasourceConnection.graphql';

type Props = {
  existingDataUploadSources: $ReadOnlySet<string>,
  existingSource: boolean,
  pipelineDatasourceRef: DataprepSetUp_pipelineDatasourceConnection$key,
  setDisableUploadButton: boolean => void,
};

export default function UploadPage({
  existingDataUploadSources,
  existingSource,
  pipelineDatasourceRef,
  setDisableUploadButton,
}: Props): React.Node {
  const {
    allowMultipleFiles,
    dataprepFileValidator,
    fileSummaries,
    sourceName,
    sourceType,
  } = React.useContext(DataUploadModalContext);
  const dispatch = React.useContext(DataUploadModalDispatch);

  React.useEffect(() => {
    const alwaysDisableUploadButton = fileSummaries.size() === 0 || !sourceName;
    switch (sourceType) {
      case CSV_TYPE:
        setDisableUploadButton(alwaysDisableUploadButton);
        break;
      case DATAPREP_TYPE:
        setDisableUploadButton(
          alwaysDisableUploadButton || !dataprepFileValidator.fileValid(),
        );
        break;
      default:
        break;
    }
  }, [
    dataprepFileValidator,
    fileSummaries,
    setDisableUploadButton,
    sourceName,
    sourceType,
  ]);

  // TODO: Move this into the context once there's separate types for
  // dataprep and CSV sources.
  // We need to store the file extension on page load since it's needed when
  // the file has been removed and can no longer be determined. This is only
  // necessary for datapreps. Use a default value of csv so the type can be
  // always defined.
  const [fileExtension, setFileExtension] = React.useState<string>('.csv');
  React.useEffect(() => {
    if (sourceType === DATAPREP_TYPE && fileSummaries.size() > 0) {
      // All file summaries will have the same extension, so take the first.
      const { userFileName } = fileSummaries.values()[0];
      setFileExtension(getFileExtension(userFileName));
    }
    // Only run once on page load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSourceTypeChange = (newSourceType: DataUploadSourceType) => {
    dispatch({ sourceType: newSourceType, type: 'SOURCE_TYPE_CHANGE' });
  };

  const onSourceNameChange = (newSourceName: string) => {
    dispatch({ sourceName: newSourceName, type: 'SOURCE_NAME_CHANGE' });
  };

  const maybeRenderTypeToggle = () => {
    if (existingSource) {
      return null;
    }

    return (
      <LabelWrapper
        label={
          <Heading.Small>
            <I18N>Data Source Type</I18N>
          </Heading.Small>
        }
      >
        <RadioGroup onChange={onSourceTypeChange} value={sourceType}>
          <RadioGroup.Item
            className="data-upload-upload-page__source-toggle"
            value={CSV_TYPE}
          >
            <I18N>CSV Source</I18N>
          </RadioGroup.Item>
          <RadioGroup.Item
            className="data-upload-upload-page__source-toggle"
            value={DATAPREP_TYPE}
          >
            <I18N>Dataprep Source</I18N>
          </RadioGroup.Item>
        </RadioGroup>
      </LabelWrapper>
    );
  };

  const dataprepSetUp = !existingSource && sourceType === DATAPREP_TYPE;

  const renderContent = () => {
    if (dataprepSetUp) {
      return (
        <DataprepSetUp
          existingDataUploadSources={existingDataUploadSources}
          onSourceNameChange={onSourceNameChange}
          pipelineDatasourceRef={pipelineDatasourceRef}
          setDisableUploadButton={setDisableUploadButton}
        />
      );
    }

    // Will only ever apply to datapreps
    if (!dataprepFileValidator.fileValid()) {
      return <DataprepInputValidationFailure />;
    }

    return (
      <FileUploadBlock
        existingDataUploadSources={existingDataUploadSources}
        existingSource={existingSource}
        fileExtension={fileExtension}
      />
    );
  };

  const maybeRenderFileTable = () => {
    if (dataprepSetUp || !allowMultipleFiles) {
      return null;
    }

    return <FileTable />;
  };

  return (
    <Group.Vertical paddingBottom="l" spacing="xl">
      {maybeRenderTypeToggle()}
      {(sourceType === CSV_TYPE || existingSource) && (
        <SourceName
          disabled={sourceType === DATAPREP_TYPE}
          displaySourceId={sourceType === DATAPREP_TYPE}
          onSourceNameChange={onSourceNameChange}
        />
      )}
      {renderContent()}
      {maybeRenderFileTable()}
    </Group.Vertical>
  );
}
