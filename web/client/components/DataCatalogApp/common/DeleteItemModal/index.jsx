// @flow
import * as React from 'react';

import BaseModal from 'components/ui/BaseModal';
import I18N from 'lib/I18N';

type Props = {
  onDeleteItemClick: () => void,
  onRequestClose: () => void,
  promptText: string,
  show: boolean,
  title: string,
};

export default function DeleteItemModal({
  onDeleteItemClick,
  onRequestClose,
  promptText,
  show,
  title,
}: Props): React.Node {
  return (
    <BaseModal
      closeButtonText={I18N.textById('Cancel')}
      onRequestClose={onRequestClose}
      onSecondaryAction={onDeleteItemClick}
      secondaryButtonText={I18N.text('Delete', 'delete')}
      show={show}
      showPrimaryButton={false}
      showSecondaryButton
      title={title}
      width={450}
    >
      <p>{promptText}</p>
    </BaseModal>
  );
}
