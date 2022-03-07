// @flow
import * as React from 'react';

import BaseModal from 'components/ui/BaseModal';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';

type Props = {
  description: React.Node,
  isImporting: boolean,
  onCancel: () => void,
  onImportStart: () => void,
  show: boolean,
  title: React.Node,
};

export default function ImportConfirmationModal({
  description,
  isImporting,
  onCancel,
  onImportStart,
  show,
  title,
}: Props): React.Element<typeof BaseModal> {
  const primaryButtonText = isImporting
    ? I18N.text('Importing data...', 'importProgress')
    : I18N.text('yes, import');
  return (
    <BaseModal
      onPrimaryAction={onImportStart}
      onRequestClose={onCancel}
      primaryButtonText={primaryButtonText}
      disablePrimaryButton={isImporting}
      disableSecondaryButton={isImporting}
      show={show}
      title={I18N.text('Import confirmation')}
      width={684}
    >
      <Group.Vertical>
        {title}
        {description}
      </Group.Vertical>
    </BaseModal>
  );
}
