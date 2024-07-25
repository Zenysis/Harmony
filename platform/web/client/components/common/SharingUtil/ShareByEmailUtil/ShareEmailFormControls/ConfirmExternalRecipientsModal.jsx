// @flow
import * as React from 'react';

import BaseModal from 'components/ui/BaseModal';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import Spacing from 'components/ui/Spacing';

type Props = {
  closeConfirmModal: () => void,
  externalRecipients: $ReadOnlyArray<string>,
  noAccessRecipients?: $ReadOnlyArray<string>,
  onConfirmSendEmail: () => void,
  showConfirmModal: boolean,
};

function ConfirmExternalRecipientsModal({
  showConfirmModal,
  closeConfirmModal,
  onConfirmSendEmail,
  externalRecipients,
  noAccessRecipients = [],
}: Props) {
  const maybeRenderExternalRecipientText = () => {
    if (externalRecipients.length === 0) {
      return null;
    }
    return (
      <Group.Vertical marginBottom="m">
        <p>
          <I18N id="externalRecipientText">
            You are sending this analysis to a recipient who is not registered
            on the platform. External recipients are:
          </I18N>
        </p>
        {externalRecipients.map(email => (
          <Spacing key={email} paddingLeft="l">
            {email}
          </Spacing>
        ))}
        <p>
          <I18N id="attachmentsText">
            Attachments will include all data visible to you.
          </I18N>
        </p>
      </Group.Vertical>
    );
  };

  const maybeRenderNoAccessRecipientText = () => {
    if (noAccessRecipients.length === 0) {
      return null;
    }
    return (
      <Group.Vertical marginBottom="s">
        <p>
          <I18N>
            The following recipients do not have access to this dashboard:
          </I18N>
        </p>
        {noAccessRecipients.map(email => (
          <Spacing key={email} paddingLeft="l">
            {email}
          </Spacing>
        ))}
        <p>
          <I18N id="noDashboardAccess">
            They will not be able to access the dashboard or see data on
            attachments (unless it is a shared thread or you changed attachment
            settings for this email). Consider inviting them to the dashboard
            before sending this email.
          </I18N>
        </p>
        <p>
          <I18N id="confirmText">
            Please confirm you would like to proceed.
          </I18N>
        </p>
      </Group.Vertical>
    );
  };

  return (
    <BaseModal
      onPrimaryAction={onConfirmSendEmail}
      onRequestClose={closeConfirmModal}
      primaryButtonText={I18N.textById('Send')}
      show={showConfirmModal}
      title={I18N.text('Confirm Sharing')}
      width={600}
    >
      {maybeRenderExternalRecipientText()}
      {maybeRenderNoAccessRecipientText()}
    </BaseModal>
  );
}

export default (React.memo(
  ConfirmExternalRecipientsModal,
): React.AbstractComponent<Props>);
