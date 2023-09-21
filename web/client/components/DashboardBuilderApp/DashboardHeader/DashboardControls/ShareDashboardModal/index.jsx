// @flow
import * as React from 'react';

import Dashboard from 'models/core/Dashboard';
import DashboardService from 'services/DashboardBuilderApp/DashboardService';
import DashboardSessionService from 'services/DashboardBuilderApp/DashboardSessionService';
import DownloadDashboardTab from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/ShareDashboardModal/DownloadDashboardTab';
import I18N from 'lib/I18N';
import ShareDashboardEmailForm from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/ShareDashboardModal/ShareDashboardEmailForm';
import ShareDashboardLinkForm from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/ShareDashboardModal/ShareDashboardLinkForm';
import Tab from 'components/ui/Tabs/Tab';
import TabbedModal from 'components/ui/TabbedModal';
import Toaster from 'components/ui/Toaster';
import Tooltip from 'components/ui/Tooltip';
import autobind from 'decorators/autobind';
import {
  PDF,
  JPEG,
} from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/ShareDashboardModal/constants';
import {
  copyTextToClipboard,
  validateInputs,
} from 'components/common/SharingUtil/sharingUtil';
import type {
  PrimaryButtonModalProps,
  SecondaryButtonModalProps,
} from 'components/common/SharingUtil/ShareQueryModal/types';
import type { ShareDashboardEmailInfo } from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/ShareDashboardModal/constants';

const PLATFORM = window.__JSON_FROM_BACKEND.ui.fullPlatformName;
const SENDER = window.__JSON_FROM_BACKEND.user.username;
const MESSAGE = I18N.text(
  'Hi, \n\nPlease find a dashboard created on %(platformName)s attached.\n\nThank you,\n%(yourName)s',
  'dashboardShareEmailMessageTemplate',
  {
    platformName: PLATFORM,
    yourName: window.__JSON_FROM_BACKEND.user.fullName,
  },
);

const TAB_NAMES = {
  DOWNLOAD: I18N.text('Download'),
  EMAIL: I18N.textById('Email'),
  LINK: I18N.textById('Link'),
  REPORT_GENERATOR: I18N.text('Report Generator'),
};

type DefaultProps = {
  enableScheduleReport: boolean,
  enableShareEmail: boolean,
};

type Props = {
  ...DefaultProps,
  dashboard: Dashboard,
  defaultTabName: string,
  hasUnsavedDashboardModifiers: boolean,
  onRequestClose: () => void,
  showModal: boolean,
};

type State = {
  dashboardSessionHash: string,
  emailInfo: ShareDashboardEmailInfo,
  errorTextArr: $ReadOnlyArray<{ key: string, value: string }>,
  isShareCurrentSettings: boolean,
  JPEGSelected: boolean,
  linkToShare: string,
  PDFSelected: boolean,
  selectedTabName: string,
  sendingPreviewEmail: boolean,
  showConfirmModal: boolean,
  showCreateScheduleForm: boolean,
  supplementalModalProps: PrimaryButtonModalProps | SecondaryButtonModalProps,
};

function getBaseDownloadLink(slug: string, applyHash: boolean, hash: string) {
  const hashSuffix = applyHash ? `/${hash}` : '';
  return `/dashboard/${slug}${hashSuffix}`;
}

function getLinkToShare(isShareWithCurrentFilter: boolean, hash: string) {
  const hashSuffix = isShareWithCurrentFilter ? `#h=${hash}` : '';
  return `${window.location.href}${hashSuffix}`;
}

export default class ShareDashboardModal extends React.PureComponent<
  Props,
  State,
> {
  state: State = {
    JPEGSelected: false,
    PDFSelected: false,
    dashboardSessionHash: '',
    emailInfo: {
      dashboardUrl: '',
      externalRecipients: [],
      message: MESSAGE,
      noAccessRecipients: [],
      recipientUserGroups: [],
      recipients: [],
      sender: SENDER,
      shouldAttachPdf: false,
      shouldEmbedImage: false,
      subject: I18N.text('Dashboard Analysis Shared'),
      useRecipientQueryPolicy: true,
      useSingleEmailThread: false,
    },
    errorTextArr: [],
    isShareCurrentSettings: false,
    linkToShare: window.location.href,
    selectedTabName: this.props.defaultTabName,
    sendingPreviewEmail: false,
    showConfirmModal: false,
    showCreateScheduleForm: false,
    supplementalModalProps: {
      disablePrimaryButton: false,
      onPrimaryAction: () => {},
      primaryButtonText: '',
    },
  };

  static defaultProps: DefaultProps = {
    enableScheduleReport: false,
    enableShareEmail: false,
  };

  _downloadPDFRef: $ElementRefObject<'a'> = React.createRef();
  _downloadJPEGRef: $ElementRefObject<'a'> = React.createRef();

  componentDidMount() {
    const { dashboard, hasUnsavedDashboardModifiers } = this.props;
    if (hasUnsavedDashboardModifiers) {
      DashboardSessionService.storeDashboardSession(
        Number(
          dashboard
            .uri()
            .split('/')
            .pop(),
        ),
        {
          filters: dashboard
            .specification()
            .commonSettings()
            .filterSettings().items,
          groupings: dashboard
            .specification()
            .commonSettings()
            .groupingSettings().items,
        },
      )
        .then(dashboardSessionHash => {
          const linkToShare = getLinkToShare(true, dashboardSessionHash);

          this.setState(prevState => ({
            dashboardSessionHash,
            linkToShare,
            emailInfo: {
              ...prevState.emailInfo,
              dashboardUrl: linkToShare,
            },
            isShareCurrentSettings: true,
          }));
        })
        .catch(error => {
          Toaster.error(
            I18N.text(
              'There was a problem creating link, please try again later.',
              'sessionFetchError',
            ),
          );
          console.error(error);
        });
    }
  }

  @autobind
  toggleShareCurrentSettings(newValue: boolean) {
    const { dashboardSessionHash } = this.state;
    const linkToShare = getLinkToShare(newValue, dashboardSessionHash);
    this.setState(prevState => ({
      linkToShare,
      emailInfo: {
        ...prevState.emailInfo,
        dashboardUrl: linkToShare,
      },
      isShareCurrentSettings: newValue,
    }));
  }

  @autobind
  closeConfirmModal() {
    this.setState({
      showConfirmModal: false,
    });
  }

  @autobind
  sendEmail(isPreview: boolean) {
    Toaster.notify(
      I18N.text(
        'Your files will be sent shortly. This can take a few minutes.',
        'dashboardShareSendingPendingMessage',
      ),
    );

    const emailInfo = {
      ...this.state.emailInfo,
      recipients: isPreview
        ? [window.__JSON_FROM_BACKEND.user.username]
        : this.state.emailInfo.recipients,
    };

    DashboardService.shareDashboardByEmail(
      this.props.dashboard.getDashboardMeta(),
      emailInfo,
      isPreview,
    )
      .catch(e => {
        Toaster.error(
          I18N.text(
            'There was an error while sharing dashboard',
            'dashboardShareFailureMessage',
          ),
        );
        // eslint-disable-next-line no-console
        console.error(e.message);
      })
      .finally(() => this.setState({ sendingPreviewEmail: false }));
    if (!isPreview) {
      this.props.onRequestClose();
    }
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
  togglePDFSelected() {
    this.setState(prevState => ({
      PDFSelected: !prevState.PDFSelected,
    }));
  }

  @autobind
  toggleJPEGSelected() {
    this.setState(prevState => ({
      JPEGSelected: !prevState.JPEGSelected,
    }));
  }

  @autobind
  copyLinkToClipboard(): void {
    const { linkToShare } = this.state;
    copyTextToClipboard(linkToShare);
  }

  @autobind
  onDownloadDashboardClick() {
    const { JPEGSelected, PDFSelected } = this.state;

    if (JPEGSelected && this._downloadJPEGRef.current) {
      this._downloadJPEGRef.current.click();
    }
    if (PDFSelected && this._downloadPDFRef.current) {
      this._downloadPDFRef.current.click();
    }

    if (!PDFSelected && !JPEGSelected) {
      Toaster.error(
        I18N.text(
          'Select either PDF, JPEG or both to download dashboard',
          'downloadDashboardNoSelectedExportMessage',
        ),
      );
      return;
    }
    Toaster.notify(
      I18N.text(
        'Dashboard files are downloading. This can take a few moments…',
        'downloadDashboardDownloadPendingMessage',
      ),
    );
    this.props.onRequestClose();
  }

  @autobind
  onSendEmailClick() {
    this.setErrorState(false, () => {
      this.setState(prevState => {
        if (prevState.errorTextArr.length !== 0) {
          return undefined;
        }

        if (prevState.emailInfo.noAccessRecipients.length !== 0) {
          return { showConfirmModal: true };
        }

        if (prevState.emailInfo.externalRecipients.length !== 0) {
          return { showConfirmModal: true };
        }
        this.sendEmail(false);
        return undefined;
      });
    });
  }

  @autobind
  onTabSelected(selectedTabName: string): void {
    this.setState({ selectedTabName });
  }

  @autobind
  onEmailInfoChange(newEmailInfo: ShareDashboardEmailInfo) {
    this.setState({ emailInfo: newEmailInfo });
  }

  @autobind
  onSendPreviewEmailClick() {
    this.setErrorState(true, () => {
      this.sendEmail(true);
      this.setState({ sendingPreviewEmail: true });
    });
  }

  @autobind
  onConfirmSendEmailClick() {
    this.setState(
      {
        showConfirmModal: false,
      },
      () => this.sendEmail(false),
    );
  }

  @autobind
  onUpdateSupplementalModalProps(
    supplementalModalProps: PrimaryButtonModalProps | SecondaryButtonModalProps,
  ) {
    this.setState({ supplementalModalProps });
  }

  maybeRenderShareDashboardTabbedModal(): React.Node {
    const {
      JPEGSelected,
      PDFSelected,
      selectedTabName,
      sendingPreviewEmail,
      showCreateScheduleForm,
    } = this.state;

    if (showCreateScheduleForm) {
      return null;
    }

    let onPrimaryAction;
    let primaryButtonText;

    if (selectedTabName === TAB_NAMES.EMAIL) {
      onPrimaryAction = this.onSendEmailClick;
      primaryButtonText = I18N.text('Send Email');
    } else if (selectedTabName === TAB_NAMES.DOWNLOAD) {
      primaryButtonText = `${I18N.textById('Download')} (${JPEGSelected +
        PDFSelected})`;
      onPrimaryAction = this.onDownloadDashboardClick;
    } else if (selectedTabName === TAB_NAMES.LINK) {
      primaryButtonText = I18N.text('Copy URL');
      onPrimaryAction = this.copyLinkToClipboard;
    } else if (selectedTabName === TAB_NAMES.SCHEDULE_REPORT) {
      primaryButtonText = 'Schedule';
      onPrimaryAction = () => {};
    }

    const supplementalModalProps:
      | PrimaryButtonModalProps
      | SecondaryButtonModalProps = onPrimaryAction
      ? {
          onPrimaryAction,
          primaryButtonText,
          disablePrimaryButton: false,
          disableSecondaryButton: sendingPreviewEmail,
          onSecondaryAction: this.onSendPreviewEmailClick,
          secondaryButtonIntent: 'primary',
          secondaryButtonText: this.renderSecondaryButtonContent(),
          showPrimaryButton: selectedTabName !== TAB_NAMES.SCHEDULE_REPORT,
          showSecondaryButton: selectedTabName === TAB_NAMES.EMAIL,
        }
      : this.state.supplementalModalProps;

    return (
      <TabbedModal
        initialTab={this.state.selectedTabName}
        onRequestClose={this.props.onRequestClose}
        onTabChange={this.onTabSelected}
        show={this.props.showModal}
        showCloseButton={false}
        tabHeaderSpacing={60}
        title={I18N.textById('share')}
        titleTooltip={I18N.text(
          'Share your analysis with other users by email, by sending them a link or by exporting the data',
          'dashboardShareTitleTooltip',
        )}
        {...supplementalModalProps}
      >
        {this.renderShareLinkTab()}
        {this.maybeRenderShareEmailTab()}
        {this.renderDownloadDashboardTab()}
      </TabbedModal>
    );
  }

  maybeRenderShareEmailTab(): React.Element<typeof Tab> | null {
    const {
      dashboardSessionHash,
      emailInfo,
      errorTextArr,
      isShareCurrentSettings,
      linkToShare,
      showConfirmModal,
    } = this.state;
    const { dashboard, enableShareEmail } = this.props;

    if (!enableShareEmail) {
      return null;
    }
    return (
      <Tab name={TAB_NAMES.EMAIL}>
        <ShareDashboardEmailForm
          closeConfirmModal={this.closeConfirmModal}
          dashboard={dashboard}
          emailInfo={emailInfo}
          errorTextArr={errorTextArr}
          isShareCurrentSettings={isShareCurrentSettings}
          linkToShare={linkToShare}
          onConfirmSendEmail={this.onConfirmSendEmailClick}
          onEmailInfoChange={this.onEmailInfoChange}
          onToggleShareCurrentSettings={this.toggleShareCurrentSettings}
          shouldDisplayExtraSettings={Boolean(dashboardSessionHash)}
          showConfirmModal={showConfirmModal}
        />
      </Tab>
    );
  }

  @autobind
  renderHiddenPDFDownloadLink(): React.Node {
    const { dashboard } = this.props;
    const { dashboardSessionHash, isShareCurrentSettings } = this.state;
    const baseURL = getBaseDownloadLink(
      dashboard.slug(),
      isShareCurrentSettings,
      dashboardSessionHash,
    );
    const pdfDownloadUrl = `${baseURL}/pdf`;
    return (
      <a
        ref={this._downloadPDFRef}
        download={`${dashboard.title()}.pdf`}
        hidden
        href={pdfDownloadUrl}
      >
        {PDF}
      </a>
    );
  }

  @autobind
  renderHiddenJPEGDownloadLink(): React.Node {
    const { dashboard } = this.props;
    const { dashboardSessionHash, isShareCurrentSettings } = this.state;
    const baseURL = getBaseDownloadLink(
      dashboard.slug(),
      isShareCurrentSettings,
      dashboardSessionHash,
    );
    const imageDownloadUrl = `${baseURL}/jpeg`;
    return (
      <a
        ref={this._downloadJPEGRef}
        download={`${dashboard.title()}.jpeg`}
        hidden
        href={imageDownloadUrl}
      >
        {JPEG}
      </a>
    );
  }

  renderShareLinkTab(): React.Element<typeof Tab> {
    const {
      dashboardSessionHash,
      isShareCurrentSettings,
      linkToShare,
    } = this.state;
    return (
      <Tab name={TAB_NAMES.LINK}>
        <ShareDashboardLinkForm
          dashboard={this.props.dashboard}
          iframeLinkToShare={`${linkToShare}?iframe=1`}
          isShareCurrentSettings={isShareCurrentSettings}
          linkToShare={linkToShare}
          onToggleShareCurrentSettings={this.toggleShareCurrentSettings}
          shouldDisplayExtraSettings={Boolean(dashboardSessionHash)}
        />
      </Tab>
    );
  }

  renderSecondaryButtonContent(): React.Node {
    const previewBtnText = this.state.sendingPreviewEmail
      ? I18N.textById('Sending...')
      : I18N.text('Send Preview Email');
    return (
      <Tooltip
        content={I18N.text(
          'A preview email will be sent to your email address only',
          'sendPreviewTooltip',
        )}
        tooltipPlacement="top"
      >
        {previewBtnText}
      </Tooltip>
    );
  }

  renderDownloadDashboardTab(): React.Element<typeof Tab> {
    const { dashboardSessionHash, isShareCurrentSettings } = this.state;
    return (
      <Tab name={TAB_NAMES.DOWNLOAD}>
        <DownloadDashboardTab
          isShareCurrentSettings={isShareCurrentSettings}
          JPEGSelected={this.state.JPEGSelected}
          onToggleShareCurrentSettings={this.toggleShareCurrentSettings}
          PDFSelected={this.state.PDFSelected}
          shouldDisplayExtraSettings={Boolean(dashboardSessionHash)}
          toggleJPEGSelected={this.toggleJPEGSelected}
          togglePDFSelected={this.togglePDFSelected}
        />
        {this.renderHiddenPDFDownloadLink()}
        {this.renderHiddenJPEGDownloadLink()}
      </Tab>
    );
  }

  render(): React.Node {
    return (
      <React.Fragment>
        {this.maybeRenderShareDashboardTabbedModal()}
      </React.Fragment>
    );
  }
}
