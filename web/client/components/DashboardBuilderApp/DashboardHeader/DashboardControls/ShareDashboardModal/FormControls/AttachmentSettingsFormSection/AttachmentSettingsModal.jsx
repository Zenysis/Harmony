// @flow
import * as React from 'react';

import BaseModal from 'components/ui/BaseModal';
import Checkbox from 'components/ui/Checkbox';
import Spacing from 'components/ui/Spacing';

const TEXT = t(
  'query_result.common.share_analysis.dashboardShare.attachmentSettings',
);

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
      show={showModal}
      onRequestClose={closeModal}
      showPrimaryButton={false}
      width={600}
      title={TEXT.title}
      closeButtonText={TEXT.close}
    >
      <Spacing marginBottom="m">
        <Checkbox
          label={TEXT.checkbox}
          value={useRecipientQueryPolicy}
          onChange={onUseRecipientQueryPolicyChange}
        />
      </Spacing>
      <p>{TEXT.message}</p>
      <p>{TEXT.switchOn}</p>
    </BaseModal>
  );
}

export default (React.memo(
  AttachmentSettingsModal,
): React.AbstractComponent<Props>);
