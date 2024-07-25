// @flow
import * as React from 'react';

import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import I18N from 'lib/I18N';
import InputText from 'components/ui/InputText';
import LabelWrapper from 'components/ui/LabelWrapper';
import Tooltip from 'components/ui/Tooltip';
import { DataUploadModalContext } from 'components/DataUploadApp/AddDataModal/useDataUploadModalContext';

type Props = {
  disabled: boolean,
  displaySourceId: boolean,
  onSourceNameChange: string => void,
};

export default function SourceName({
  disabled,
  displaySourceId,
  onSourceNameChange,
}: Props): React.Node {
  const { sourceId, sourceName } = React.useContext(DataUploadModalContext);

  let sourceNameInput = (
    <InputText
      className="data-upload-upload-page__source-name"
      disabled={disabled}
      id="datasource-name-input"
      onChange={onSourceNameChange}
      testId="datasource-name-input"
      value={sourceName}
      width="50%"
    />
  );
  if (disabled) {
    sourceNameInput = (
      <Tooltip
        content={I18N.textById('dataprep-disabled-source-name')}
        targetClassName="data-upload-upload-page__source-name-tooltip"
      >
        {sourceNameInput}
      </Tooltip>
    );
  }

  const sourceNameWrapper = (
    <LabelWrapper
      htmlFor="datasource-name-input"
      label={
        <Heading.Small>
          <I18N>Data Source Name</I18N>
        </Heading.Small>
      }
    >
      {sourceNameInput}
    </LabelWrapper>
  );

  if (!displaySourceId) {
    return sourceNameWrapper;
  }

  return (
    <Group.Vertical spacing="xs">
      {sourceNameWrapper}
      <I18N sourceId={sourceId}>Source ID: %(sourceId)s</I18N>
    </Group.Vertical>
  );
}
