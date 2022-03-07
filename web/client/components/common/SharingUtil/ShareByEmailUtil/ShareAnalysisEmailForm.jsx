// @flow
import * as React from 'react';

import AttachmentCheckbox from 'components/common/SharingUtil/ShareByEmailUtil/AttachmentCheckbox';
import Checkbox from 'components/ui/Checkbox/index';
import ConfirmExternalRecipientsModal from 'components/common/SharingUtil/ShareByEmailUtil/ShareEmailFormControls/ConfirmExternalRecipientsModal';
import DownloadableQueryResult from 'components/common/SharingUtil/DownloadableQueryResult';
import MessageInputText from 'components/common/SharingUtil/ShareByEmailUtil/ShareEmailFormControls/MessageInputText';
import RecipientInputText from 'components/common/SharingUtil/ShareByEmailUtil/ShareEmailFormControls/RecipientInputText';
import SecurityGroup from 'services/models/SecurityGroup';
import SenderText from 'components/common/SharingUtil/ShareByEmailUtil/ShareEmailFormControls/SenderText';
import SubjectInputText from 'components/common/SharingUtil/ShareByEmailUtil/ShareEmailFormControls/SubjectInputText';
import autobind from 'decorators/autobind';
import { DOWNLOAD_SIZE_DIMENSIONS } from 'components/AdvancedQueryApp/LiveResultsView/QueryResultActionButtons/ShareQueryModal/constants';
import { render2canvas } from 'components/common/SharingUtil/canvas_util';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type QuerySelections from 'models/core/wip/QuerySelections';
import type {
  ExportSelection,
  EmailInfo,
} from 'components/common/SharingUtil/types';
import type { ResultViewType } from 'components/QueryResult/viewTypes';

const TEXT = t('query_result.common.share_analysis');
const IMAGE_SIZE = DOWNLOAD_SIZE_DIMENSIONS.fullscreen;
const SENDER = window.__JSON_FROM_BACKEND.user.username;

type Props = {
  queryResultSpec: QueryResultSpec,
  querySelections: QuerySelections,
  viewType: ResultViewType,
  closeConfirmModal: () => void,
  onConfirmSendEmail: () => void,
  showConfirmModal: boolean,
  onEmailInfoChange: (emailInfo: EmailInfo) => void,
  emailInfo: EmailInfo,
  errorTextArr: Array<{ key: string, value: string }>,
};

type State = {
  isRenderingImage: boolean,
};

export default class ShareAnalysisEmailForm extends React.PureComponent<
  Props,
  State,
> {
  state: State = {
    isRenderingImage: false,
  };

  @autobind
  addAttachmentToEmail(
    exportSelection: string,
    filename: string,
    content: string,
  ) {
    this.props.onEmailInfoChange({
      ...this.props.emailInfo,
      attachments: {
        ...this.props.emailInfo.attachments,
        [exportSelection]: {
          filename,
          content,
        },
      },
    });
  }

  @autobind
  resetAttachmentToEmail() {
    this.props.onEmailInfoChange({
      ...this.props.emailInfo,
      attachments: {},
      attachmentOptions: [],
    });
  }

  @autobind
  setSelectedAttachments(selectedValues: $ReadOnlyArray<ExportSelection>) {
    this.props.onEmailInfoChange({
      ...this.props.emailInfo,
      attachmentOptions: selectedValues,
    });
  }

  @autobind
  setEmbeddedImage(elt: HTMLDivElement) {
    const visualizationContainer = elt.getElementsByClassName(
      'visualization-container',
    )[0];

    render2canvas(visualizationContainer)
      .then(canvas => {
        const imageBase64Url = canvas.toDataURL();
        this.props.onEmailInfoChange({
          ...this.props.emailInfo,
          imageUrl: imageBase64Url,
        });
      })
      .finally(() => {
        this.setState({
          isRenderingImage: false,
        });
      });
  }

  @autobind
  setRecipients(
    recipients: $ReadOnlyArray<string>,
    externalRecipients: $ReadOnlyArray<string>,
  ) {
    this.props.onEmailInfoChange({
      ...this.props.emailInfo,
      externalRecipients,
      recipients,
    });
  }

  @autobind
  resetEmbeddedImage(shouldAttachImage: boolean) {
    if (!shouldAttachImage) {
      this.props.onEmailInfoChange({
        ...this.props.emailInfo,
        imageUrl: '',
        isEmbedImage: shouldAttachImage,
      });
    } else {
      this.props.onEmailInfoChange({
        ...this.props.emailInfo,
        isEmbedImage: shouldAttachImage,
      });
    }
  }

  @autobind
  toggleEmbedImageValue() {
    const { emailInfo } = this.props;
    this.resetEmbeddedImage(!emailInfo.isEmbedImage);
    this.setState({ isRenderingImage: !emailInfo.isEmbedImage });
  }

  @autobind
  setSubject(subject: string) {
    this.props.onEmailInfoChange({
      ...this.props.emailInfo,
      subject,
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

  maybeRenderQueryResult(): React.Node {
    const { queryResultSpec, querySelections, viewType } = this.props;

    if (!this.state.isRenderingImage) {
      return null;
    }

    return (
      <DownloadableQueryResult
        onRender={this.setEmbeddedImage}
        queryResultSpec={queryResultSpec}
        querySelections={querySelections}
        viewType={viewType}
        {...IMAGE_SIZE}
      />
    );
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
        onConfirmSendEmail={onConfirmSendEmail}
      />
    );
  }

  renderEmbedImageCheckbox(): React.Node {
    const { emailInfo } = this.props;
    return (
      <Checkbox
        className="share-message-label"
        value={emailInfo.isEmbedImage}
        onChange={this.toggleEmbedImageValue}
        label={TEXT.embedImageText}
        labelPlacement="right"
      />
    );
  }

  renderAttachDataDropdown(): React.Node {
    const { queryResultSpec, querySelections, emailInfo } = this.props;

    return (
      <AttachmentCheckbox
        addAttachmentToEmail={this.addAttachmentToEmail}
        isDataAttached={emailInfo.attachmentOptions.length > 0}
        queryResultSpec={queryResultSpec}
        querySelections={querySelections}
        resetAttachmentToEmail={this.resetAttachmentToEmail}
        setSelectedAttachments={this.setSelectedAttachments}
      />
    );
  }

  render(): React.Node {
    const { emailInfo } = this.props;
    const selectedGroups = emailInfo.recipientUserGroups.map(grp => grp.name());
    return (
      <div>
        {this.maybeRenderErrorText()}
        <RecipientInputText
          recipients={emailInfo.recipients}
          setRecipients={this.setRecipients}
          selectedGroups={selectedGroups}
          onUserGroupChange={this.onGroupsChange}
        />
        <SenderText sender={SENDER} />
        <SubjectInputText
          setSubject={this.setSubject}
          subject={emailInfo.subject}
        />
        <MessageInputText
          setMessage={this.setMessage}
          message={emailInfo.message}
        />
        {this.renderEmbedImageCheckbox()}
        {this.renderAttachDataDropdown()}
        {this.maybeRenderConfirmModal()}
        {this.maybeRenderQueryResult()}
      </div>
    );
  }
}
