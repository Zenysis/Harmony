// @flow
import * as React from 'react';

import BaseModal from 'components/ui/BaseModal';
import Checkbox from 'components/ui/Checkbox';
import I18N from 'lib/I18N';
import Spacing from 'components/ui/Spacing';

type Props = {
  closeModal: () => void,
  onUseRecipientQueryPolicyChange: (useRecipientQueryPolicy: boolean) => void,
  showModal: boolean,
  useRecipientQueryPolicy: boolean,
};

function AttachmentSettingsModal({
  closeModal,
  onUseRecipientQueryPolicyChange,
  showModal,
  useRecipientQueryPolicy,
}: Props) {
  return (
    <BaseModal
      closeButtonText={I18N.textById('Close')}
      onRequestClose={closeModal}
      show={showModal}
      showPrimaryButton={false}
      title={I18N.text('Attachment Settings')}
      width={600}
    >
      <Spacing marginBottom="m">
        <Checkbox
          label={I18N.text(
            'Attachments respect recipients data access rights',
            'attachmentSettingsCheckbox',
          )}
          onChange={onUseRecipientQueryPolicyChange}
          value={useRecipientQueryPolicy}
        />
      </Spacing>
      <p>
        {I18N.text(
          "When active, attachments will respect the data access rights of recipients. Each recipient's attachments will only include data that they would be able to see in the platform when signed in. This setting is active by default.",
          'attachmentSettingsMessage',
        )}
      </p>
      <p>
        {I18N.text(
          'Switch this setting off if you would like the attachments to include all the data you can see instead.',
          'attachmentSettingsSwitchOn',
        )}
      </p>
    </BaseModal>
  );
}

export default (React.memo(
  AttachmentSettingsModal,
): React.AbstractComponent<Props>);
