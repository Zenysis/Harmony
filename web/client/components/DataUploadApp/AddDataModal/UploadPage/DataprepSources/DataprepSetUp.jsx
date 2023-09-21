// @flow
import * as React from 'react';
import { useFragment } from 'react-relay/hooks';

import DataUploadService from 'services/DataUploadService';
import Dropdown from 'components/ui/Dropdown';
import FileTable from 'components/DataUploadApp/AddDataModal/UploadPage/DataprepSources/FileTable';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import I18N from 'lib/I18N';
import InfoTooltip from 'components/ui/InfoTooltip';
import InputText from 'components/ui/InputText';
import LabelWrapper from 'components/ui/LabelWrapper';
import Toaster from 'components/ui/Toaster';
import Well from 'components/ui/Well';
import useDebouncedCallback from 'lib/hooks/useDebouncedCallback';
import usePrevious from 'lib/hooks/usePrevious';
import usePromiseCleanUp from 'lib/hooks/usePromiseCleanUp';
import {
  DataUploadModalContext,
  DataUploadModalDispatch,
} from 'components/DataUploadApp/AddDataModal/useDataUploadModalContext';
import { relayIdToDatabaseId } from 'util/graphql';
import { slugify } from 'util/stringUtil';
import type ZenHTTPError from 'util/ZenHTTPError';
import type { DataprepSetUp_pipelineDatasourceConnection$key } from './__generated__/DataprepSetUp_pipelineDatasourceConnection.graphql';

// Possible error codes that DataUploadService can return
const BUCKET_ERROR_TYPES = {
  badBucketContentsError: I18N.text(
    'No valid input files found in location folder.',
  ),
  badParameterizedFileNamesError: I18N.text(
    'Location folder must contain files with the same extension.',
  ),
  badReplacementFileNamesError: I18N.text(
    'Location folder must contain a single `self_serve_input` file.',
  ),
  bucketPathDoesNotExistError: I18N.text(
    'Location folder does not exist in the cloud.',
  ),
};
const RECIPE_ERROR_TYPES = {
  badFlowInputCountError: I18N.text(
    'Dataprep Flow must have one input dataset in expected folder.',
  ),
  badParameterizationPathError: I18N.text(
    'Parameterized Dataprep dataset does not have the expected path.',
  ),
  incorrectRecipeIDSelectedError: I18N.text(
    'Dataprep recipe ID is not the last recipe ID in Flow.',
  ),
  nonexistentRecipeIdError: I18N.text('Dataprep recipe ID does not exist.'),
};
type ErrorTypeLookup = typeof BUCKET_ERROR_TYPES | typeof RECIPE_ERROR_TYPES;

type Props = {
  existingDataUploadSources: $ReadOnlySet<string>,
  onSourceNameChange: string => void,
  pipelineDatasourceRef: DataprepSetUp_pipelineDatasourceConnection$key,
  setDisableUploadButton: boolean => void,
};

export default function DataprepSetUp({
  existingDataUploadSources,
  onSourceNameChange,
  pipelineDatasourceRef,
  setDisableUploadButton,
}: Props): React.Node {
  const {
    allowMultipleFiles,
    recipeId,
    sourceId,
    sourceName,
    sourceType,
  } = React.useContext(DataUploadModalContext);
  const dispatch = React.useContext(DataUploadModalDispatch);
  const setPromise = usePromiseCleanUp();

  const [recipeIdText, setRecipeIdText] = React.useState<string>(
    String(recipeId || ''),
  );

  // `validationError` has 3 value states: undefined (validation hasn't happened),
  // empty string (validation passed), and a non-empty string (validation failed).
  const [validationError, setValidationError] = React.useState<string | void>(
    undefined,
  );

  React.useEffect(() => {
    setDisableUploadButton(
      !recipeId || !sourceId || !sourceName || validationError !== '',
    );
  }, [recipeId, setDisableUploadButton, sourceId, sourceName, validationError]);

  // When the source type changes, reset these state variables too since the context variables
  // are reset.
  const prevSourceType = usePrevious(sourceType);
  React.useEffect(() => {
    if (prevSourceType && prevSourceType !== sourceType) {
      setValidationError(undefined);
      setRecipeIdText('');
    }
  }, [prevSourceType, sourceType]);

  const queryData = useFragment(
    graphql`
      fragment DataprepSetUp_pipelineDatasourceConnection on pipeline_datasourceConnection {
        edges {
          node {
            id
            name
          }
        }
      }
    `,
    pipelineDatasourceRef,
  );

  const datasourceLookup = React.useMemo(() => {
    const lookup = {};
    queryData.edges.forEach(edge => {
      const id = relayIdToDatabaseId(edge.node.id);
      // Don't allow duplicate Dataprep sources
      if (!existingDataUploadSources.has(id)) {
        lookup[id] = edge.node.name;
      }
    });
    return lookup;
  }, [existingDataUploadSources, queryData.edges]);

  const onDataprepSourceChange = (newSourceId: string) => {
    setValidationError(undefined);
    dispatch({
      sourceId: newSourceId,
      sourceName: datasourceLookup[newSourceId],
      type: 'SET_DATAPREP_SOURCE',
    });
  };

  const onRecipeIdChange = (newRecipeId: string) => {
    setValidationError(undefined);
    setRecipeIdText(newRecipeId);
    const recipeIdNumber = parseInt(newRecipeId, 10) || undefined;
    dispatch({ recipeId: recipeIdNumber, type: 'RECIPE_ID_CHANGE' });
  };

  const validateDataprepSetup = useDebouncedCallback(
    () => {
      if (recipeId) {
        setPromise(
          DataUploadService.validateDataprepSetup(sourceId, recipeId)
            .then(
              ({
                dataprepExpectedColumns,
                isFlowParameterized,
                uploadedFiles,
              }) => {
                setValidationError('');
                dispatch({
                  dataprepExpectedColumns,
                  uploadedFiles,
                  allowMultipleFiles: isFlowParameterized,
                  type: 'DATAPREP_SETUP_VALIDATION',
                });
              },
            )
            .catch((error: ZenHTTPError) => {
              if (
                error.message in BUCKET_ERROR_TYPES ||
                error.message in RECIPE_ERROR_TYPES
              ) {
                setValidationError(error.message);
              } else {
                Toaster.error(
                  I18N.textById(
                    'An unknown error occurred. Contact an Administrator for assistance.',
                  ),
                );
              }
            }),
        );
      }
    },
    500,
    [sourceId, recipeId],
  );

  React.useEffect(() => validateDataprepSetup(), [
    recipeId,
    sourceId,
    validateDataprepSetup,
  ]);

  const renderSourceSelection = (): React.Node => {
    const sourceDropdownLabel = (
      <Group.Horizontal alignItems="center" flex spacing="none">
        <Heading.Small>
          <I18N>Existing Source</I18N>
        </Heading.Small>
        <Group.Item className="data-upload-upload-page__info-icon">
          <InfoTooltip
            text={I18N.text(
              'Dataprep self-serve sources require an existing pipeline step. Select one from the list below; items are listed as "Name (Source ID)".',
              'sourceDropdownInfo',
            )}
          />
        </Group.Item>
      </Group.Horizontal>
    );
    const dropdownOptions = Object.keys(datasourceLookup)
      .sort((a: string, b: string) =>
        datasourceLookup[a].localeCompare(datasourceLookup[b]),
      )
      .map(id => (
        <Dropdown.Option key={id} value={id}>
          {`${datasourceLookup[id]} (${id})`}
        </Dropdown.Option>
      ));

    const sourceNameLabel = (
      <Group.Horizontal alignItems="center" flex spacing="none">
        <Heading.Small>
          <I18N.Ref id="Data Source Name" />
        </Heading.Small>
        <Group.Item className="data-upload-upload-page__info-icon">
          <InfoTooltip
            text={I18N.text(
              'Dataprep source names cannot be edited.',
              'dataprep-disabled-source-name',
            )}
          />
        </Group.Item>
      </Group.Horizontal>
    );

    return (
      <Group.Horizontal flex itemFlexValue={1}>
        <Group.Item className="data-upload-upload-page__source-dropdown">
          <LabelWrapper label={sourceDropdownLabel}>
            <Dropdown
              ariaName={I18N.textById('Existing Source')}
              defaultDisplayContent={I18N.text('Select a source')}
              onSelectionChange={onDataprepSourceChange}
              value={sourceId}
            >
              {dropdownOptions}
            </Dropdown>
          </LabelWrapper>
        </Group.Item>
        <LabelWrapper htmlFor="datasource-name-input" label={sourceNameLabel}>
          <InputText
            className="data-upload-upload-page__source-name"
            disabled
            id="datasource-name-input"
            onChange={onSourceNameChange}
            testId="datasource-name-input"
            value={sourceName}
            width="75%"
          />
        </LabelWrapper>
      </Group.Horizontal>
    );
  };

  const maybeRenderValidationError = (
    errorTypeLookup: ErrorTypeLookup,
  ): React.Node => {
    if (validationError && validationError in errorTypeLookup) {
      return (
        <Group.Item className="data-upload-upload-page__error-text">
          {errorTypeLookup[validationError]}
        </Group.Item>
      );
    }
    return null;
  };

  const renderLocationFolder = (): React.Node => {
    const gcsDeploymentName = slugify(
      window.__JSON_FROM_BACKEND.deploymentName,
      '_',
      false,
    );

    const label = (
      <Group.Horizontal alignItems="center" flex spacing="none">
        <Heading.Small>
          <I18N>Location Folder</I18N>
        </Heading.Small>
        <Group.Item className="data-upload-upload-page__info-icon">
          <InfoTooltip
            text={I18N.text(
              'The expected dataset location folder is below.',
              'locationInfo',
            )}
          />
        </Group.Item>
      </Group.Horizontal>
    );

    return (
      <LabelWrapper htmlFor="datasource-location-display" label={label}>
        <Group.Vertical>
          <Group.Item>
            gs://zenysis-{gcsDeploymentName}/self_serve/
            {sourceId || I18N.text('<source ID>')}
          </Group.Item>
          {maybeRenderValidationError(BUCKET_ERROR_TYPES)}
        </Group.Vertical>
      </LabelWrapper>
    );
  };

  const renderRecipeIdInput = (): React.Node => {
    const label = (
      <Group.Horizontal alignItems="center" flex spacing="none">
        <Heading.Small>
          <I18N>Recipe ID</I18N>
        </Heading.Small>
        <Group.Item className="data-upload-upload-page__info-icon">
          <InfoTooltip
            text={I18N.text(
              'The recipe ID is a number that can be found in Dataprep. Click on the last recipe step before the output and use the "recipe" ID in that URL.',
              'recipeInfo',
            )}
          />
        </Group.Item>
      </Group.Horizontal>
    );

    return (
      <LabelWrapper htmlFor="datasource-recipe-input" label={label}>
        <Group.Vertical>
          <InputText
            id="datasource-recipe-input"
            onChange={onRecipeIdChange}
            value={recipeIdText}
            width="25%"
          />
          {maybeRenderValidationError(RECIPE_ERROR_TYPES)}
        </Group.Vertical>
      </LabelWrapper>
    );
  };

  const renderDataprepDetails = (): React.Node => {
    return (
      <Group.Horizontal flex itemFlexValue={1}>
        <Group.Item>{renderLocationFolder()}</Group.Item>
        <Group.Item>{renderRecipeIdInput()}</Group.Item>
      </Group.Horizontal>
    );
  };

  const renderUpdateType = (): React.Node => {
    const label = (
      <Group.Horizontal alignItems="center" flex spacing="none">
        <Heading.Small>
          <I18N>Update Type</I18N>
        </Heading.Small>
        <Group.Item className="data-upload-upload-page__info-icon">
          <InfoTooltip
            text={I18N.text(
              'Update Type is set in Dataprep. Flows with parameterized input datasets are of "Append new files" type, while flows with a single input file are of "Replace entire dataset" type.\nThis option cannot be toggled here and must be done in Dataprep.',
              'updateTypeInfo',
            )}
          />
        </Group.Item>
      </Group.Horizontal>
    );

    let updateValue;
    if (allowMultipleFiles !== undefined) {
      updateValue = (
        <Well
          className="data-upload-upload-page__update-value"
          size={Well.Sizes.SMALL}
        >
          {allowMultipleFiles
            ? I18N.text('Append new files')
            : I18N.text('Replace entire dataset')}
        </Well>
      );
    } else {
      updateValue = (
        <i>
          {I18N.text('Update Type is fetched from Dataprep based on Recipe ID')}
        </i>
      );
    }

    return (
      <LabelWrapper htmlFor="datasource-update-display" label={label}>
        {updateValue}
      </LabelWrapper>
    );
  };

  const maybeRenderUploadedFiles = (): React.Node => {
    return validationError === '' && allowMultipleFiles ? (
      <FileTable modifiable={false} />
    ) : null;
  };

  return (
    <Group.Vertical spacing="xl">
      {renderSourceSelection()}
      {renderDataprepDetails()}
      {renderUpdateType()}
      {maybeRenderUploadedFiles()}
    </Group.Vertical>
  );
}
