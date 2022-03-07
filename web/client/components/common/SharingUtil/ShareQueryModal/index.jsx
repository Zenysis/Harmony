// @flow
import * as React from 'react';
import Promise from 'bluebird';
import invariant from 'invariant';

import * as Zen from 'lib/Zen';
import DownloadDataTab from 'components/AdvancedQueryApp/LiveResultsView/QueryResultActionButtons/ShareQueryModal/DownloadDataTab';
import DownloadImageTab from 'components/AdvancedQueryApp/LiveResultsView/QueryResultActionButtons/ShareQueryModal/DownloadImageTab';
import I18N from 'lib/I18N';
import LoadingSpinner from 'components/ui/LoadingSpinner';
import QuerySessionService from 'services/QuerySessionService';
import SendEmailService from 'services/SendEmailService';
import ShareAnalysisEmailForm from 'components/common/SharingUtil/ShareByEmailUtil/ShareAnalysisEmailForm';
import Spacing from 'components/ui/Spacing';
import StaticSelectableTextbox from 'components/common/StaticSelectableTextbox';
import Tab from 'components/ui/Tabs/Tab';
import TabbedModal from 'components/ui/TabbedModal';
import TableQueryResultState from 'models/visualizations/Table/TableQueryResultState';
import Toaster from 'components/ui/Toaster';
import Tooltip from 'components/ui/Tooltip';
import autobind from 'decorators/autobind';
import exportQueryData from 'components/common/SharingUtil/exportQueryData';
import exportToFHIRXML from 'components/common/SharingUtil/ShareQueryModal/exportToFHIR';
import findVisualizationContainerElt from 'components/common/findVisualizationContainerElt';
import getFieldsFromQueryResultSpec from 'components/common/SharingUtil/getFieldsFromQueryResultSpec';
import memoizeOne from 'decorators/memoizeOne';
import { cancelPromises } from 'util/promiseUtil';
import {
  copyTextToClipboard,
  validateInputs,
} from 'components/common/SharingUtil/sharingUtil';
import { uniqueId } from 'util/util';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type QuerySelections from 'models/core/wip/QuerySelections';
import type { EmailInfo } from 'components/common/SharingUtil/types';
import type { ResultViewType } from 'components/QueryResult/viewTypes';
import type { VisualizationType } from 'models/AdvancedQueryApp/VisualizationType/types';

const PLATFORM = window.__JSON_FROM_BACKEND.ui.fullPlatformName;
const SENDER = window.__JSON_FROM_BACKEND.user.username;
const FULLNAME = window.__JSON_FROM_BACKEND.user.fullName;

type DefaultProps = {
  sendQueryDataEmail: typeof SendEmailService.sendQueryDataEmail,
  storeQuerySession: typeof QuerySessionService.storeQuerySession,
};

type Props = {
  ...DefaultProps,
  onRequestClose: () => void,
  queryResultSpec: QueryResultSpec | void,
  querySelections: QuerySelections,

  /**
   * Whether or not to show the modal. The user of this component must use this
   * prop rather than showing/hiding the modal itself. Some promises will
   * complete after the modal is closed meaning that if this component is not
   * still mounted then the download will not be completed.
   */
  show: boolean,
  viewType: ResultViewType,
  visualizationType: VisualizationType | void,
};

type State = {
  downloadExcelData: boolean,
  downloadFHIRData: boolean,
  downloadFieldMappingData: boolean,
  downloadRawCSVData: boolean,
  emailInfo: EmailInfo,
  errorTextArr: Array<{ key: string, value: string }>,
  imageIsDownloading: boolean,
  loadingShareableLink: boolean,
  selectedTabName: string,
  sendingPreviewEmail: boolean,
  shareableLink: string,
  showConfirmModal: boolean,
};

type TabbedModalProps = React.ElementConfig<typeof TabbedModal>;

type PrimaryButtonModalProps = {
  disablePrimaryButton: $PropertyType<TabbedModalProps, 'disablePrimaryButton'>,
  onPrimaryAction: $PropertyType<TabbedModalProps, 'onPrimaryAction'>,
  primaryButtonText: $PropertyType<TabbedModalProps, 'primaryButtonText'>,
};

type SecondaryButtonModalProps = {
  ...PrimaryButtonModalProps,
  disableSecondaryButton: $PropertyType<
    TabbedModalProps,
    'disableSecondaryButton',
  >,
  onSecondaryAction: $PropertyType<TabbedModalProps, 'onSecondaryAction'>,
  secondaryButtonIntent: $PropertyType<
    TabbedModalProps,
    'secondaryButtonIntent',
  >,
  secondaryButtonText: $PropertyType<TabbedModalProps, 'secondaryButtonText'>,
  showSecondaryButton: $PropertyType<TabbedModalProps, 'showSecondaryButton'>,
};

const DOWNLOAD_ITEM_STATE_VARIABLES = [
  'downloadExcelData',
  'downloadFieldMappingData',
  'downloadFHIRData',
  'downloadRawCSVData',
];

export default class ShareQueryModal extends React.PureComponent<Props, State> {
  state: State = {
    downloadExcelData: false,
    downloadFHIRData: false,
    downloadFieldMappingData: false,
    downloadRawCSVData: false,
    emailInfo: this.getDefaultEmailInfo(),
    errorTextArr: [],
    imageIsDownloading: false,
    loadingShareableLink: false,
    selectedTabName: I18N.text('Email'),
    sendingPreviewEmail: false,
    shareableLink: '',
    showConfirmModal: false,
  };

  static defaultProps: DefaultProps = {
    sendQueryDataEmail: SendEmailService.sendQueryDataEmail,
    storeQuerySession: QuerySessionService.storeQuerySession,
  };

  _queryPromises: { [string]: Promise<mixed>, ... } = {};
  _ref: $ElementRefObject<'span'> = React.createRef();

  componentDidMount() {
    const {
      queryResultSpec,
      querySelections,
      show,
      storeQuerySession,
      viewType,
      visualizationType,
    } = this.props;
    if (show && queryResultSpec && visualizationType !== undefined) {
      this.updateShareURL(
        queryResultSpec,
        querySelections,
        viewType,
        visualizationType,
        storeQuerySession,
      );
    }
  }

  componentDidUpdate() {
    const {
      queryResultSpec,
      querySelections,
      show,
      storeQuerySession,
      viewType,
      visualizationType,
    } = this.props;
    if (show && queryResultSpec && visualizationType !== undefined) {
      this.updateShareURL(
        queryResultSpec,
        querySelections,
        viewType,
        visualizationType,
        storeQuerySession,
      );
      this.clearAttachmentsIfNeeded(queryResultSpec, querySelections, viewType);
    }
  }

  componentWillUnmount() {
    cancelPromises(this._queryPromises);
  }

  getDefaultEmailInfo(): EmailInfo {
    return {
      attachmentOptions: [],
      attachments: {},
      externalRecipients: [],
      imageUrl: '',
      isEmbedImage: false,
      message: I18N.text(
        'Hi, \n\nPlease find an analysis I made in %(platformName)s attached.\n\nThank you,\n%(yourName)s',
        'email-message',
        { platformName: PLATFORM, yourName: FULLNAME },
      ),
      recipientUserGroups: [],
      recipients: [],
      sender: SENDER,
      subject: `${PLATFORM} ${I18N.text('Analysis Shared')}`,
    };
  }

  @memoizeOne
  updateShareURL(
    queryResultSpec: QueryResultSpec,
    querySelections: QuerySelections,
    viewType: ResultViewType,
    visualizationType: VisualizationType,
    // eslint-disable-next-line no-use-before-define
    storeQuerySession: typeof QuerySessionService.storeQuerySession,
  ): Promise<void> {
    // NOTE(stephen): Accessing this.setState inside this function is safe even
    // though it is memoized.
    // First, clear the previously stored URL since it is now invalid.
    this.setState({ loadingShareableLink: true, shareableLink: '' });

    invariant(
      visualizationType !== undefined,
      'Visualization type must exist when sharing a query',
    );

    // Retrieve a new URL and update the state.
    return storeQuerySession(
      queryResultSpec,
      querySelections,
      viewType,
      visualizationType,
      window.__JSON_FROM_BACKEND.user.id,
    )
      .then(
        queryHash =>
          `${document.location.origin}/advanced-query#h=${queryHash}`,
      )
      .then(shareableLink => {
        this.setState({ shareableLink, loadingShareableLink: false });
      });
  }

  // HACK(stephen): Due to the mix of controlled and uncontrolled components
  // that are below the ShareQueryModal, it is very difficult to keep
  // attachments synchronized when the query changes. To ensure that stale data
  // does not get sent out, we clear out all attachments (and attachment related
  // properties) when the user's query state has changed.
  // TODO(solo, stephen): The flow of all of this is not great. It is impossible
  // for this component to coordinate the generation of attachments, which makes
  // it impossible for them to be automatically synchronized when the query
  // state changes. In addition, it is frustrating as a user to have pauses and
  // loading bars just after clicking the check boxes. The data should be lazily
  // created *right after* the user click's Send.
  @memoizeOne
  clearAttachmentsIfNeeded(
    /* eslint-disable no-unused-vars */
    queryResultSpec: QueryResultSpec,
    querySelections: QuerySelections,
    viewType: ResultViewType,
    /* eslint-enable no-unused-vars */
  ) {
    // Clear all attachments (and related properties like embedding an image,
    // which is kind of an attachment but gets stored very differently).
    // NOTE(stephen): It is ok to access `this.setState` inside this memoized
    // function.
    this.setState(({ emailInfo }) => ({
      emailInfo: {
        ...emailInfo,
        attachmentOptions: [],
        attachments: {},
        imageUrl: '',
        isEmbedImage: false,
      },
    }));
  }

  setErrorState(isPreview: boolean = false, callback: () => void): void {
    this.setState(prevState => {
      const {
        message,
        recipientUserGroups,
        recipients,
        subject,
      } = prevState.emailInfo;
      const errors = validateInputs(
        recipients,
        message,
        subject,
        isPreview,
        recipientUserGroups.map(group => group.name()),
      );
      return { errorTextArr: errors };
    }, callback);
  }

  @autobind
  sendEmail(isPreview: boolean) {
    const {
      attachmentOptions,
      isEmbedImage,
      message,
      recipientUserGroups,
      sender,
      subject,
    } = this.state.emailInfo;
    const attachments = attachmentOptions.map(
      exportSelection => this.state.emailInfo.attachments[exportSelection],
    );

    const imageUrl = isEmbedImage ? this.state.emailInfo.imageUrl : '';
    const recipients = isPreview ? [SENDER] : this.state.emailInfo.recipients;

    Toaster.notify(I18N.text('Your analysis will be shared shortly'));

    this.props
      .sendQueryDataEmail(
        subject,
        recipients,
        sender,
        message,
        isPreview,
        imageUrl,
        this.state.shareableLink,
        attachments,
        attachmentOptions,
        recipientUserGroups,
      )
      .catch(e => {
        Toaster.error(
          I18N.text('Analysis sharing did not happen successfully'),
        );
        // eslint-disable-next-line no-console
        console.error(e.message);
      })
      .finally(() =>
        this.setState(prevState => ({
          emailInfo: isPreview
            ? prevState.emailInfo
            : this.getDefaultEmailInfo(),
          sendingPreviewEmail: false,
        })),
      );

    if (!isPreview) {
      this.props.onRequestClose();
    }
  }

  @autobind
  closeConfirmModal() {
    this.setState({
      showConfirmModal: false,
    });
  }

  @autobind
  exportFieldMapping(): void {
    const { downloadFieldMappingData } = this.state;
    if (!downloadFieldMappingData) {
      return;
    }
    analytics.track('Export field mapping');
    window.location.href = '/api/fields.csv';
    Toaster.success(t('QueryApp.ExportButton').successMessage);
    this.setState({ downloadFieldMappingData: false });
  }

  @autobind
  getVisualizationContainerElt(): HTMLElement {
    const vizContainerElt = findVisualizationContainerElt(this._ref);
    invariant(
      vizContainerElt !== undefined,
      'Viz container must exist if we are exporting a screenshot.',
    );
    return vizContainerElt;
  }

  @autobind
  downloadImage() {
    Toaster.notify(
      I18N.text('Your data will download shortly, check the download folder'),
    );
    this.setState({ imageIsDownloading: true });
  }

  @autobind
  copyToClipboard(): void {
    const { shareableLink } = this.state;
    if (shareableLink.length === 0) {
      Toaster.error(
        I18N.text(
          'Failed to copy link. Click generate button to generate link',
        ),
      );
      return;
    }
    copyTextToClipboard(shareableLink);
  }

  @autobind
  updateCurrentTab(selectedTabName: string): void {
    // TODO: (solomon, david): Create a controlled version of the TabsModal component
    // and use it here so that this is single source of truth for the selectedTab state.
    this.setState({ selectedTabName });
  }

  @autobind
  toggleDownloadFHIRData() {
    this.setState(prevState => ({
      downloadFHIRData: !prevState.downloadFHIRData,
    }));
  }

  @autobind
  toggleDownloadExcelData() {
    this.setState(prevState => ({
      downloadExcelData: !prevState.downloadExcelData,
    }));
  }

  @autobind
  toggleDownloadRawCSVData() {
    this.setState(prevState => ({
      downloadRawCSVData: !prevState.downloadRawCSVData,
    }));
  }

  @autobind
  toggleDownloadFieldMappings() {
    this.setState(prevState => ({
      downloadFieldMappingData: !prevState.downloadFieldMappingData,
    }));
  }

  buildEmailModalProps(): SecondaryButtonModalProps {
    const { emailInfo, loadingShareableLink, sendingPreviewEmail } = this.state;
    const { imageUrl, isEmbedImage } = emailInfo;
    const isGeneratingImage = isEmbedImage && imageUrl.length === 0;

    // Disable the buttons if the content needed for the email has not been
    // fully loaded.
    const disableButtons =
      loadingShareableLink || isGeneratingImage || sendingPreviewEmail;

    let secondaryButtonTooltipText = I18N.text(
      'A preview email will be sent to your email address only',
    );
    if (disableButtons) {
      secondaryButtonTooltipText =
        isGeneratingImage || loadingShareableLink
          ? `${I18N.text('Attaching')}...`
          : `${I18N.text('Sending')}...`;
    }

    const secondaryButtonText = (
      <Tooltip content={secondaryButtonTooltipText} tooltipPlacement="top">
        <I18N>Send Preview</I18N>
      </Tooltip>
    );

    return {
      secondaryButtonText,
      disablePrimaryButton: disableButtons,
      disableSecondaryButton: disableButtons,
      onPrimaryAction: this.onSubmitShareViaEmailClick,
      onSecondaryAction: this.onSubmitPreviewEmail,
      primaryButtonText: isGeneratingImage
        ? `${I18N.textById('Attaching')}...`
        : I18N.text('Send'),
      secondaryButtonIntent: 'primary',
      showSecondaryButton: true,
    };
  }

  buildLinkModalProps(): PrimaryButtonModalProps {
    return {
      disablePrimaryButton: this.state.loadingShareableLink,
      onPrimaryAction: this.copyToClipboard,
      primaryButtonText: I18N.text('Copy link to clipboard'),
    };
  }

  buildDownloadDataModalProps(): PrimaryButtonModalProps {
    const downloadCount = DOWNLOAD_ITEM_STATE_VARIABLES.reduce(
      (acc, val) => (this.state[val] ? acc + 1 : acc),
      0,
    );

    return {
      disablePrimaryButton: downloadCount === 0,
      onPrimaryAction: this.onChooseDownload,
      primaryButtonText: `${I18N.textById('Download')} (${downloadCount})`,
    };
  }

  buildDownloadImageModalProps(): PrimaryButtonModalProps {
    const { imageIsDownloading } = this.state;

    return {
      disablePrimaryButton: imageIsDownloading,
      onPrimaryAction: this.downloadImage,
      primaryButtonText: I18N.textById('Download'),
    };
  }

  // TODO(stephen.byarugaba, anyone): revise this to allow each tab have a custom
  // DownloadModalFooter. This follows a situation in DownloadImageTab where download
  // was trigered basing on isDownloadImageClicked flag.
  buildSupplementalModalProps():
    | PrimaryButtonModalProps
    | SecondaryButtonModalProps {
    const { selectedTabName } = this.state;
    if (selectedTabName === I18N.textById('Email')) {
      return this.buildEmailModalProps();
    }

    if (selectedTabName === I18N.text('Link')) {
      return this.buildLinkModalProps();
    }

    if (selectedTabName === I18N.textById('Export data')) {
      return this.buildDownloadDataModalProps();
    }
    // The only tab left is the download Image tab.
    return this.buildDownloadImageModalProps();
  }

  @autobind
  onExportFHIRData() {
    if (!this.state.downloadFHIRData) {
      return;
    }
    const promiseId = uniqueId();
    const { queryResultSpec, querySelections } = this.props;

    if (queryResultSpec) {
      this._queryPromises[promiseId] = TableQueryResultState.runQuery(
        querySelections,
        queryResultSpec,
      )
        .then(queryResultState => {
          delete this._queryPromises[promiseId];
          const fields = getFieldsFromQueryResultSpec(
            queryResultSpec,
            querySelections,
          );
          const queryResultData = queryResultState.queryResult().data();
          exportToFHIRXML(queryResultData, fields);
        })
        .finally(() => this.setState({ downloadFHIRData: false }));

      analytics.track('Export to FHIR');
    }
  }

  @autobind
  onConfirmSendEmailClick() {
    this.setState({ showConfirmModal: false }, () => this.sendEmail(false));
  }

  @autobind
  onChooseDownload(): void {
    this.onExportAllExcelClick();
    this.exportFieldMapping();
    this.onExportFHIRData();
    Toaster.notify(
      I18N.textById(
        'Your data will download shortly, check the download folder',
      ),
    );
    this.props.onRequestClose();
  }

  @autobind
  onExportAllExcelClick() {
    const { downloadExcelData } = this.state;

    if (!downloadExcelData) {
      return;
    }
    const { queryResultSpec, querySelections } = this.props;
    if (queryResultSpec && querySelections) {
      // Run the query and store the promise so that we can
      // clean it up later if needed
      const promiseId = uniqueId();
      this._queryPromises[promiseId] = TableQueryResultState.runQuery(
        querySelections,
        queryResultSpec,
      )
        .then(queryResultState => {
          delete this._queryPromises[promiseId];
          const fields = getFieldsFromQueryResultSpec(
            queryResultSpec,
            querySelections,
          );
          const groupings = queryResultSpec.groupBySettings().groupings();
          return exportQueryData(
            queryResultState.queryResult(),
            fields,
            'excel',
            groupings,
          );
        })
        .finally(() => this.setState({ downloadExcelData: false }));
      analytics.track('Export to Excel');
    }
  }

  @autobind
  onEmailInfoChange(newEmailInfo: EmailInfo) {
    this.setState({ emailInfo: newEmailInfo });
  }

  @autobind
  onSubmitShareViaEmailClick() {
    this.setErrorState(false, () => {
      if (this.state.errorTextArr.length !== 0) {
        return;
      }
      this.setState(prevState => {
        if (prevState.emailInfo.externalRecipients.length !== 0) {
          return { showConfirmModal: true };
        }
        this.sendEmail(false);
        return { showConfirmModal: false };
      });
    });
  }

  @autobind
  onSubmitPreviewEmail() {
    this.setErrorState(true, () => {
      this.setState(prevState => {
        if (prevState.errorTextArr.length !== 0) {
          return undefined;
        }
        this.sendEmail(true);
        return { sendingPreviewEmail: true };
      });
    });
  }

  @autobind
  onImageIsDownloaded() {
    this.setState({
      imageIsDownloading: false,
    });
    this.props.onRequestClose();
  }

  renderExportDataTab(): React.Element<typeof Tab> {
    const {
      downloadExcelData,
      downloadFHIRData,
      downloadFieldMappingData,
      downloadRawCSVData,
    } = this.state;
    return (
      <Tab name={I18N.text('Export data')}>
        <DownloadDataTab
          downloadExcelData={downloadExcelData}
          downloadFHIRData={downloadFHIRData}
          downloadFieldMappingData={downloadFieldMappingData}
          downloadRawCSVData={downloadRawCSVData}
          querySelections={this.props.querySelections}
          toggleDownloadExcelData={this.toggleDownloadExcelData}
          toggleDownloadFHIRData={this.toggleDownloadFHIRData}
          toggleDownloadFieldMappings={this.toggleDownloadFieldMappings}
          toggleDownloadRawCSVData={this.toggleDownloadRawCSVData}
        />
      </Tab>
    );
  }

  renderDownloadImageTab(): React.Element<typeof Tab> {
    const { imageIsDownloading } = this.state;
    const { queryResultSpec, querySelections, viewType } = this.props;

    return (
      <Tab
        className="download-image-tab"
        name={I18N.textById('Download image')}
      >
        <DownloadImageTab
          getVisualizationContainerElt={this.getVisualizationContainerElt}
          isDownloadImageClicked={imageIsDownloading}
          onImageIsDownloaded={this.onImageIsDownloaded}
          queryResultSpec={queryResultSpec}
          querySelections={querySelections}
          viewType={viewType}
        />
      </Tab>
    );
  }

  renderShareLinkTab(): React.Element<typeof Tab> {
    const { loadingShareableLink } = this.state;

    const content = loadingShareableLink ? (
      <Spacing flex justifyContent="center">
        <LoadingSpinner />
      </Spacing>
    ) : (
      <StaticSelectableTextbox text={this.state.shareableLink} />
    );

    return <Tab name={I18N.textById('Link')}>{content}</Tab>;
  }

  renderShareEmailTab(): React.Element<typeof Tab> | null {
    const { queryResultSpec, querySelections, viewType } = this.props;
    if (queryResultSpec) {
      return (
        <Tab name={I18N.textById('Email')}>
          <ShareAnalysisEmailForm
            closeConfirmModal={this.closeConfirmModal}
            emailInfo={this.state.emailInfo}
            errorTextArr={this.state.errorTextArr}
            onConfirmSendEmail={this.onConfirmSendEmailClick}
            onEmailInfoChange={this.onEmailInfoChange}
            queryResultSpec={queryResultSpec}
            querySelections={querySelections}
            showConfirmModal={this.state.showConfirmModal}
            viewType={viewType}
          />
        </Tab>
      );
    }
    return null;
  }

  render(): React.Node {
    return (
      <span ref={this._ref}>
        <TabbedModal
          className="share-query-modal"
          initialTab={this.state.selectedTabName}
          onRequestClose={this.props.onRequestClose}
          onTabChange={this.updateCurrentTab}
          show={this.props.show}
          showCloseButton
          title={I18N.textById('Share')}
          titleTooltip={I18N.text(
            'Share your analysis with other users by email, by sending them a link or by exporting the data',
          )}
          width="90%"
          {...this.buildSupplementalModalProps()}
        >
          {this.renderShareEmailTab()}
          {this.renderShareLinkTab()}
          {this.renderExportDataTab()}
          {this.renderDownloadImageTab()}
        </TabbedModal>
      </span>
    );
  }
}
