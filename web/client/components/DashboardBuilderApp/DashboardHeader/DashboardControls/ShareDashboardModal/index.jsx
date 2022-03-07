// @flow
import * as React from 'react';

import Dashboard from 'models/core/Dashboard';
import DashboardService from 'services/DashboardBuilderApp/DashboardService';
import DashboardSessionService from 'services/DashboardBuilderApp/DashboardSessionService';
import DownloadDashboardTab from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/ShareDashboardModal/DownloadDashboardTab';
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
  MONTHLY,
} from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/ShareDashboardModal/constants';
import {
  copyTextToClipboard,
  validateInputs,
} from 'components/common/SharingUtil/sharingUtil';
import type { ShareDashboardEmailInfo } from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/ShareDashboardModal/constants';

const TEXT = t('query_result.common.share_analysis.dashboardShare');
const PLATFORM = window.__JSON_FROM_BACKEND.ui.fullPlatformName;
const SENDER = window.__JSON_FROM_BACKEND.user.username;
const MESSAGE = t(
  'query_result.common.share_analysis.dashboardShare.emailForm.messageTemplate',
  {
    platformName: PLATFORM,
    yourName: window.__JSON_FROM_BACKEND.user.fullName,
  },
);

type DefaultProps = {
  enableScheduleReport: boolean,
  enableShareEmail: boolean,
  shareDashboardByEmail: typeof DashboardService.shareDashboardByEmail,
};

type Props = {
  ...DefaultProps,
  dashboard: Dashboard,
  defaultTabName: string,
  showModal: boolean,
  onRequestClose: () => void,
  hasUnsavedDashboardModifiers: boolean,
};

type State = {
  selectedTabName: string,
  emailInfo: ShareDashboardEmailInfo,
  showConfirmModal: boolean,
  errorTextArr: $ReadOnlyArray<{ key: string, value: string }>,
  sendingPreviewEmail: boolean,
  PDFSelected: boolean,
  JPEGSelected: boolean,
  showCreateScheduleForm: boolean,
  isEditingSchedule: boolean,
  dashboardSessionHash: string,
  isShareCurrentSettings: boolean,
  linkToShare: string,
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
    errorTextArr: [],
    selectedTabName: this.props.defaultTabName,
    emailInfo: {
      recipients: [],
      subject: TEXT.emailForm.defaultSubject,
      message: MESSAGE,
      sender: SENDER,
      dashboardUrl: '',
      externalRecipients: [],
      shouldAttachPdf: false,
      shouldEmbedImage: false,
      useRecipientQueryPolicy: true,
      useSingleEmailThread: false,
      recipientUserGroups: [],
      noAccessRecipients: [],
    },
    showConfirmModal: false,
    sendingPreviewEmail: false,
    PDFSelected: false,
    JPEGSelected: false,
    showCreateScheduleForm: false,
    isEditingSchedule: false,
    reportScheduleInfo: this.getDefaultReportScheduleInfo(),
    dashboardSessionHash: '',
    isShareCurrentSettings: false,
    linkToShare: window.location.href,
  };

  static defaultProps: DefaultProps = {
    enableScheduleReport: false,
    enableShareEmail: false,
    shareDashboardByEmail: DashboardService.shareDashboardByEmail,
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
            linkToShare,
            dashboardSessionHash,
            isShareCurrentSettings: true,
            emailInfo: {
              ...prevState.emailInfo,
              dashboardUrl: linkToShare,
            },
          }));
        })
        .catch(() => Toaster.error(TEXT.downloadDashboard.sessionFetchError));
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
    Toaster.notify(TEXT.sendingPendingMessage);

    const emailInfo = {
      ...this.state.emailInfo,
      recipients: isPreview
        ? [window.__JSON_FROM_BACKEND.user.username]
        : this.state.emailInfo.recipients,
    };

    this.props
      .shareDashboardByEmail(
        this.props.dashboard.getDashboardMeta(),
        emailInfo,
        isPreview,
      )
      .catch(e => {
        Toaster.error(TEXT.shareFailureMessage);
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
        recipients,
        message,
        subject,
        recipientUserGroups,
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
    const { PDFSelected, JPEGSelected } = this.state;

    if (JPEGSelected && this._downloadJPEGRef.current) {
      this._downloadJPEGRef.current.click();
    }
    if (PDFSelected && this._downloadPDFRef.current) {
      this._downloadPDFRef.current.click();
    }

    if (!PDFSelected && !JPEGSelected) {
      Toaster.error(TEXT.downloadDashboard.noSelectedExportMessage);
      return;
    }
    Toaster.notify(TEXT.downloadDashboard.downloadPendingMessage);
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

  maybeRenderShareDashboardTabbedModal(): React.Node {
    const {
      selectedTabName,
      JPEGSelected,
      PDFSelected,
      sendingPreviewEmail,
      showCreateScheduleForm,
    } = this.state;

    if (showCreateScheduleForm) {
      return null;
    }

    let onPrimaryAction;
    let primaryButtonText;

    if (selectedTabName === TEXT.tabNames.email) {
      onPrimaryAction = this.onSendEmailClick;
      primaryButtonText = TEXT.emailForm.sendBtnText;
    } else if (selectedTabName === TEXT.tabNames.download) {
      primaryButtonText = `${TEXT.downloadDashboard.btnText} (${JPEGSelected +
        PDFSelected})`;
      onPrimaryAction = this.onDownloadDashboardClick;
    } else if (selectedTabName === TEXT.tabNames.link) {
      primaryButtonText = TEXT.linkPrimaryButton;
      onPrimaryAction = this.copyLinkToClipboard;
    }

    return (
      <TabbedModal
        initialTab={this.props.defaultTabName}
        show={this.props.showModal}
        onTabChange={this.onTabSelected}
        showCloseButton={false}
        onRequestClose={this.props.onRequestClose}
        tabHeaderSpacing={60}
        title={TEXT.title}
        titleTooltip={TEXT.titleTooltip}
        primaryButtonText={primaryButtonText}
        onPrimaryAction={onPrimaryAction}
        showSecondaryButton={selectedTabName === TEXT.tabNames.email}
        showPrimaryButton={selectedTabName !== TEXT.tabNames.scheduleReport}
        secondaryButtonIntent="primary"
        secondaryButtonText={this.renderSecondaryButtonContent()}
        onSecondaryAction={this.onSendPreviewEmailClick}
        disableSecondaryButton={sendingPreviewEmail}
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
      isShareCurrentSettings,
      linkToShare,
    } = this.state;
    if (!this.props.enableShareEmail) {
      return null;
    }
    return (
      <Tab name={TEXT.tabNames.email}>
        <ShareDashboardEmailForm
          emailInfo={this.state.emailInfo}
          onEmailInfoChange={this.onEmailInfoChange}
          showConfirmModal={this.state.showConfirmModal}
          dashboard={this.props.dashboard}
          onConfirmSendEmail={this.onConfirmSendEmailClick}
          closeConfirmModal={this.closeConfirmModal}
          errorTextArr={this.state.errorTextArr}
          shouldDisplayExtraSettings={Boolean(dashboardSessionHash)}
          isShareCurrentSettings={isShareCurrentSettings}
          onToggleShareCurrentSettings={this.toggleShareCurrentSettings}
          linkToShare={linkToShare}
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
        href={pdfDownloadUrl}
        download={`${dashboard.title()}.pdf`}
        hidden
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
        href={imageDownloadUrl}
        download={`${dashboard.title()}.jpeg`}
        hidden
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
      <Tab name={TEXT.tabNames.link}>
        <ShareDashboardLinkForm
          shouldDisplayExtraSettings={Boolean(dashboardSessionHash)}
          isShareCurrentSettings={isShareCurrentSettings}
          onToggleShareCurrentSettings={this.toggleShareCurrentSettings}
          linkToShare={linkToShare}
        />
      </Tab>
    );
  }

  renderSecondaryButtonContent(): React.Node {
    const previewBtnText = this.state.sendingPreviewEmail
      ? TEXT.emailForm.sendingProgress
      : TEXT.emailForm.sendPreviewBtnText;
    return (
      <Tooltip
        content={TEXT.emailForm.sendPreviewTooltip}
        tooltipPlacement="top"
      >
        {previewBtnText}
      </Tooltip>
    );
  }

  renderDownloadDashboardTab(): React.Element<typeof Tab> {
    const { dashboardSessionHash, isShareCurrentSettings } = this.state;
    return (
      <Tab name={TEXT.tabNames.download}>
        <DownloadDashboardTab
          toggleJPEGSelected={this.toggleJPEGSelected}
          togglePDFSelected={this.togglePDFSelected}
          JPEGSelected={this.state.JPEGSelected}
          PDFSelected={this.state.PDFSelected}
          shouldDisplayExtraSettings={Boolean(dashboardSessionHash)}
          isShareCurrentSettings={isShareCurrentSettings}
          onToggleShareCurrentSettings={this.toggleShareCurrentSettings}
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
