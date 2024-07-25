// @flow
import * as React from 'react';

import Alert from 'components/ui/Alert';
import AttachmentSettingsModal from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/ShareDashboardModal/FormControls/AttachmentSettingsFormSection/AttachmentSettingsModal';
import Checkbox from 'components/ui/Checkbox';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';
import Spacing from 'components/ui/Spacing';
import useBoolean from 'lib/hooks/useBoolean';
import type { AttachmentOptions } from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/ShareDashboardModal/constants';

type Props = {
  attachmentOptions: AttachmentOptions,
  onAttachmentOptionsChange: (newOptions: AttachmentOptions) => void,
  useSingleEmailThread: boolean,
};

const AttachmentSettingsFormSection = ({
  attachmentOptions,
  onAttachmentOptionsChange,
  useSingleEmailThread,
}: Props) => {
  const [
    showAttachmentSettingsModal,
    openAttachmentSettingsModal,
    closeAttachmentSettingsModal,
  ] = useBoolean(false);

  const toggleAttachPdfValue = () => {
    onAttachmentOptionsChange({
      ...attachmentOptions,
      shouldAttachPdf: !attachmentOptions.shouldAttachPdf,
    });
  };

  const toggleEmbedImageValue = () => {
    onAttachmentOptionsChange({
      ...attachmentOptions,
      shouldEmbedImage: !attachmentOptions.shouldEmbedImage,
    });
  };

  const toggleUseRecipientQueryPolicy = () => {
    onAttachmentOptionsChange({
      ...attachmentOptions,
      useRecipientQueryPolicy: !attachmentOptions.useRecipientQueryPolicy,
    });
  };

  const attachPdfCheckbox = (
    <Checkbox
      label={I18N.text('Attach PDF', 'attachPDF')}
      labelPlacement="right"
      onChange={toggleAttachPdfValue}
      value={attachmentOptions.shouldAttachPdf}
    />
  );

  const embedImageCheckbox = (
    <Checkbox
      label={I18N.text('Embed Image', 'embedImage')}
      labelPlacement="right"
      onChange={toggleEmbedImageValue}
      value={attachmentOptions.shouldEmbedImage}
    />
  );

  const maybeRenderAttachmentSettingsIcon = (): React.Node => {
    if (useSingleEmailThread) {
      return null;
    }
    return <Icon onClick={openAttachmentSettingsModal} type="cog" />;
  };

  return (
    <>
      <Group.Horizontal spacing="l">
        {embedImageCheckbox}
        {attachPdfCheckbox}
        {maybeRenderAttachmentSettingsIcon()}
      </Group.Horizontal>
      {useSingleEmailThread && (
        <Spacing marginTop="s">
          <Alert
            intent="warning"
            title={I18N.text(
              'Note: Attachments to shared threads will include all data visible to you on this dashboard - they will not honor recipients’ data access rights.',
              'useSingleThreadWarning',
            )}
          />
        </Spacing>
      )}
      <AttachmentSettingsModal
        closeModal={closeAttachmentSettingsModal}
        onUseRecipientQueryPolicyChange={toggleUseRecipientQueryPolicy}
        showModal={showAttachmentSettingsModal}
        useRecipientQueryPolicy={attachmentOptions.useRecipientQueryPolicy}
      />
    </>
  );
};

export default (React.memo(
  AttachmentSettingsFormSection,
): React.AbstractComponent<Props>);
