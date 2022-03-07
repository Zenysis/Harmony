// @flow
import * as React from 'react';

import BaseModal from 'components/ui/BaseModal';
import I18N from 'lib/I18N';
import InputText from 'components/ui/InputText';

type Props = {
  isOpen: boolean,
  name: string,
  onClose: () => void,
  onNameChange: string => void,
  onSave: () => void,
  title: string,
};

// The base of the group action modals and encapsulates all of the styling.
export default function BaseGroupModal({
  isOpen,
  name,
  onClose,
  onNameChange,
  onSave,
  title,
}: Props): React.Element<typeof BaseModal> {
  return (
    <BaseModal
      disablePrimaryButton={name.length === 0}
      onPrimaryAction={onSave}
      onRequestClose={onClose}
      primaryButtonText={I18N.text('Save', 'save')}
      show={isOpen}
      title={title}
      width={450}
    >
      <InputText.Uncontrolled
        debounce
        debounceTimeoutMs={300}
        initialValue={name}
        onChange={onNameChange}
        placeholder={I18N.textById('name')}
      />
    </BaseModal>
  );
}
