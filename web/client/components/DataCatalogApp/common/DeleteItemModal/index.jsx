// @flow
import * as React from 'react';

import BaseModal from 'components/ui/BaseModal';
import I18N from 'lib/I18N';

type Props = {
  promptText: string,
  show: boolean,
  title: string,
  onRequestClose: () => void,
  onDeleteItemClick: () => void,
};

export default function DeleteItemModal({
  promptText,
  onDeleteItemClick,
  onRequestClose,
  show,
  title,
}: Props): React.Node {
  return (
    <BaseModal
      show={show}
      showPrimaryButton={false}
      onRequestClose={onRequestClose}
      onSecondaryAction={onDeleteItemClick}
      title={title}
      showSecondaryButton
      secondaryButtonText={I18N.text('Delete', 'delete')}
      width={450}
    >
      <p>{promptText}</p>
    </BaseModal>
  );
}
