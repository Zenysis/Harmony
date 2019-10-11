// @flow
import * as React from 'react';

import APIService, { API_VERSION } from 'services/APIService';
import BaseModal from 'components/ui/BaseModal';
import Checkbox from 'components/ui/Checkbox/index';
import DirectoryService from 'services/DirectoryService';
import DownloadableQueryResult from 'components/QueryResult/QueryResultActionButtons/DownloadableQueryResult';
import Dropdown from 'components/ui/Dropdown';
import EmailAttachmentDropdown from 'components/QueryResult/QueryResultActionButtons/ShareAnalysisModal/EmailAttachmentDropdown';
import GraphSearchResults from 'models/ui/common/GraphSearchResults';
import InfoTooltip from 'components/ui/InfoTooltip/index';
import InputText from 'components/ui/InputText';
import LabelWrapper from 'components/ui/LabelWrapper';
import Option from 'components/ui/Dropdown/Option';
import User from 'services/models/User';
import ZenArray from 'util/ZenModel/ZenArray';
import autobind from 'decorators/autobind';
import { DOWNLOAD_SIZE_DIMENSIONS } from 'components/QueryResult/QueryResultActionButtons/DownloadQueryModal/constants';
import { render2canvas } from 'components/QueryResult/QueryResultActionButtons/canvas_util';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type QuerySelections from 'models/core/wip/QuerySelections';
import type SimpleQuerySelections from 'models/core/SimpleQuerySelections';
import type { ExportSelection } from 'components/QueryResult/QueryResultActionButtons/ExportButton/constants';
import type { ResultViewType } from 'components/QueryResult/viewTypes';

const EMAIL_PATTERN = '(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$)';
const EMAIL_REGEX = RegExp(EMAIL_PATTERN);

const TEXT = t('query_result.common.share_analysis');

const PLATFORM = window.__JSON_FROM_BACKEND.ui.fullPlatformName;
const SENDER = window.__JSON_FROM_BACKEND.user.username;
const FULLNAME = window.__JSON_FROM_BACKEND.user.fullName;

const ENDPOINT = '/share/email';

const IMAGE_SIZE = DOWNLOAD_SIZE_DIMENSIONS.fullscreen;

type Props = {
  showModal: boolean,
  onRequestClose: () => void,
  getUsers: () => Promise<ZenArray<User>>,
  queryResultSpec: QueryResultSpec,
  querySelections: QuerySelections | SimpleQuerySelections,
  viewType: ResultViewType,
};

type State = {
  errorTextArr: Array<{ key: string, value: string }>,
  recipientInputText: string,
  recipients: Array<string>,
  isRenderingImage: boolean,
  isEmbedImage: boolean,
  message: string,
  subject: string,
  users: ZenArray<User>,
  filteredUserOptions: Array<{ key: string, value: string }>,
  showDropdown: boolean,
  imageToEmbed: string,
  showConfirmModal: boolean,
  externalRecipients: Array<string>,
  attachmentOptions: $ReadOnlyArray<ExportSelection>,
  attachments: { [key: string]: ExportSelection },
};

export default class ShareByEmailModal extends React.PureComponent<
  Props,
  State,
> {
  state: State = {
    errorTextArr: [],
    recipientInputText: '',
    recipients: [],
    subject: `${PLATFORM} ${TEXT.defaultSubject}`,
    message: TEXT.messageTemplate
      .replace('{PLATFORM_NAME}', PLATFORM)
      .replace('{YOUR_NAME}', FULLNAME),
    isRenderingImage: false,
    isEmbedImage: false,
    users: ZenArray.create(),
    filteredUserOptions: [],
    showDropdown: false,
    imageToEmbed: '',
    showConfirmModal: false,
    externalRecipients: [],
    attachmentOptions: [],
    attachments: {},
  };

  static defaultProps = {
    getUsers: () =>
      DirectoryService.getUsers().then(users => ZenArray.create(users)),
  };

  componentDidMount(): void {
    // Get all users
    this.props.getUsers().then((users: ZenArray<User>) => {
      this.setState({ users });
    });
  }

  @autobind
  searchUsers(searchTerm: string) {
    const { users } = this.state;
    const filteredUserOptions = users
      .filter(
        user =>
          searchTerm.length !== 0 &&
          user
            .username()
            .toLowerCase()
            .includes(searchTerm.toLowerCase()),
      )
      .map(user => ({
        key: user.username(),
        value: user.username(),
      }))
      .toArray();
    this.setState({
      filteredUserOptions,
      showDropdown: !filteredUserOptions.length !== 0,
    });
  }

  isEmailValid(email: string): boolean {
    return EMAIL_REGEX.test(email);
  }

  isEmpty(value: string): boolean {
    return value.length === 0;
  }

  inputsAreValid(isPreview: boolean = false): boolean {
    const errors = [];
    const { recipientInputText, recipients, message, subject } = this.state;
    if (this.isEmpty(message))
      errors.push({ key: 'message', value: TEXT.errors.emptyMessage });
    if (this.isEmpty(subject))
      errors.push({ key: 'subject', value: TEXT.errors.emptySubject });
    if (this.isEmpty(recipientInputText) && !isPreview)
      errors.push({ key: 'to', value: TEXT.errors.emptyRecipient });

    recipients.forEach(email => {
      if (!this.isEmailValid(email)) {
        errors.push({
          key: email,
          value: `${email} ${TEXT.errors.invalidEmail}`,
        });
      }
    });
    if (errors.length !== 0) {
      this.setState({ errorTextArr: errors });
      return false;
    }
    return true;
  }

  @autobind
  sendEmail(isPreview: boolean) {
    const attachments = this.state.attachmentOptions.map(
      exportSelection => this.state.attachments[exportSelection],
    );

    let imageUrl = '';
    if (this.state.isEmbedImage) {
      imageUrl = this.state.imageToEmbed;
    }
    const recipients = isPreview ? [SENDER] : this.state.recipients;
    const emailData = {
      subject: this.state.subject,
      recipients,
      sender: SENDER,
      message: this.state.message,
      queryUrl: document.location.href,
      attachments,
      imageUrl,
      isPreview,
    };

    APIService.post(API_VERSION.V2, ENDPOINT, emailData)
      .then(response => window.toastr.success(response.message))
      .catch(e => {
        window.toastr.error(TEXT.errors.shareFailureMessage);
        // eslint-disable-next-line no-console
        console.error(e.message);
      });
    if (!isPreview) {
      this.props.onRequestClose();
      this.closeConfirmModal();
    }
    analytics.track('Shared Analysis via Email', {
      numberOfRecipients: recipients.length,
      recipients,
      dataExportTypes: this.state.attachmentOptions,
      isImageEmbedded: this.state.isEmbedImage,
      isPreviewEmail: isPreview,
      emailSender: SENDER,
    });
  }

  @autobind
  closeConfirmModal() {
    this.setState({
      showConfirmModal: false,
    });
  }

  @autobind
  setAttachments(exportSelection: string, filename: string, content: string) {
    this.setState(prevState => ({
      attachments: {
        ...prevState.attachments,
        [exportSelection]: {
          filename,
          content,
        },
      },
    }));
  }

  @autobind
  setSelectedAttachments(selectedValues: $ReadOnlyArray<ExportSelection>) {
    this.setState({
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
        this.setState({ imageToEmbed: imageBase64Url });
      })
      .finally(() => {
        this.setState({
          isRenderingImage: false,
        });
      });
  }

  @autobind
  toggleEmbedImageValue() {
    this.setState(prevState => ({
      isRenderingImage: !prevState.isRenderingImage,
      isEmbedImage: !prevState.isEmbedImage,
    }));
  }

  @autobind
  sendNonPreviewEmailClick() {
    this.sendEmail(false);
  }

  @autobind
  onRecipientChange(value: string) {
    const newValue = value.toLowerCase().trim();
    const email = newValue.split(',').pop();
    this.searchUsers(email);
    this.setState({
      recipientInputText: newValue,
      recipients: newValue.split(','),
    });
  }

  @autobind
  onSubjectChange(value: string) {
    this.setState({ subject: value });
  }

  @autobind
  onSubmitShareViaEmailClick() {
    if (!this.inputsAreValid()) {
      return;
    }
    // Check for external recipients
    const { recipients, users } = this.state;
    const userEmails = users.map(user => user.username());
    const externalRecipients = recipients.filter(
      email => !userEmails.includes(email),
    );
    if (externalRecipients.length !== 0) {
      this.setState({
        externalRecipients,
        showConfirmModal: true,
      });
    } else {
      this.sendEmail(false);
    }
  }

  @autobind
  onSubmitPreviewEmail() {
    if (!this.inputsAreValid(true)) {
      return;
    }
    this.sendEmail(true);
  }

  @autobind
  onMessageChange(event: SyntheticEvent<HTMLTextAreaElement>) {
    const inputNode = event.target;
    if (inputNode instanceof HTMLTextAreaElement) {
      this.setState({ message: inputNode.value });
    }
  }

  @autobind
  onSelectedMatchingEmail(selectedValue: string) {
    const { recipientInputText } = this.state;
    const recipients = recipientInputText.split(',');
    recipients.pop();
    recipients.push(selectedValue.toLowerCase());
    this.setState({
      filteredUserOptions: [],
      showDropdown: false,
      recipients,
      recipientInputText: recipients.join(','),
    });
  }

  @autobind
  maybeRenderErrorText() {
    const errorList = this.state.errorTextArr.map(({ key, value }) => (
      <li key={key}>{value}</li>
    ));
    if (this.state.errorTextArr.length !== 0) {
      return <ul className="create-alert-error-text">{errorList}</ul>;
    }
    return null;
  }

  maybeRenderEmailsDropdown() {
    const emptyArry = ZenArray.create().toArray();
    const { filteredUserOptions } = this.state;
    const optionItems = filteredUserOptions.map(user => (
      <Option key={user.key} value={user.value}>
        {user.value}
      </Option>
    ));

    if (this.state.showDropdown) {
      const searchResults = new GraphSearchResults<string, string>();
      return (
        <div className="zen-dropdown__menu zen-dropdown__menu--open">
          <Dropdown.OptionsList
            allChildrenSelected
            enableSelectAll={false}
            displayCurrentSelection
            multiselect={false}
            marginPerLevel=""
            useSearch={false}
            searchText=""
            onOptionsGroupClick={() => {}}
            onOptionClick={this.onSelectedMatchingEmail}
            openGroups={new Set([])}
            searchResults={searchResults}
            noOptionsContent={TEXT.noUsersPlaceholder}
            emptyOptionsGroupContent={TEXT.noUsersPlaceholder}
            selectedValues={emptyArry}
          >
            {optionItems}
          </Dropdown.OptionsList>
        </div>
      );
    }
    return null;
  }

  maybeRenderQueryResult() {
    const { isRenderingImage } = this.state;
    const { queryResultSpec, querySelections, viewType } = this.props;

    if (!isRenderingImage) {
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

  maybeRenderConfirmModal() {
    const { externalRecipients } = this.state;
    const modalBody = (
      <div>
        <p>{TEXT.confirmationMessage}</p>
        {externalRecipients.map(email => (
          <p className="external-recipients" key={email}>
            {email}
          </p>
        ))}
        <p>{TEXT.confirmationText}</p>
      </div>
    );
    if (this.state.showConfirmModal) {
      return (
        <BaseModal
          show={this.state.showConfirmModal}
          onRequestClose={this.closeConfirmModal}
          primaryButtonText={TEXT.primaryButtonText}
          onPrimaryAction={this.sendNonPreviewEmailClick}
          width={600}
          defaultHeight={1000}
          title={TEXT.confirmationModalText}
        >
          {modalBody}
        </BaseModal>
      );
    }
    return null;
  }

  renderSubjectInput() {
    return (
      <LabelWrapper className="share-message-label" label={TEXT.subjectText}>
        <InputText
          value={this.state.subject}
          onChange={this.onSubjectChange}
          placeholder={TEXT.subjectPlaceholder}
        />
      </LabelWrapper>
    );
  }

  renderSenderText() {
    return (
      <LabelWrapper inline className="share-message-label" label={TEXT.replyTo}>
        <div>
          {SENDER}
          <InfoTooltip text={TEXT.replyToInfoTip} />
        </div>
      </LabelWrapper>
    );
  }

  renderMessagePanel() {
    return (
      <LabelWrapper className="share-message-label" label={TEXT.emailMessage}>
        <textarea
          name="share-message-panel"
          onChange={this.onMessageChange}
          rows="8"
          className="form-control"
          value={this.state.message}
        />
      </LabelWrapper>
    );
  }

  renderEmbedImageCheckbox() {
    return (
      <Checkbox
        className="share-message-label"
        value={this.state.isEmbedImage}
        onChange={this.toggleEmbedImageValue}
        label={TEXT.embedImageText}
        labelPlacement="left"
      />
    );
  }

  renderRecipientInput() {
    return (
      <div>
        <LabelWrapper label={TEXT.sendTo}>
          <InputText
            value={this.state.recipientInputText}
            onChange={this.onRecipientChange}
            placeholder={TEXT.sendToPlaceholder}
          />
        </LabelWrapper>
        {this.maybeRenderEmailsDropdown()}
      </div>
    );
  }

  renderAttachDataDropdown() {
    const { queryResultSpec, querySelections } = this.props;
    return (
      <EmailAttachmentDropdown
        queryResultSpec={queryResultSpec}
        querySelections={querySelections}
        setAttachments={this.setAttachments}
        attachmentOptions={this.state.attachmentOptions}
        setSelectedAttachments={this.setSelectedAttachments}
      />
    );
  }

  renderModalBody() {
    return (
      <div className="share-analysis-panel">
        {this.maybeRenderErrorText()}
        {this.renderRecipientInput()}
        {this.renderSenderText()}
        {this.renderSubjectInput()}
        {this.renderMessagePanel()}
        {this.renderEmbedImageCheckbox()}
        {this.renderAttachDataDropdown()}
        {this.maybeRenderQueryResult()}
        {this.maybeRenderConfirmModal()}
      </div>
    );
  }

  render() {
    return (
      <BaseModal
        show={this.props.showModal}
        onRequestClose={this.props.onRequestClose}
        primaryButtonText={TEXT.primaryButtonText}
        onPrimaryAction={this.onSubmitShareViaEmailClick}
        onSecondaryAction={this.onSubmitPreviewEmail}
        width={600}
        defaultHeight={1000}
        title={TEXT.title}
        titleTooltip={TEXT.titleToolTip}
        showSecondaryButton
        secondaryButtonIntent="primary"
        secondaryButtonText={TEXT.secondaryButtonText}
      >
        {this.renderModalBody()}
      </BaseModal>
    );
  }
}
