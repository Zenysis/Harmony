// @flow
import * as React from 'react';

import AttachmentCheckbox from 'components/common/SharingUtil/ShareByEmailUtil/AttachmentCheckbox';
import Checkbox from 'components/ui/Checkbox/index';
import ConfirmExternalRecipientsModal from 'components/common/SharingUtil/ShareByEmailUtil/ShareEmailFormControls/ConfirmExternalRecipientsModal';
import DownloadableQueryResult from 'components/common/SharingUtil/DownloadableQueryResult';
import I18N from 'lib/I18N';
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

const IMAGE_SIZE = DOWNLOAD_SIZE_DIMENSIONS.fullscreen;
const SENDER = window.__JSON_FROM_BACKEND.user.username;

type Props = {
  closeConfirmModal: () => void,
  emailInfo: EmailInfo,
  errorTextArr: Array<{ key: string, value: string }>,
  onConfirmSendEmail: () => void,
  onEmailInfoChange: (emailInfo: EmailInfo) => void,
  queryResultSpec: QueryResultSpec,
  querySelections: QuerySelections,
  showConfirmModal: boolean,
  viewType: ResultViewType,
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
          content,
          filename,
        },
      },
    });
  }

  @autobind
  resetAttachmentToEmail() {
    this.props.onEmailInfoChange({
      ...this.props.emailInfo,
      attachmentOptions: [],
      attachments: {},
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
      closeConfirmModal,
      emailInfo,
      onConfirmSendEmail,
      showConfirmModal,
    } = this.props;
    return (
      <ConfirmExternalRecipientsModal
        closeConfirmModal={closeConfirmModal}
        externalRecipients={emailInfo.externalRecipients}
        onConfirmSendEmail={onConfirmSendEmail}
        showConfirmModal={showConfirmModal}
      />
    );
  }

  renderEmbedImageCheckbox(): React.Node {
    const { emailInfo } = this.props;
    return (
      <Checkbox
        className="share-message-label"
        label={I18N.text('Embed image')}
        labelPlacement="right"
        onChange={this.toggleEmbedImageValue}
        value={emailInfo.isEmbedImage}
      />
    );
  }

  renderAttachDataDropdown(): React.Node {
    const { emailInfo, queryResultSpec, querySelections } = this.props;

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
          onUserGroupChange={this.onGroupsChange}
          recipients={emailInfo.recipients}
          selectedGroups={selectedGroups}
          setRecipients={this.setRecipients}
        />
        <SenderText sender={SENDER} />
        <SubjectInputText
          setSubject={this.setSubject}
          subject={emailInfo.subject}
        />
        <MessageInputText
          message={emailInfo.message}
          setMessage={this.setMessage}
        />
        {this.renderEmbedImageCheckbox()}
        {this.renderAttachDataDropdown()}
        {this.maybeRenderConfirmModal()}
        {this.maybeRenderQueryResult()}
      </div>
    );
  }
}
