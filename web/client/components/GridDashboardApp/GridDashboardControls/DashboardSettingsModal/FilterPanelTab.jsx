// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import Checkbox from 'components/ui/Checkbox';
import Dropdown from 'components/ui/Dropdown';
import FilterPanelSettings, {
  DATE_PICKER_TYPE_OPTIONS,
} from 'models/core/Dashboard/DashboardSpecification/FilterPanelSettings';
import InfoTooltip from 'components/ui/InfoTooltip';
import ToggleSwitch from 'components/ui/ToggleSwitch';
import Well from 'components/ui/Well';
import autobind from 'decorators/autobind';
import {
  SELECT_GRANULARITY_BUTTON_ORDER,
  FILTER_ORDER,
  FILTER_OPTIONS,
} from 'backend_config';

const DEPLOYMENT = window.__JSON_FROM_BACKEND.deploymentName;
const TEXT = t('dashboard_builder.dashboard_filter');

type Props = {
  onFilterPanelSettingsUpdate: (
    filterPanelSettings: FilterPanelSettings,
  ) => void,

  filterPanelSettings: FilterPanelSettings,
};

function getSelectOptions(
  options: $ReadOnlyArray<string>,
  text: { [string]: string },
) {
  return options.map(option => (
    <Dropdown.Option key={option} value={option}>
      {text[option]}
    </Dropdown.Option>
  ));
}

export default class FilterPanelTab extends React.PureComponent<Props> {
  @autobind
  toggleDashboardFilterVisibility() {
    const { filterPanelSettings, onFilterPanelSettingsUpdate } = this.props;

    onFilterPanelSettingsUpdate(
      filterPanelSettings.showDashboardFilterButton(
        !filterPanelSettings.showDashboardFilterButton(),
      ),
    );
  }

  @autobind
  onChangeSelectedFilterPanelOptions(
    initialSelectedComponents: $ReadOnlyArray<string>,
  ) {
    const { filterPanelSettings, onFilterPanelSettingsUpdate } = this.props;
    // If the user wants to change the enabled components such that
    // ones that used to be included in `initialSelectedComponents` are no
    // longer enabled, update `initialSelectedComponents` to no longer
    // include those.
    const openComponents = filterPanelSettings
      .initialSelectedComponents()
      .filter(component => initialSelectedComponents.includes(component));
    const newFilterPanelSettings = filterPanelSettings.initialSelectedComponents(
      openComponents,
    );
    onFilterPanelSettingsUpdate(
      newFilterPanelSettings.filterPanelComponents(
        Zen.Array.create(initialSelectedComponents),
      ),
    );
  }

  @autobind
  onChangeSelectedDatePickerType(datePickerType: string) {
    const { filterPanelSettings, onFilterPanelSettingsUpdate } = this.props;
    onFilterPanelSettingsUpdate(
      filterPanelSettings.datePickerType(datePickerType),
    );
  }

  @autobind
  onChangeSelectedDisplayByOptions(aggregationLevels: $ReadOnlyArray<string>) {
    const { filterPanelSettings, onFilterPanelSettingsUpdate } = this.props;
    onFilterPanelSettingsUpdate(
      filterPanelSettings.aggregationLevels(
        Zen.Array.create(aggregationLevels),
      ),
    );
  }

  @autobind
  onChangeFilterOptions(enabledFilters: $ReadOnlyArray<string>) {
    const { filterPanelSettings, onFilterPanelSettingsUpdate } = this.props;
    onFilterPanelSettingsUpdate(
      filterPanelSettings.enabledFilters(Zen.Array.create(enabledFilters)),
    );
  }

  @autobind
  onChangeInitialSelectedComponents(
    initialSelectedComponents: $ReadOnlyArray<string>,
  ) {
    const { filterPanelSettings, onFilterPanelSettingsUpdate } = this.props;
    onFilterPanelSettingsUpdate(
      filterPanelSettings.initialSelectedComponents(
        Zen.Array.create(initialSelectedComponents),
      ),
    );
  }

  @autobind
  onChangeAutoUpdateGranularity(autoUpdateGranularity: boolean) {
    const { filterPanelSettings, onFilterPanelSettingsUpdate } = this.props;
    onFilterPanelSettingsUpdate(
      filterPanelSettings.autoUpdateGranularity(autoUpdateGranularity),
    );
  }

  renderDashboardFilterVisibilitySection() {
    return (
      <div className="filter-panel-config-item filter-visibility">
        <div className="config-label">
          {TEXT.config.showDashboardFilterButton.label}
          <InfoTooltip text={TEXT.config.showDashboardFilterButton.tooltip} />
        </div>
        <ToggleSwitch
          value={!this.props.filterPanelSettings.showDashboardFilterButton()}
          onChange={this.toggleDashboardFilterVisibility}
          activeClassName="zen-blue"
        />
      </div>
    );
  }

  renderSelectDateTypeOptions() {
    // TODO(moriah): Once Date picker options is solely in the config,
    // replace this with the options per deployment.
    const datePickerKeys =
      DEPLOYMENT === 'et'
        ? Object.keys(DATE_PICKER_TYPE_OPTIONS).map(
            k => DATE_PICKER_TYPE_OPTIONS[k],
          )
        : ['CUSTOM', 'choose_years'];
    const dateTypeOptions = getSelectOptions(
      datePickerKeys,
      TEXT.config.date_picker_options,
    );
    const { filterPanelSettings } = this.props;
    return (
      <div className="filter-panel-config-item">
        <div className="config-label">
          {TEXT.config.datePickerType.label}
          <InfoTooltip text={TEXT.config.datePickerType.tooltip} />
        </div>
        <Dropdown
          className="selectpicker config-input"
          onSelectionChange={this.onChangeSelectedDatePickerType}
          value={filterPanelSettings.datePickerType()}
          disableSelect={!filterPanelSettings.showDashboardFilterButton()}
        >
          {dateTypeOptions}
        </Dropdown>
      </div>
    );
  }

  renderDisplayByOptionsControl() {
    const displayByOptions = getSelectOptions(
      SELECT_GRANULARITY_BUTTON_ORDER,
      t('select_granularity'),
    );
    const { filterPanelSettings } = this.props;
    const {
      aggregationLevels,
      showDashboardFilterButton,
    } = filterPanelSettings.modelValues();
    return (
      <div className="filter-panel-config-item">
        <div className="config-label">
          {TEXT.config.aggregationLevels.label}
          <InfoTooltip text={TEXT.config.aggregationLevels.tooltip} />
        </div>
        <Dropdown.Multiselect
          className="selectpicker config-input"
          defaultDisplayContent={TEXT.config.aggregationLevels.empty_display}
          onSelectionChange={this.onChangeSelectedDisplayByOptions}
          value={aggregationLevels.arrayView()}
          disableSelect={!showDashboardFilterButton}
        >
          {displayByOptions}
        </Dropdown.Multiselect>
      </div>
    );
  }

  renderFilterOptions() {
    const { filterPanelSettings } = this.props;
    const filterOptions = getSelectOptions(
      FILTER_ORDER,
      t('select_filter.labels'),
    );
    return (
      <div className="filter-panel-config-item">
        <div className="config-label">
          {TEXT.config.enabledFilters.label}
          <InfoTooltip text={TEXT.config.enabledFilters.tooltip} />
        </div>
        <Dropdown.Multiselect
          className="selectpicker config-input"
          defaultDisplayContent={TEXT.config.enabledFilters.empty_display}
          onSelectionChange={this.onChangeFilterOptions}
          value={filterPanelSettings.enabledFilters().arrayView()}
          disableSelect={!filterPanelSettings.showDashboardFilterButton()}
        >
          {filterOptions}
        </Dropdown.Multiselect>
      </div>
    );
  }

  renderEnabledComponentsOptions() {
    const { filterPanelSettings } = this.props;
    const filterPanelKeys: Array<string> = FILTER_OPTIONS;
    const filterPanelOptions = getSelectOptions(
      filterPanelKeys,
      TEXT.filter_options,
    );
    return (
      <div className="filter-panel-config-item">
        <div className="config-label">
          {TEXT.config.filterPanelComponents.label}
          <InfoTooltip text={TEXT.config.filterPanelComponents.tooltip} />
        </div>
        <Dropdown.Multiselect
          className="selectpicker config-input"
          defaultDisplayContent={
            TEXT.config.filterPanelComponents.empty_display
          }
          onSelectionChange={this.onChangeSelectedFilterPanelOptions}
          value={filterPanelSettings.filterPanelComponents().arrayView()}
          disableSelect={!filterPanelSettings.showDashboardFilterButton()}
        >
          {filterPanelOptions}
        </Dropdown.Multiselect>
      </div>
    );
  }

  renderDefaultOpenComponents() {
    const { filterPanelSettings } = this.props;
    const defaultOpenOptions = getSelectOptions(
      filterPanelSettings.filterPanelComponents().arrayView(),
      TEXT.filter_options,
    );
    return (
      <div className="filter-panel-config-item">
        <div className="config-label">
          {TEXT.config.initialSelectedComponents.label}
          <InfoTooltip text={TEXT.config.initialSelectedComponents.tooltip} />
        </div>
        <Dropdown.Multiselect
          className="selectpicker config-input"
          defaultDisplayContent={
            TEXT.config.initialSelectedComponents.empty_display
          }
          onSelectionChange={this.onChangeInitialSelectedComponents}
          value={filterPanelSettings.initialSelectedComponents().arrayView()}
          disableSelect={!filterPanelSettings.showDashboardFilterButton()}
        >
          {defaultOpenOptions}
        </Dropdown.Multiselect>
      </div>
    );
  }

  renderAutoUpdateGranularitySelection() {
    return (
      <div className="filter-panel-config-item">
        <div className="config-label">
          {TEXT.config.autoUpdateGranularity.label}
          <InfoTooltip text={TEXT.config.autoUpdateGranularity.tooltip} />
        </div>
        <Checkbox
          value={this.props.filterPanelSettings.autoUpdateGranularity()}
          onChange={this.onChangeAutoUpdateGranularity}
          className="config-input"
        />
      </div>
    );
  }

  maybeRenderSettings() {
    if (!this.props.filterPanelSettings.showDashboardFilterButton()) {
      return null;
    }
    return (
      <Well>
        {this.renderEnabledComponentsOptions()}
        {this.renderDefaultOpenComponents()}
        {this.renderFilterOptions()}
        {this.renderSelectDateTypeOptions()}
        {this.renderDisplayByOptionsControl()}
        {this.renderAutoUpdateGranularitySelection()}
      </Well>
    );
  }

  render() {
    return (
      <div className="general-settings-tab">
        <p>{TEXT.config.header}</p>
        {this.renderDashboardFilterVisibilitySection()}
        {this.maybeRenderSettings()}
      </div>
    );
  }
}
