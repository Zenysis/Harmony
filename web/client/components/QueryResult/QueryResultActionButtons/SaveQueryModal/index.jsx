// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import BaseModal from 'components/ui/BaseModal';
import Button from 'components/ui/Button';
import CollapsibleDashboardTables from 'components/QueryResult/QueryResultActionButtons/SaveQueryModal/CollapsibleDashboardTables';
import Dashboard from 'models/core/Dashboard';
import DashboardMeta from 'models/core/Dashboard/DashboardMeta';
import DashboardService from 'services/DashboardService';
import InputModal from 'components/common/InputModal';
import InputText from 'components/ui/InputText';
import autobind from 'decorators/autobind';

type Props = {
  createNewDashboard: (dashboardName: string) => Promise<Dashboard>,
  onRequestClose: () => void,
  onRequestSave: (dashboardName: string, dashboard?: Dashboard) => void,
  onRequestNavigate: (SyntheticMouseEvent<>) => void,
  show: boolean,
  dashboards: Zen.Array<DashboardMeta>,
};

type State = {
  showConfirmation: boolean,
  selectedDashboard: string | void,
  searchFilter: string,
  showCreateDashboardModal: boolean,
};

const TEXT = t('query_result.SaveQueryModal');
const CREATE_TEXT = t('Navbar');

export default class SaveQueryModal extends React.PureComponent<Props, State> {
  static defaultProps = {
    createNewDashboard: DashboardService.createDashboard,
    dashboards: Zen.Array.create<DashboardMeta>(),
  };

  state = {
    selectedDashboard: undefined,
    showConfirmation: false,
    searchFilter: '',
    showCreateDashboardModal: false,
  };

  @autobind
  createNewDashboard(dashboardName: string) {
    this.props
      .createNewDashboard(dashboardName)
      .then(dashboard => {
        if (dashboardName !== undefined) {
          // Add query to dashboard and show confirmation
          this.props.onRequestSave(dashboardName, dashboard);
          this.setState({
            selectedDashboard: dashboardName,
            showConfirmation: true,
            showCreateDashboardModal: false,
          });
        }
      })
      .catch(error => {
        window.toastr.error(error.message);
        console.error(error);
        analytics.track(t('dashboard_builder.creation_error'), error);
      });
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
      this.props.onRequestSave(selectedDashboard);
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

  renderCreateDashboardModal() {
    return (
      <InputModal
        show={this.state.showCreateDashboardModal}
        title={CREATE_TEXT.createNewDashboard}
        textElement={CREATE_TEXT.createDashboardTitlePrompt}
        onRequestClose={this.onCloseCreateDashboardModal}
        defaultHeight={260}
        primaryButtonText={CREATE_TEXT.create}
        onPrimaryAction={this.createNewDashboard}
      />
    );
  }

  renderGlobalSearch() {
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

  renderCreateDashboardButton() {
    return (
      <Button
        outline
        intent={Button.Intents.PRIMARY}
        onClick={this.onOpenCreateDashboardModal}
      >
        {t('dashboard_builder.create')}
      </Button>
    );
  }

  renderCollapsibleDashboardTables() {
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

  renderConfirmation() {
    const { onRequestNavigate, show } = this.props;
    const { selectedDashboard, showConfirmation } = this.state;
    return (
      <BaseModal
        className="save-query-modal"
        onPrimaryAction={this.onRequestClose}
        primaryButtonText={TEXT.confirmationPrimaryButton}
        showSecondaryButton
        secondaryButtonText={TEXT.confirmationSecondaryButton}
        secondaryButtonIntent={BaseModal.Intents.PRIMARY}
        secondaryButtonOutline
        onSecondaryAction={onRequestNavigate}
        title={TEXT.confirmationTitle}
        show={show && showConfirmation}
        onRequestClose={this.onRequestClose}
        showCloseButton={false}
        width={600}
        defaultHeight={350}
      >
        <p>
          {TEXT.confirmationText} <strong>{selectedDashboard}</strong>.
        </p>
      </BaseModal>
    );
  }

  renderDashboardSelection() {
    const { selectedDashboard, showConfirmation } = this.state;
    return (
      <BaseModal
        className="save-query-modal"
        onPrimaryAction={this.onRequestSaveOnly}
        primaryButtonText={TEXT.save}
        disablePrimaryButton={!selectedDashboard}
        title={TEXT.title}
        show={this.props.show && !showConfirmation}
        onRequestClose={this.onRequestClose}
        width={window.innerWidth * 0.7}
        defaultHeight={Math.min(window.innerHeight, 550)}
        defaultPercentTop={window.innerHeight < 500 ? 0 : undefined}
      >
        <div className="save-query-modal__action-row">
          {this.renderGlobalSearch()}
          {this.renderCreateDashboardButton()}
        </div>
        {this.renderCollapsibleDashboardTables()}
      </BaseModal>
    );
  }

  render() {
    if (this.state.showConfirmation) {
      return this.renderConfirmation();
    }
    if (this.state.showCreateDashboardModal) {
      return this.renderCreateDashboardModal();
    }
    return this.renderDashboardSelection();
  }
}
