// @flow
import * as React from 'react';

import AttachmentSettingsFormSection from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/ShareDashboardModal/FormControls/AttachmentSettingsFormSection';
import ConfirmExternalRecipientsModal from 'components/common/SharingUtil/ShareByEmailUtil/ShareEmailFormControls/ConfirmExternalRecipientsModal';
import Dashboard from 'models/core/Dashboard';
import DashboardService from 'services/DashboardBuilderApp/DashboardService';
import Group from 'components/ui/Group';
import LabelWrapper from 'components/ui/LabelWrapper';
import MessageInputText from 'components/common/SharingUtil/ShareByEmailUtil/ShareEmailFormControls/MessageInputText';
import RecipientInputText from 'components/common/SharingUtil/ShareByEmailUtil/ShareEmailFormControls/RecipientInputText';
import SecurityGroup from 'services/models/SecurityGroup';
import SenderText from 'components/common/SharingUtil/ShareByEmailUtil/ShareEmailFormControls/SenderText';
import ShareWithCurrentSettingsCheckbox from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/ShareDashboardModal/FormControls/ShareWithCurrentSettingsCheckbox';
import SingleThreadCheckbox from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/ShareDashboardModal/FormControls/SingleThreadCheckbox';
import StaticSelectableTextbox from 'components/common/StaticSelectableTextbox';
import SubjectInputText from 'components/common/SharingUtil/ShareByEmailUtil/ShareEmailFormControls/SubjectInputText';
import autobind from 'decorators/autobind';
import type {
  AttachmentOptions,
  ShareDashboardEmailInfo,
} from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/ShareDashboardModal/constants';

const TEXT = t('query_result.common.share_analysis.dashboardShare');

const SENDER = window.__JSON_FROM_BACKEND.user.username;

type DefaultProps = {
  getNoDashboardAccessRecipients: typeof DashboardService.getNoDashboardAccessRecipients,
};

type Props = {
  ...DefaultProps,
  closeConfirmModal: () => void,
  dashboard: Dashboard,
  emailInfo: ShareDashboardEmailInfo,
  errorTextArr: $ReadOnlyArray<{ key: string, value: string }>,
  linkToShare: string,
  isShareCurrentSettings: boolean,
  onConfirmSendEmail: () => void,
  onEmailInfoChange: (newEmailInfo: ShareDashboardEmailInfo) => void,
  onToggleShareCurrentSettings: boolean => void,
  shouldDisplayExtraSettings: boolean,
  showConfirmModal: boolean,
};

export default class ShareDashboardEmailForm extends React.PureComponent<Props> {
  static defaultProps: DefaultProps = {
    getNoDashboardAccessRecipients:
      DashboardService.getNoDashboardAccessRecipients,
  };

  @autobind
  toggleUseEmailThread() {
    this.props.onEmailInfoChange({
      ...this.props.emailInfo,
      useRecipientQueryPolicy: this.props.emailInfo.useSingleEmailThread,
      useSingleEmailThread: !this.props.emailInfo.useSingleEmailThread,
    });
  }

  @autobind
  setRecipients(
    recipients: $ReadOnlyArray<string>,
    externalRecipients: $ReadOnlyArray<string>,
  ) {
    this.props
      .getNoDashboardAccessRecipients(
        recipients,
        this.props.dashboard.getDashboardMeta(),
      )
      .then(noAccessRecipients =>
        this.props.onEmailInfoChange({
          ...this.props.emailInfo,
          noAccessRecipients,
        }),
      );
    this.props.onEmailInfoChange({
      ...this.props.emailInfo,
      externalRecipients,
      recipients,
    });
  }

  @autobind
  setMessage(message: string) {
    this.props.onEmailInfoChange({
      ...this.props.emailInfo,
      message,
    });
  }

  @autobind
  setSubject(subject: string) {
    this.props.onEmailInfoChange({
      ...this.props.emailInfo,
      subject,
    });
  }

  @autobind
  onAttachmentOptionsChange(newOptions: AttachmentOptions) {
    this.props.onEmailInfoChange({
      ...this.props.emailInfo,
      shouldEmbedImage: newOptions.shouldEmbedImage,
      shouldAttachPdf: newOptions.shouldAttachPdf,
      useRecipientQueryPolicy: newOptions.useRecipientQueryPolicy,
    });
  }

  @autobind
  onGroupsChange(groups: $ReadOnlyArray<SecurityGroup>) {
    this.props.onEmailInfoChange({
      ...this.props.emailInfo,
      recipientUserGroups: groups,
    });
  }

  @autobind
  maybeRenderErrorText(): React.Node {
    const { errorTextArr } = this.props;
    const errorList = errorTextArr.map(({ key, value }) => (
      <li key={key}>{value}</li>
    ));
    if (errorTextArr.length !== 0) {
      return <ul className="create-alert-error-text">{errorList}</ul>;
    }
    return null;
  }

  @autobind
  maybeRenderShareWithCurrentFilterBlock(): React.Node {
    const {
      isShareCurrentSettings,
      linkToShare,
      onToggleShareCurrentSettings,
      shouldDisplayExtraSettings,
    } = this.props;
    return shouldDisplayExtraSettings ? (
      <Group.Vertical>
        <ShareWithCurrentSettingsCheckbox
          isShareCurrentSettings={isShareCurrentSettings}
          onToggleShareCurrentSettings={onToggleShareCurrentSettings}
        />
        <LabelWrapper
          className="url-link-label"
          label={TEXT.shareWithCurrentFilterLabel}
        >
          <StaticSelectableTextbox text={linkToShare} />
        </LabelWrapper>
      </Group.Vertical>
    ) : null;
  }

  maybeRenderConfirmModal(): React.Node {
    const {
      showConfirmModal,
      closeConfirmModal,
      emailInfo,
      onConfirmSendEmail,
    } = this.props;
    return (
      <ConfirmExternalRecipientsModal
        showConfirmModal={showConfirmModal}
        closeConfirmModal={closeConfirmModal}
        externalRecipients={emailInfo.externalRecipients}
        noAccessRecipients={emailInfo.noAccessRecipients}
        onConfirmSendEmail={onConfirmSendEmail}
      />
    );
  }

  renderAttachmentControls(): React.Node {
    const { emailInfo } = this.props;

    const attachmentOptions = {
      useRecipientQueryPolicy: emailInfo.useRecipientQueryPolicy,
      shouldAttachPdf: emailInfo.shouldAttachPdf,
      shouldEmbedImage: emailInfo.shouldEmbedImage,
    };
    return (
      <AttachmentSettingsFormSection
        attachmentOptions={attachmentOptions}
        onAttachmentOptionsChange={this.onAttachmentOptionsChange}
        useSingleEmailThread={emailInfo.useSingleEmailThread}
      />
    );
  }

  render(): React.Node {
    const { emailInfo } = this.props;
    const showSingleThreadCheckbox =
      emailInfo.recipients.length >= 2 ||
      emailInfo.recipientUserGroups.length !== 0;
    const selectedGroups = emailInfo.recipientUserGroups.map(group =>
      group.name(),
    );
    return (
      <div>
        {this.maybeRenderErrorText()}
        <RecipientInputText
          recipients={emailInfo.recipients}
          setRecipients={this.setRecipients}
          selectedGroups={selectedGroups}
          onUserGroupChange={this.onGroupsChange}
        />
        <SingleThreadCheckbox
          useSingleEmailThread={emailInfo.useSingleEmailThread}
          toggleUseSingleEmailThread={this.toggleUseEmailThread}
          showCheckbox={showSingleThreadCheckbox}
        />

        <SenderText sender={SENDER} />
        <SubjectInputText
          setSubject={this.setSubject}
          subject={emailInfo.subject}
        />
        {this.maybeRenderShareWithCurrentFilterBlock()}
        <MessageInputText
          setMessage={this.setMessage}
          message={emailInfo.message}
        />
        {this.renderAttachmentControls()}
        {this.maybeRenderConfirmModal()}
      </div>
    );
  }
}
