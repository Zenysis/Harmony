// @flow
import * as React from 'react';

import BaseModal from 'components/ui/BaseModal';
import Checkbox from 'components/ui/Checkbox';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import UploadInput from 'components/ui/UploadInput';

type Props = {
  acceptedFileType: string,
  onClose: () => void,
  onFileSelected: (e: SyntheticEvent<HTMLInputElement>) => void,
  onImport: () => void,
  onShouldBackupDataChanged: boolean => void,
  shouldBackupData: boolean,
  show: boolean,
  title: string,
};

export default function ImportFileModal({
  acceptedFileType,
  onClose,
  onFileSelected,
  onShouldBackupDataChanged,
  onImport,
  shouldBackupData,
  show,
  title,
}: Props): React.Element<typeof BaseModal> {
  return (
    <BaseModal
      onPrimaryAction={onImport}
      onRequestClose={onClose}
      primaryButtonText={I18N.text('import')}
      show={show}
      title={title}
      width={684}
    >
      <Group.Vertical spacing="xl">
        <Group.Vertical>
          <I18N>Select file to import</I18N>

          <UploadInput
            accept={acceptedFileType}
            onChange={onFileSelected}
            label={I18N.text('Click to select file')}
          />
        </Group.Vertical>
        <Checkbox
          label={I18N.text('Download current data catalog for backup purposes')}
          onChange={onShouldBackupDataChanged}
          value={shouldBackupData}
        />
      </Group.Vertical>
    </BaseModal>
  );
}
