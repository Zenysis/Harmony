// @flow
import * as React from 'react';
import invariant from 'invariant';

import Button from 'components/ui/Button';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';
import {
  DataUploadModalContext,
  DataUploadModalDispatch,
} from 'components/DataUploadApp/AddDataModal/useDataUploadModalContext';

export default function DataprepInputValidationFailure(): React.Node {
  const { dataprepExpectedColumns, dataprepFileValidator } = React.useContext(
    DataUploadModalContext,
  );
  const dispatch = React.useContext(DataUploadModalDispatch);
  invariant(
    dataprepExpectedColumns,
    'Expected columns must be defined for a dataprep source.',
  );

  const maybeRenderHeaderList = (
    description: string,
    headers: $ReadOnlyArray<string>,
  ) => {
    if (headers.length === 0) {
      return null;
    }
    return (
      <Group.Vertical spacing="xxs">
        {description}
        <ul className="data-upload-dataprep-validation__description-headers">
          {headers.map((header, i) => (
            // The list is static and will not change.
            // eslint-disable-next-line react/no-array-index-key
            <li key={i}>{header}</li>
          ))}
        </ul>
      </Group.Vertical>
    );
  };

  const maybeRenderHeaderOrdering = () => {
    if (dataprepFileValidator.headerOrderCorrect()) {
      return null;
    }

    return (
      <Group.Vertical spacing="xxs">
        {I18N.text('Upload columns are out of order. Expected order:')}
        <ol className="data-upload-dataprep-validation__description-headers">
          {dataprepExpectedColumns.map((header, i) => (
            // The list is static and will not change.
            // eslint-disable-next-line react/no-array-index-key
            <li key={i}>{header}</li>
          ))}
        </ol>
      </Group.Vertical>
    );
  };

  return (
    <Group.Horizontal
      className="data-upload-dataprep-validation"
      flex
      padding="l"
      spacing="xs"
    >
      <Icon
        className="data-upload-dataprep-validation__error-icon"
        type="svg-error-outline"
      />
      <Group.Vertical spacing="l">
        <Heading.Large>
          <I18N>Looks like the Upload failed</I18N>
        </Heading.Large>
        <Group.Vertical
          firstItemClassName="data-upload-dataprep-validation__subheader"
          spacing="m"
        >
          <I18N id="fileNotMatched">
            The uploaded file did not match the required format.
          </I18N>
          {maybeRenderHeaderList(
            I18N.text('Upload is missing these required columns:'),
            dataprepFileValidator.missingHeaders(),
          )}
          {maybeRenderHeaderList(
            I18N.text('Upload contains these additional columns:'),
            dataprepFileValidator.extraHeaders(),
          )}
          {maybeRenderHeaderOrdering()}
        </Group.Vertical>
        <Button onClick={() => dispatch({ type: 'RESET_DATAPREP_HEADERS' })}>
          <I18N>Try again</I18N>
        </Button>
      </Group.Vertical>
    </Group.Horizontal>
  );
}
