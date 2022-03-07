// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import BaseModal from 'components/ui/BaseModal';
import Button from 'components/ui/Button';
import CollapsibleDashboardTables from 'components/common/DashboardPickerModal/CollapsibleDashboardTables';
import DashboardService from 'services/DashboardBuilderApp/DashboardService';
import I18N from 'lib/I18N';
import InputModal from 'components/common/InputModal';
import InputText from 'components/ui/InputText';
import Toaster from 'components/ui/Toaster';
import autobind from 'decorators/autobind';
import type DashboardMeta from 'models/core/Dashboard/DashboardMeta';

type DefaultProps = {
  confirmationModalTitle: string,
  createNewDashboard: typeof DashboardService.createDashboard,
  renderConfirmationModalContents: (dashboardTitle: string) => React.Node,
  dashboards: Zen.Array<DashboardMeta>,
  title: string,
};

type Props = {
  ...DefaultProps,
  onRequestClose: () => void,

  /**
   * Callback for when a dashboard is selected and the modal's Save button is
   * clicked. The `createdDashboard` parameter is only supplied when a new
   * dashboard is created.
   */
  onSubmitDashboardSelection: (
    dashboardSlug: string,
    createdDashboard?: DashboardMeta,
  ) => void,

  /**
   * Callback for after the dashboard selection is complete and the confirmation
   * modal has shown up. This gets called if the user selects to navigate to
   * the dashboard.
   */
  onRequestNavigate: (
    selectedDashboard: DashboardMeta,
    SyntheticMouseEvent<>,
  ) => void,
  show: boolean,
};

type State = {
  showConfirmation: boolean,

  // the slug of the selected dashboard (if any is selected)
  selectedDashboard: string | void,

  // the dashboard that just got created (if the user chose to create one)
  createdDashboard: DashboardMeta | void,
  searchFilter: string,
  showCreateDashboardModal: boolean,
};

const TEXT = t('query_result.SaveQueryModal');
const CREATE_TEXT = t('Navbar');

/**
 * This modal is used to allow users to search and pick a dashboard.
 * Typically used for choosing a dashboard to save a query to, but it can
 * be used for any situation where a dashboard has to be chosen.
 *
 * TODO(pablo): this should be moved to components/common
 */
export default class DashboardPickerModal extends React.PureComponent<
  Props,
  State,
> {
  static defaultProps: DefaultProps = {
    confirmationModalTitle: TEXT.confirmationTitle,
    createNewDashboard: DashboardService.createDashboard,
    dashboards: Zen.Array.create<DashboardMeta>(),
    renderConfirmationModalContents: (dashboardTitle: string) => (
      <p>
        {TEXT.confirmationText} <strong>{dashboardTitle}</strong>.
      </p>
    ),
    title: TEXT.title,
  };

  state: State = {
    selectedDashboard: undefined,
    createdDashboard: undefined,
    showConfirmation: false,
    searchFilter: '',
    showCreateDashboardModal: false,
  };

  @autobind
  createNewDashboard(dashboardName: string) {
    if (dashboardName === '') {
      Toaster.error(CREATE_TEXT.emptyDashboardNameError);
      return;
    }

    this.props
      .createNewDashboard(dashboardName)
      .then(dashboard => {
        if (dashboardName !== undefined) {
          // Add query to dashboard and show confirmation
          this.props.onSubmitDashboardSelection(dashboard.slug(), dashboard);
          this.setState({
            createdDashboard: dashboard,
            selectedDashboard: dashboard.slug(),
            showConfirmation: true,
            showCreateDashboardModal: false,
          });
        }
      })
      .catch((error: Error) => {
        // TODO(pablo): we should not be reusing the error message here because
        // they are untranslated.
        Toaster.error(error.message);
        console.error(error);
        analytics.track('Dashboard creation error', error);
      });
  }

  getDashboardWeSavedTo(): DashboardMeta | void {
    const { selectedDashboard, createdDashboard } = this.state;
    const dashboardWeSavedTo =
      createdDashboard ||
      this.props.dashboards.find(
        dashboard => dashboard.slug() === selectedDashboard,
      );
    return dashboardWeSavedTo;
  }

  @autobind
  onOpenCreateDashboardModal() {
    this.setState({ showCreateDashboardModal: true });
  }

  @autobind
  onCloseCreateDashboardModal() {
    this.setState({ showCreateDashboardModal: false });
  }

  @autobind
  onRequestNavigateToDashboard(e: SyntheticMouseEvent<>) {
    const dashboardWeSavedTo = this.getDashboardWeSavedTo();
    if (dashboardWeSavedTo) {
      this.props.onRequestNavigate(dashboardWeSavedTo, e);
    }
  }

  @autobind
  onRequestClose() {
    this.setState({
      selectedDashboard: undefined,
      showConfirmation: false,
    });
    this.props.onRequestClose();
  }

  @autobind
  onRequestSaveOnly() {
    const { selectedDashboard } = this.state;
    if (selectedDashboard) {
      this.props.onSubmitDashboardSelection(selectedDashboard);
      // TODO(ian): Wait until save is confirmed successful.
      this.setState({
        showConfirmation: true,
      });
    }
  }

  @autobind
  onDashboardSelection(selectedDashboard: string) {
    this.setState({ selectedDashboard });
  }

  @autobind
  onSearchUpdate(searchString: string) {
    this.setState({ searchFilter: searchString });
  }

  renderCreateDashboardModal(): React.Node {
    return (
      <InputModal
        maxWidth={500}
        onPrimaryAction={this.createNewDashboard}
        onRequestClose={this.onCloseCreateDashboardModal}
        primaryButtonText={CREATE_TEXT.create}
        show={this.state.showCreateDashboardModal}
        textElement={CREATE_TEXT.createDashboardTitlePrompt}
        title={CREATE_TEXT.createNewDashboard}
      />
    );
  }

  renderGlobalSearch(): React.Node {
    return (
      <InputText
        className="save-query-modal__global-search"
        onChange={this.onSearchUpdate}
        icon="search"
        placeholder={TEXT.search}
        value={this.state.searchFilter}
      />
    );
  }

  renderCreateDashboardButton(): React.Node {
    return (
      <Button
        outline
        intent={Button.Intents.PRIMARY}
        onClick={this.onOpenCreateDashboardModal}
      >
        <I18N.Ref id="Create Dashboard" />
      </Button>
    );
  }

  renderCollapsibleDashboardTables(): React.Node {
    const { searchFilter, selectedDashboard } = this.state;
    const { dashboards } = this.props;
    return (
      <CollapsibleDashboardTables
        dashboards={dashboards}
        onDashboardSelection={this.onDashboardSelection}
        selectedDashboard={selectedDashboard}
        searchText={searchFilter}
      />
    );
  }

  renderConfirmation(): React.Node {
    const {
      confirmationModalTitle,
      show,
      renderConfirmationModalContents,
    } = this.props;
    const { showConfirmation } = this.state;
    const dashboardWeSavedTo = this.getDashboardWeSavedTo();
    if (dashboardWeSavedTo) {
      return (
        <BaseModal
          className="save-query-modal"
          onPrimaryAction={this.onRequestClose}
          primaryButtonText={TEXT.confirmationPrimaryButton}
          showSecondaryButton
          secondaryButtonText={TEXT.confirmationSecondaryButton}
          secondaryButtonIntent={BaseModal.Intents.PRIMARY}
          secondaryButtonOutline
          onSecondaryAction={this.onRequestNavigateToDashboard}
          title={confirmationModalTitle}
          show={show && showConfirmation}
          onRequestClose={this.onRequestClose}
          showCloseButton={false}
          maxWidth={600}
        >
          {renderConfirmationModalContents(dashboardWeSavedTo.title())}
        </BaseModal>
      );
    }

    throw new Error('There was an error saving to your dashboard.');
  }

  renderDashboardSelection(): React.Node {
    const { title, show } = this.props;
    const { selectedDashboard, showConfirmation } = this.state;
    return (
      <BaseModal
        className="save-query-modal"
        height="70%"
        onPrimaryAction={this.onRequestSaveOnly}
        primaryButtonText={TEXT.save}
        disablePrimaryButton={!selectedDashboard}
        title={title}
        show={show && !showConfirmation}
        onRequestClose={this.onRequestClose}
        width="70%"
      >
        <div className="save-query-modal__action-row">
          {this.renderGlobalSearch()}
          {this.renderCreateDashboardButton()}
        </div>
        {this.renderCollapsibleDashboardTables()}
      </BaseModal>
    );
  }

  render(): React.Node {
    if (this.state.showConfirmation) {
      return this.renderConfirmation();
    }
    if (this.state.showCreateDashboardModal) {
      return this.renderCreateDashboardModal();
    }
    return this.renderDashboardSelection();
  }
}
