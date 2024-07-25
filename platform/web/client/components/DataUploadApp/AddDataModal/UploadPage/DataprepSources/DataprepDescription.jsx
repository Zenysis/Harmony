// @flow
import * as React from 'react';

import AnimateHeight from 'components/ui/AnimateHeight';
import Button from 'components/ui/Button';
import Caret from 'components/ui/Caret';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import Spacing from 'components/ui/Spacing';
import useToggleBoolean from 'lib/hooks/useToggleBoolean';
import { DataUploadModalContext } from 'components/DataUploadApp/AddDataModal/useDataUploadModalContext';

export default function DataprepDescription(): React.Node {
  const { dataprepExpectedColumns } = React.useContext(DataUploadModalContext);

  const [showColumnNames, toggleShowColumnNames] = useToggleBoolean(false);

  if (dataprepExpectedColumns === undefined) {
    return null;
  }

  const captionTextClassName = 'data-upload-fileinput__caption-text';
  const descriptionTextClassName = 'data-upload-fileinput__description-text';
  const headersTitleClassName = 'data-upload-fileinput__headers-title';

  if (dataprepExpectedColumns.length === 0) {
    return (
      <Group.Vertical
        className="data-upload-fileinput__description"
        paddingLeft="l"
        spacing="m"
      >
        <Group.Item className={descriptionTextClassName}>
          <I18N id="noHeadersDetected">
            There were no headers detected in the original source file.
          </I18N>
        </Group.Item>
        <Group.Item className={headersTitleClassName}>
          <I18N>No headers to validate</I18N>
        </Group.Item>
      </Group.Vertical>
    );
  }

  return (
    <Group.Vertical
      className="data-upload-fileinput__description"
      paddingLeft="l"
      spacing="xxs"
    >
      <Group.Item className={descriptionTextClassName} marginBottom="m">
        <I18N id="dataprepDescription">
          In order to successfully ingest your data into our database, data
          column names and order must match your original data recipe:
        </I18N>
      </Group.Item>
      <Group.Item className={headersTitleClassName} marginBottom="xs">
        <I18N columnsCount={dataprepExpectedColumns.length}>
          %(columnsCount)s column(s)
        </I18N>
      </Group.Item>
      <Button.Unstyled onClick={toggleShowColumnNames}>
        <Group.Horizontal
          alignContent="center"
          className="data-upload-fileinput__caption-text"
          flex
          spacing="xs"
        >
          <I18N>See full list of column names</I18N>
          <Caret
            direction={
              showColumnNames ? Caret.Directions.DOWN : Caret.Directions.RIGHT
            }
            size={8}
          />
        </Group.Horizontal>
      </Button.Unstyled>

      <AnimateHeight
        className={captionTextClassName}
        height={showColumnNames ? 'auto' : 0}
      >
        <ol className="data-upload-fileinput__description-headers">
          {dataprepExpectedColumns.map((fieldName, i) => (
            // The list is static and will not change.
            // eslint-disable-next-line react/no-array-index-key
            <li key={i}>
              <Spacing marginLeft="xs">{fieldName}</Spacing>
            </li>
          ))}
        </ol>
      </AnimateHeight>
    </Group.Vertical>
  );
}
