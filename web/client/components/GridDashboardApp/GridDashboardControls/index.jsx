// @flow
import React from 'react';

import Dashboard from 'models/core/Dashboard';
import DashboardService from 'services/DashboardService';
import DashboardSettingsModal from 'components/GridDashboardApp/GridDashboardControls/DashboardSettingsModal';
import DashboardSpecification from 'models/core/Dashboard/DashboardSpecification';
import FilterPanel from 'components/GridDashboardApp/GridDashboardControls/FilterPanel';
import FilterPanelButton from 'components/GridDashboardApp/GridDashboardControls/FilterPanelButton';
import Heading from 'components/ui/Heading';
import Icon from 'components/ui/Icon';
import InputModal from 'components/common/InputModal';
import SaveUndoBar from 'components/GridDashboardApp/GridDashboardControls/SaveUndoBar';
import ToggleSwitch from 'components/ui/ToggleSwitch';
import ZenArray from 'util/ZenModel/ZenArray';
import autobind from 'decorators/autobind';
import withScriptLoader from 'components/common/withScriptLoader';
import { VENDOR_SCRIPTS } from 'vendor/registry';
import {
  updateStateFromSpecification,
  updateDashboardOptions,
  updateDashboardFilters,
} from 'components/GridDashboardApp/stateChanges';

const TEXT = t('dashboard_builder');

type Props = {
  onResetDashboardFilters: () => void,
  onAddTextItem: () => void,
  updateDashboardState: (
    newState: Object,
    callback?: () => void,
  ) => Promise<Object>,
  updateDashboardLastSavedState: () => void,

  createDashboard: (
    specification: DashboardSpecification,
  ) => Promise<Dashboard>,
  collapsedLayout: boolean,
  dashboardModel: Dashboard,
  isAdministrator: boolean,
  isEditor: boolean,
  saveDashboard: (dashboard: Dashboard) => Promise<Dashboard>,
  unsavedChanges: boolean,
  viewMode: boolean,
};

type State = {
  isTop: boolean,
  saveAsModalVisibility: boolean,
  showDashboardSettingsModal: boolean,
  selectedFilterPanelComponents: ZenArray<string>,
};

class GridDashboardControls extends React.PureComponent<Props, State> {
  static defaultProps = {
    createDashboard: DashboardService.createDashboardFromSpecification,
    collapsedLayout: false,
    dashboardModel: Dashboard.create(),
    isAdministrator: false,
    isEditor: false,
    saveDashboard: DashboardService.updateDashboard,
    unsavedChanges: false,
    viewMode: true,
  };

  state = {
    isTop: true,
    saveAsModalVisibility: false,
    showDashboardSettingsModal: false,
    selectedFilterPanelComponents: this.props.dashboardModel
      .specification()
      .dashboardOptions()
      .filterPanelSettings()
      .initialSelectedComponents(),
  };

  componentDidMount() {
    document.addEventListener('keypress', this.onSaveShortcut);
    this.onScrollDown();
    document.addEventListener('scroll', this.onScrollDown);
  }

  componentWillUnmount() {
    document.removeEventListener('keypress', this.onSaveShortcut);
    document.removeEventListener('scroll', this.onScrollDown);
  }

  openDashboardSetttingsModal = () =>
    this.setDashboardSettingsModalVisibility(true);

  closeDashboardSetttingsModal = () =>
    this.setDashboardSettingsModalVisibility(false);

  toggleViewMode(viewMode: boolean) {
    this.props.updateDashboardState({ viewMode });
  }

  setSaveAsModalVisibility(saveAsModalVisibility: boolean) {
    this.setState({ saveAsModalVisibility });
  }

  setDashboardSettingsModalVisibility(showDashboardSettingsModal: boolean) {
    this.setState({ showDashboardSettingsModal });
  }

  @autobind
  onScrollDown() {
    const isTop = window.scrollY < 10;
    if (isTop !== this.state.isTop && !this.props.viewMode) {
      this.setState({ isTop });
    }
  }

  onCloseSaveAsModal = () => this.setSaveAsModalVisibility(false);
  onOpenSaveAsModal = () => this.setSaveAsModalVisibility(true);
  onSetEditMode = () => this.toggleViewMode(false);
  onSetViewMode = () => this.toggleViewMode(true);

  @autobind
  onSaveShortcut(event: KeyboardEvent) {
    if (event.key === 's' && event.ctrlKey) {
      this.onSaveClicked();
    }
  }

  @autobind
  onDashboardOptionsChanged(dashboardOptions: Object) {
    const { selectedFilterPanelComponents } = this.state;
    const {
      initialSelectedComponents,
    } = dashboardOptions.filterPanelSettings().modelValues();
    if (initialSelectedComponents !== selectedFilterPanelComponents) {
      this.setState({
        selectedFilterPanelComponents: initialSelectedComponents,
      });
    }
    this.props.updateDashboardState(updateDashboardOptions(dashboardOptions));
  }

  @autobind
  onSaveClicked() {
    const { saveDashboard, dashboardModel } = this.props;
    return saveDashboard(dashboardModel)
      .then(() => {
        this.props.updateDashboardLastSavedState();
        this.props.updateDashboardState({ unsavedChanges: false }, () => {
          window.toastr.success(TEXT.save_dashboard_success);
        });
        window.analytics.track('Dashboard updated', {
          dashboardName: dashboardModel.slug(),
        });
      })
      .catch(error => {
        window.toastr.error(TEXT.save_dashboard_error);
        console.error(JSON.stringify(error));
      });
  }

  @autobind
  onSaveAsClicked(newDashboardTitle: string) {
    const { createDashboard, dashboardModel } = this.props;
    const specification = dashboardModel.specification();
    const updatedSpecification = specification
      .deepUpdate()
      .dashboardOptions()
      .title(newDashboardTitle);

    return createDashboard(updatedSpecification)
      .then(createdDashboard => {
        this.onCloseSaveAsModal();
        const newDashboardName = createdDashboard.slug();
        window.location.href = `/dashboard/${newDashboardName}`;
        window.analytics.track('Dashboard cloned', {
          oldDashboardName: dashboardModel.slug(),
          newDashboardName,
        });
      })
      .catch(error => {
        this.onCloseSaveAsModal();
        window.toastr.error(TEXT.save_dashboard_error);
        console.error(JSON.stringify(error));
      });
  }

  @autobind
  onSpecificationUpdated(rawSpecification: DashboardSpecification) {
    this.props.updateDashboardState(
      updateStateFromSpecification(rawSpecification),
    );
  }

  @autobind
  onUpdateDashboardFilters(newFilterSelections: Object) {
    this.props.updateDashboardState(
      updateDashboardFilters(newFilterSelections),
    );
  }

  @autobind
  onChangeSelectedFilterPanelComponents(
    selectedFilterPanelComponents: Array<string>,
  ) {
    this.setState({
      selectedFilterPanelComponents: ZenArray.create(
        selectedFilterPanelComponents,
      ),
    });
  }

  maybeRenderSaveAsModal() {
    const { saveAsModalVisibility } = this.state;
    if (saveAsModalVisibility) {
      return (
        <InputModal
          show={saveAsModalVisibility}
          title={TEXT.clone.title}
          textElement={TEXT.clone.text}
          onRequestClose={this.onCloseSaveAsModal}
          defaultHeight={260}
          primaryButtonText={TEXT.clone.button}
          onPrimaryAction={this.onSaveAsClicked}
        />
      );
    }
    return null;
  }

  maybeRenderAddElementButton() {
    const label = this.props.collapsedLayout ? (
      ''
    ) : (
      <span className="header-action-button__text">{TEXT.add_text}</span>
    );
    return (
      <span className="dashboard-settings">
        <button
          className="header-action-button"
          onClick={this.props.onAddTextItem}
          type="button"
          zen-test-id="dashboard-add-element-button"
        >
          <Icon type="plus" />
          {label}
        </button>
      </span>
    );
  }

  maybeRenderSettingsButton() {
    const { dashboardModel, isAdministrator, collapsedLayout } = this.props;
    const specification = dashboardModel.specification();
    if (isAdministrator) {
      const options = dashboardModel.specification().dashboardOptions();
      const label = collapsedLayout ? (
        ''
      ) : (
        <span className="header-action-button__text">
          {TEXT.dashboard_settings.title}
        </span>
      );

      return (
        <span className="dashboard-settings">
          <button
            className="header-action-button"
            onClick={this.openDashboardSetttingsModal}
            type="button"
            zen-test-id="dashboard-settings-button"
          >
            <Icon type="cog" />
            {label}
          </button>
          <DashboardSettingsModal
            dashboard={dashboardModel}
            initialDashboardOptions={options}
            onDashboardOptionsChanged={this.onDashboardOptionsChanged}
            onRequestClose={this.closeDashboardSetttingsModal}
            show={this.state.showDashboardSettingsModal}
            specification={specification}
            onUpdateSpecification={this.onSpecificationUpdated}
          />
        </span>
      );
    }
    return null;
  }

  maybeRenderFilterPanelButton() {
    const { dashboardModel } = this.props;
    const { selectedFilterPanelComponents } = this.state;
    const dashboardOptions = dashboardModel.specification().dashboardOptions();
    const filterPanelSettings = dashboardOptions.filterPanelSettings();
    if (filterPanelSettings.showDashboardFilterButton()) {
      return (
        <FilterPanelButton
          onChangeSelectedOptions={this.onChangeSelectedFilterPanelComponents}
          selectedComponents={selectedFilterPanelComponents.arrayView()}
          filterPanelSettings={filterPanelSettings}
        />
      );
    }
    return null;
  }

  maybeRenderFilterPanel() {
    const { dashboardModel, onResetDashboardFilters } = this.props;
    const { selectedFilterPanelComponents } = this.state;
    const dashboardOptions = dashboardModel.specification().dashboardOptions();
    const filterPanelSettings = dashboardOptions.filterPanelSettings();
    return (
      <FilterPanel
        dashboardModel={dashboardModel}
        filterPanelSettings={filterPanelSettings}
        selectedOptions={selectedFilterPanelComponents}
        onUpdateDashboardFilters={this.onUpdateDashboardFilters}
        onResetDashboardFilters={onResetDashboardFilters}
      />
    );
  }

  maybeRenderSaveUndoBar() {
    const {
      isEditor,
      onResetDashboardFilters,
      unsavedChanges,
      collapsedLayout,
    } = this.props;

    if (isEditor) {
      return (
        <SaveUndoBar
          collapsedLayout={collapsedLayout}
          onSaveClicked={this.onSaveClicked}
          onUndoClicked={onResetDashboardFilters}
          hasUnsavedChanges={unsavedChanges}
        />
      );
    }

    return null;
  }

  maybeRenderCloneButton() {
    if (this.props.isEditor) {
      const label = this.props.collapsedLayout ? (
        ''
      ) : (
        <span className="header-action-button__text">{TEXT.clone.title}</span>
      );
      return (
        <span>
          <button
            className="header-action-button"
            onClick={this.onOpenSaveAsModal}
            type="button"
          >
            <Icon type="duplicate" />
            {label}
          </button>
          {this.maybeRenderSaveAsModal()}
        </span>
      );
    }
    return null;
  }

  maybeRenderPresentToggle() {
    const { isAdministrator, viewMode } = this.props;
    // TODO(nina): Change condition for mobile
    if (!isAdministrator || window.innerWidth < 415) {
      return null;
    }
    const onChange = viewMode ? this.onSetEditMode : this.onSetViewMode;

    // TODO(nina): $ConsolidateButtons - Eventually change this to a real
    // toggle
    return (
      <span className="grid-dashboard-header__toggle hide-in-screenshot">
        <ToggleSwitch
          value={viewMode}
          onChange={onChange}
          disabledLabel={TEXT.view_mode}
          disabledIcon="glyphicon-play-circle"
          enabledLabel={TEXT.edit_mode}
          enabledIcon="glyphicon-edit"
        />
      </span>
    );
  }

  maybeRenderControls() {
    const { viewMode, isAdministrator, dashboardModel } = this.props;
    // TODO(nina): Change condition for mobile
    if (!isAdministrator || viewMode || window.innerWidth < 415) {
      return null;
    }

    const dashboardOptions = dashboardModel.specification().dashboardOptions();
    const filterPanelSettings = dashboardOptions.filterPanelSettings();

    // HACK(nina): Until we fix the styling of the filters dropdown
    if (filterPanelSettings.showDashboardFilterButton()) {
      return (
        <div className="grid-dashboard-header__controls_with_filter_button hide-in-screenshot">
          {this.maybeRenderSaveUndoBar()}
          {this.maybeRenderCloneButton()}
          {this.maybeRenderSettingsButton()}
          {this.maybeRenderFilterPanelButton()}
        </div>
      );
    }

    return (
      <div className="grid-dashboard-header__controls hide-in-screenshot">
        {this.maybeRenderSaveUndoBar()}
        {this.maybeRenderCloneButton()}
        {this.maybeRenderSettingsButton()}
        {this.maybeRenderFilterPanelButton()}
      </div>
    );
  }

  render() {
    const specification = this.props.dashboardModel.specification();
    if (!specification) {
      return null;
    }
    const className = this.state.isTop
      ? 'grid-dashboard-header'
      : 'grid-dashboard-header float';
    return (
      <span>
        <div
          className={className}
          id="grid-dashboard-header"
          zen-test-id="grid-dashboard-header"
        >
          <Heading
            size={Heading.Sizes.SMALL}
            className="grid-dashboard-header__title"
          >
            <span zen-test-id="grid-dashboard-title">
              {specification.dashboardOptions().title()}
            </span>
          </Heading>
          {this.maybeRenderControls()}
          {this.maybeRenderPresentToggle()}
        </div>
        {this.maybeRenderFilterPanel()}
      </span>
    );
  }
}

export default withScriptLoader(GridDashboardControls, VENDOR_SCRIPTS.toastr);
