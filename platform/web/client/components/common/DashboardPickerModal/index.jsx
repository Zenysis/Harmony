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
import type ZenHTTPError from 'util/ZenHTTPError';

type DefaultProps = {
  confirmationModalTitle: string,
  dashboards: Zen.Array<DashboardMeta>,
  renderConfirmationModalContents: (dashboardTitle: string) => React.Node,
  title: string,
};

type Props = {
  ...DefaultProps,
  onRequestClose: () => void,

  /**
   * Callback for after the dashboard selection is complete and the confirmation
   * modal has shown up. This gets called if the user selects to navigate to
   * the dashboard.
   */
  onRequestNavigate: (
    selectedDashboard: DashboardMeta,
    SyntheticMouseEvent<>,
  ) => void,

  /**
   * Callback for when a dashboard is selected and the modal's Save button is
   * clicked. The `createdDashboard` parameter is only supplied when a new
   * dashboard is created.
   */
  onSubmitDashboardSelection: (
    dashboardSlug: string,
    createdDashboard?: DashboardMeta,
  ) => void,

  show: boolean,
};

type State = {
  // the dashboard that just got created (if the user chose to create one)
  createdDashboard: DashboardMeta | void,

  searchFilter: string,

  // the slug of the selected dashboard (if any is selected)
  selectedDashboard: string | void,

  showConfirmation: boolean,
  showCreateDashboardModal: boolean,
};

/**
 * This modal is used to allow users to search and pick a dashboard.
 * Typically used for choosing a dashboard to save a query to, but it can
 * be used for any situation where a dashboard has to be chosen.
 *
 * TODO: this should be moved to components/common
 */
export default class DashboardPickerModal extends React.PureComponent<
  Props,
  State,
> {
  static defaultProps: DefaultProps = {
    confirmationModalTitle: I18N.text('Added to dashboard'),
    dashboards: Zen.Array.create<DashboardMeta>(),
    renderConfirmationModalContents: (dashboardTitle: string) => (
      <p>
        {I18N.text('Your query has been saved to')}{' '}
        <strong>{dashboardTitle}</strong>.
      </p>
    ),
    title: I18N.text('Add to Dashboard'),
  };

  state: State = {
    createdDashboard: undefined,
    searchFilter: '',
    selectedDashboard: undefined,
    showConfirmation: false,
    showCreateDashboardModal: false,
  };

  @autobind
  createNewDashboard(dashboardName: string) {
    if (dashboardName === '') {
      Toaster.error(I18N.textById('Cannot create dashboard with empty name'));
      return;
    }

    DashboardService.createDashboard(dashboardName)
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
      .catch((error: ZenHTTPError) => {
        Toaster.error(error.standardErrorMessage());
        console.error(error);
      });
  }

  getDashboardWeSavedTo(): DashboardMeta | void {
    const { createdDashboard, selectedDashboard } = this.state;
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
      // TODO: Wait until save is confirmed successful.
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
        primaryButtonText={I18N.textById('Create')}
        show={this.state.showCreateDashboardModal}
        textElement={I18N.textById(
          'What would you like to name your new dashboard?',
        )}
        title={I18N.textById('Create')}
      />
    );
  }

  renderGlobalSearch(): React.Node {
    return (
      <InputText
        className="save-query-modal__global-search"
        icon="search"
        onChange={this.onSearchUpdate}
        placeholder={I18N.text('Search Dashboard Names')}
        value={this.state.searchFilter}
      />
    );
  }

  renderCreateDashboardButton(): React.Node {
    return (
      <Button
        intent={Button.Intents.PRIMARY}
        onClick={this.onOpenCreateDashboardModal}
        outline
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
        searchText={searchFilter}
        selectedDashboard={selectedDashboard}
      />
    );
  }

  renderConfirmation(): React.Node {
    const {
      confirmationModalTitle,
      renderConfirmationModalContents,
      show,
    } = this.props;
    const { showConfirmation } = this.state;
    const dashboardWeSavedTo = this.getDashboardWeSavedTo();
    if (dashboardWeSavedTo) {
      return (
        <BaseModal
          className="save-query-modal"
          maxWidth={600}
          onPrimaryAction={this.onRequestClose}
          onRequestClose={this.onRequestClose}
          onSecondaryAction={this.onRequestNavigateToDashboard}
          primaryButtonText={I18N.text('Continue working')}
          secondaryButtonIntent={BaseModal.Intents.PRIMARY}
          secondaryButtonOutline
          secondaryButtonText={I18N.text('Go to dashboard')}
          show={show && showConfirmation}
          showCloseButton={false}
          showSecondaryButton
          title={confirmationModalTitle}
        >
          {renderConfirmationModalContents(dashboardWeSavedTo.title())}
        </BaseModal>
      );
    }

    throw new Error('There was an error saving to your dashboard.');
  }

  renderDashboardSelection(): React.Node {
    const { show, title } = this.props;
    const { selectedDashboard, showConfirmation } = this.state;
    return (
      <BaseModal
        className="save-query-modal"
        disablePrimaryButton={!selectedDashboard}
        height="70%"
        onPrimaryAction={this.onRequestSaveOnly}
        onRequestClose={this.onRequestClose}
        primaryButtonText={I18N.textById('Save')}
        show={show && !showConfirmation}
        title={title}
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
