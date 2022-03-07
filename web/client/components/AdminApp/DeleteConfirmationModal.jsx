// @flow
import * as React from 'react';

import BaseModal from 'components/ui/BaseModal';
import Intents from 'components/ui/Intents';

const TEXT = t('admin_app.DeleteConfirmationModal');

type Props = {
  description: string,
  onClose: () => void,
  onPrimaryAction: () => void,
  show: boolean,
  title: string,

  closeButtonText?: string,
  primaryButtonText?: string,
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
  closeButtonText = TEXT.cancel,
  primaryButtonText = TEXT.delete,
}: Props): React.Element<typeof BaseModal> {
  return (
    <BaseModal
      closeButtonText={closeButtonText}
      onRequestClose={onClose}
      onPrimaryAction={onPrimaryAction}
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
