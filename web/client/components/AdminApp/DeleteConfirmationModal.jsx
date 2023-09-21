// @flow
import * as React from 'react';

import BaseModal from 'components/ui/BaseModal';
import I18N from 'lib/I18N';
import Intents from 'components/ui/Intents';

type Props = {
  closeButtonText?: string,
  description: string,
  onClose: () => void,
  onPrimaryAction: () => void,
  primaryButtonText?: string,
  show: boolean,
  title: string,
};

/**
 * A simple delete confirmation modal used by the users, groups, and roles tab.
 */
export default function DeleteConfirmationModal({
  description,
  onClose,
  onPrimaryAction,
  show,
  title,
  closeButtonText = I18N.text('Cancel'),
  primaryButtonText = I18N.textById('Delete'),
}: Props): React.Element<typeof BaseModal> {
  return (
    <BaseModal
      closeButtonText={closeButtonText}
      onPrimaryAction={onPrimaryAction}
      onRequestClose={onClose}
      primaryButtonIntent={Intents.DANGER}
      primaryButtonText={primaryButtonText}
      show={show}
      title={title}
      width="auto"
    >
      <p>{description}</p>
    </BaseModal>
  );
}
