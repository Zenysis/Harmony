// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import AlertMessage, { ALERT_TYPE } from 'components/common/AlertMessage';
import Dashboard from 'models/core/Dashboard';
import FilterPanelSettings, {
  DATE_PICKER_TYPE_OPTIONS,
} from 'models/core/Dashboard/DashboardSpecification/FilterPanelSettings';
import InfoTooltip from 'components/ui/InfoTooltip';
import Intents from 'components/ui/LegacyIntents';
import LegacyButton from 'components/ui/LegacyButton';
import SelectDatesContainer from 'components/QueryApp/QueryForm/SelectDatesContainer';
import SelectFilter from 'components/QueryApp/QueryForm/SelectFilter';
import SelectGranularity from 'components/QueryApp/QueryForm/SelectGranularity';
import SelectYearContainer from 'components/GridDashboardApp/GridDashboardControls/SelectYearContainer';
import SimpleQuerySelections from 'models/core/SimpleQuerySelections';
import ZenArray from 'util/ZenModel/ZenArray';
import autobind from 'decorators/autobind';
import {
  FILTER_DIMENSIONS,
  FILTER_ORDER,
  SQT_GEOGRAPHY_FILTER_DIMENSIONS,
} from 'backend_config';
import type QuerySelectionFilter from 'models/core/SimpleQuerySelections/QuerySelectionFilter';

const TEXT = t('dashboard_builder.dashboard_filter');
const GEO_FIELD_ORDERING = window.__JSON_FROM_BACKEND.geoFieldOrdering;

// Default to EFY 2010.
const DEFAULT_ET_YEAR_DATES = {
  startDate: '2017-07-08', // Inclusive start date.
  endDate: '2018-07-08', // Exclusive end date.
};

const FILTER_OPTIONS = {
  FILTERS: 'filters',
  DATES: 'dates',
  DISPLAY_BY: 'display_by',
};

type Props = {
  dashboardModel: Dashboard,
  onResetDashboardFilters: () => void,
  onUpdateDashboardFilters: (selections: Object) => void,
  selectedOptions: ZenArray<string>,

  filterPanelSettings: FilterPanelSettings,
};

type State = {
  selections: SimpleQuerySelections,
  usingInitialFilters: boolean,
};

function _getInitialQuerySelections(filterPanelSettings) {
  let selections = SimpleQuerySelections.create({});
  if (
    filterPanelSettings.datePickerType() ===
    DATE_PICKER_TYPE_OPTIONS.ET_CHOOSE_YEARS
  ) {
    selections = selections.modelValues(DEFAULT_ET_YEAR_DATES);
  }
  return selections;
}

export default class FilterPanel extends React.PureComponent<Props, State> {
  static defaultProps = {
    filterPanelSettings: FilterPanelSettings.create({}),
  };

  state = {
    selections: _getInitialQuerySelections(this.props.filterPanelSettings),
    usingInitialFilters: true,
  };

  getFilterPanelStyle() {
    // The height of the filter panel changes depending on how much vertical
    // space the components take up. We need to always minimize this space
    // without haveing commponents overflow. Since the CUSTOM datepicker is
    // taller than other components if it is selected we need to add height.
    // Each deployment has its own number of filters, a subset of which are
    // visible depending on the filter panels configuration. Therefore height
    // needs to be added for each one that is visible.
    const { dashboardModel, filterPanelSettings, selectedOptions } = this.props;
    const dateOpen = selectedOptions.includes(FILTER_OPTIONS.DATES);
    const filterOpen = selectedOptions.includes(FILTER_OPTIONS.FILTERS);
    const groupByOpen = selectedOptions.includes(FILTER_OPTIONS.DISPLAY_BY);
    const initialFilterFlagHeight = this.state.usingInitialFilters ? 40 : 0;
    const aqtQueryFlagHeight = dashboardModel.specification().hasAQTQueries()
      ? 40
      : 0;
    const enabledFilters = filterPanelSettings.enabledFilters();
    const allOpenHeight = dateOpen && filterOpen && groupByOpen ? 50 : 0;
    const baseHeight =
      16 + initialFilterFlagHeight + 44 + aqtQueryFlagHeight + allOpenHeight;
    const filterCount = FILTER_ORDER.filter(filterType =>
      enabledFilters.includes(filterType),
    ).length;
    const filterHeight = filterOpen ? 78 * filterCount : 0;
    let dateHeight = 40;
    if (
      dateOpen &&
      filterPanelSettings.datePickerType() === DATE_PICKER_TYPE_OPTIONS.CUSTOM
    ) {
      dateHeight = 130;
    }
    return {
      height: baseHeight + Math.max(filterHeight, dateHeight),
    };
  }

  getNewGranularity(newFilter: QuerySelectionFilter) {
    const { granularity } = this.state.selections.modelValues();
    if (!newFilter) {
      return granularity;
    }
    let granularityIndex = 0;
    Object.keys(newFilter.criteria()).forEach(gran => {
      if (GEO_FIELD_ORDERING.indexOf(gran) >= granularityIndex) {
        granularityIndex++;
      }
    });
    if (this.props.filterPanelSettings.autoUpdateGranularity()) {
      // If we want to set the granularity to one below the
      // newFilter granularity
      const enabledDimensions = this.props.dashboardModel
        .specification()
        .getValidDimensions();
      // TODO(moriah): figure out a better way to autoupdate.
      if (!enabledDimensions.has(GEO_FIELD_ORDERING[granularityIndex])) {
        return GEO_FIELD_ORDERING[granularityIndex - 1];
      }
      return GEO_FIELD_ORDERING[granularityIndex];
    }
    if (GEO_FIELD_ORDERING.indexOf(granularity) < granularityIndex - 1) {
      // if the granularity is larger than that of the filters then
      // set the granularity to the filter granularity
      return GEO_FIELD_ORDERING[granularityIndex - 1];
    }
    return granularity;
  }

  onChangeSingleSelectionValue<K: Zen.ModelValueKeys<SimpleQuerySelections>>(
    key: K,
    selectionValue: $ElementType<Zen.ModelValues<SimpleQuerySelections>, K>,
  ) {
    this.setState(({ selections }) => ({
      selections: selections.set(key, selectionValue),
    }));
  }

  @autobind
  onChangeFilter(filterType: string, newFilter: QuerySelectionFilter | void) {
    if (newFilter === undefined) {
      throw new Error('new filter should never be undefined');
    }
    this.setState(
      ({ selections }) => ({
        selections: selections.setFilter(filterType, newFilter),
      }),
      () => {
        analytics.track('Updated filters selection', {
          selectionValue: this.state.selections.legacyFilters(),
        });
      },
    );
  }

  @autobind
  onChangeGeographyFilter(
    filterType: string,
    newFilter: QuerySelectionFilter | void,
  ) {
    if (newFilter === undefined) {
      throw new Error('new filter should never be undefined');
    }
    const granularity = this.getNewGranularity(newFilter);
    this.setState(({ selections }) => ({
      selections: selections
        .granularity(granularity)
        .setFilter(filterType, newFilter),
    }));
  }

  @autobind
  onChangeStartDate(startDate: string) {
    this.onChangeSingleSelectionValue('startDate', startDate);
  }

  @autobind
  onChangeEndDate(endDate: string) {
    this.onChangeSingleSelectionValue('endDate', endDate);
  }

  @autobind
  onChangeGranularity(granularity: string) {
    this.onChangeSingleSelectionValue('granularity', granularity);
  }

  @autobind
  onChangeDateType(dateType: string) {
    this.onChangeSingleSelectionValue('dateType', dateType);
  }

  @autobind
  onResetForm() {
    this.setState({
      selections: SimpleQuerySelections.create({}),
      usingInitialFilters: true,
    });
  }

  @autobind
  onUpdateDashboardFilters() {
    const { selectedOptions } = this.props;
    const {
      startDate,
      endDate,
      dateType,
      filters,
      granularity,
    } = this.state.selections.legacySelections();

    const enableFilters = selectedOptions.includes(FILTER_OPTIONS.FILTERS);
    const enableDateRange = selectedOptions.includes(FILTER_OPTIONS.DATES);
    const enableGranularity = selectedOptions.includes(
      FILTER_OPTIONS.DISPLAY_BY,
    );

    const dateRangeSelections = enableDateRange
      ? { startDate, endDate, dateType }
      : {};
    const filtersSelections = enableFilters ? { filters } : {};
    const granularitySelections =
      enableGranularity || enableFilters ? { granularity } : {};

    this.setState({ usingInitialFilters: false });
    this.props.onUpdateDashboardFilters(
      Object.assign(
        {},
        dateRangeSelections,
        filtersSelections,
        granularitySelections,
      ),
    );
  }

  maybeRenderDateWarning() {
    if (this.state.selections.startDateBeforeEndDate()) {
      return null;
    }
    return (
      <div className="alert" id="valid-dates" style={{ color: 'red' }}>
        {t('query_form.date_alert.label')}
      </div>
    );
  }

  maybeRenderNewFormWarning() {
    if (this.state.usingInitialFilters) {
      return (
        <AlertMessage type={ALERT_TYPE.INFO} className="filter-panel-warning">
          {TEXT.warning}
        </AlertMessage>
      );
    }
    return null;
  }

  maybeRenderGeographyFilterSection() {
    if (!this.props.selectedOptions.includes(FILTER_OPTIONS.FILTERS)) {
      return null;
    }
    const { selections } = this.state;
    const filterType = 'geography';
    if (!this.props.filterPanelSettings.enabledFilters().includes(filterType)) {
      return null;
    }
    return (
      <span>
        <label htmlFor="select-geography-filter">
          {t(`select_filter.labels.${filterType}`)}
        </label>
        <SelectFilter
          key={filterType}
          filterType={filterType}
          filterDimensions={SQT_GEOGRAPHY_FILTER_DIMENSIONS || []}
          onUpdateSelection={this.onChangeGeographyFilter}
          value={selections.getFilter(filterType)}
          displayLabel={false}
          useOptGroups={(SQT_GEOGRAPHY_FILTER_DIMENSIONS || []).length > 2}
        />
      </span>
    );
  }

  maybeRenderOtherFilterSection() {
    // TODO(moriah): replace this with a hierarchical Filter selector.
    // Some deployments allow filtering by non geographical filter,
    // Render those here if filters are selected and FILTER_ORDER has
    // multiple filters.
    if (
      FILTER_ORDER.length < 2 ||
      !this.props.selectedOptions.includes(FILTER_OPTIONS.FILTERS)
    ) {
      // There are no other filters.
      return null;
    }

    return FILTER_ORDER.map(filterType => {
      if (
        filterType === 'geography' ||
        !this.props.filterPanelSettings.enabledFilters().includes(filterType)
      ) {
        // Geography filter is displayed separately.
        return null;
      }
      return (
        <div className="form-group" key={filterType}>
          <label htmlFor="select-other-filter">
            {t(`select_filter.labels.${filterType}`)}
          </label>
          <SelectFilter
            key={filterType}
            filterType={filterType}
            filterDimensions={FILTER_DIMENSIONS[filterType] || []}
            onUpdateSelection={this.onChangeFilter}
            value={this.state.selections.getFilter(filterType)}
            displayLabel={false}
            useOptGroups={(FILTER_DIMENSIONS[filterType] || []).length > 2}
          />
        </div>
      );
    });
  }

  maybeRenderFilterSection() {
    return (
      <div className="form-group col-md-3">
        {this.maybeRenderGeographyFilterSection()}
        {this.maybeRenderOtherFilterSection()}
      </div>
    );
  }

  maybeRenderDateSection() {
    if (!this.props.selectedOptions.includes(FILTER_OPTIONS.DATES)) {
      return null;
    }
    switch (this.props.filterPanelSettings.datePickerType()) {
      case DATE_PICKER_TYPE_OPTIONS.ET_CHOOSE_YEARS:
        return this.renderEtYearPicker();
      case DATE_PICKER_TYPE_OPTIONS.CHOOSE_YEARS:
        return this.renderYearPicker();
      case DATE_PICKER_TYPE_OPTIONS.CUSTOM:
        return this.renderCustomDatePicker();
      default:
        return this.renderCustomDatePicker();
    }
  }

  maybeRenderAggregationSection() {
    const { selectedOptions, filterPanelSettings } = this.props;
    if (!selectedOptions.includes(FILTER_OPTIONS.DISPLAY_BY)) {
      return null;
    }

    const enabledDimension = filterPanelSettings
      .aggregationLevels()
      .arrayView();
    const { granularity } = this.state.selections.modelValues();
    return (
      <div className="form-group col-md-4">
        <label htmlFor="select-granularity">
          {t('select_granularity.label')}
        </label>
        <SelectGranularity
          filters={{}}
          enabledDimensions={enabledDimension}
          value={granularity}
          onUpdate={this.onChangeGranularity}
          displayLabel={false}
        />
      </div>
    );
  }

  maybeRenderAQTDisclaimer() {
    if (this.props.dashboardModel.specification().hasAQTQueries()) {
      // $CycloneIdaiHack
      // TODO(pablo): clean this up and handle the marginLeft via CSS, and the
      // InfoTooltip color via an INTENT variable
      return (
        <AlertMessage type={ALERT_TYPE.ERROR} className="filter-panel-warning">
          {TEXT.aqtBetaDisclaimer}
          <InfoTooltip iconStyle={{ color: '#DB3737', marginLeft: 4 }} />
        </AlertMessage>
      );
    }
    return null;
  }

  renderYearPicker() {
    const { startDate } = this.state.selections.modelValues();
    const year = startDate.split('-')[0];
    return (
      <div className="form-group col-md-4">
        <label htmlFor="select-date">{TEXT.date_label}</label>
        <SelectYearContainer
          year={year}
          onUpdateStartDate={this.onChangeStartDate}
          onUpdateEndDate={this.onChangeEndDate}
          displayLabel={false}
        />
      </div>
    );
  }

  renderEtYearPicker() {
    const { startDate } = this.state.selections.modelValues();
    const year = startDate.split('-')[0];
    return (
      <div className="form-group col-md-4">
        <label htmlFor="select-ethiopian-date">
          {TEXT.ethiopian_date_label}
        </label>
        <SelectYearContainer
          year={year}
          onUpdateStartDate={this.onChangeStartDate}
          onUpdateEndDate={this.onChangeEndDate}
          useEthiopianYear
          displayLabel={false}
        />
      </div>
    );
  }

  renderCustomDatePicker() {
    const {
      dateType,
      startDate,
      endDate,
    } = this.state.selections.modelValues();
    return (
      <div className="form-group col-md-5">
        <label htmlFor="select-date">
          {t('query_form.select_relative_date.label')}
        </label>
        <SelectDatesContainer
          dateType={dateType}
          startDate={startDate}
          endDate={endDate}
          onUpdateDateType={this.onChangeDateType}
          onUpdateStartDate={this.onChangeStartDate}
          onUpdateEndDate={this.onChangeEndDate}
          displayLabel={false}
        />
      </div>
    );
  }

  renderUpdateButton() {
    return (
      <LegacyButton
        className="filter-panel-button"
        onClick={this.onUpdateDashboardFilters}
        disabled={false}
        type={Intents.PRIMARY}
      >
        {TEXT.submit}
      </LegacyButton>
    );
  }

  renderResetDashboardButton() {
    return (
      <LegacyButton
        type="primary"
        className="filter-panel-button filter-panel-button__reset"
        onClick={this.props.onResetDashboardFilters}
      >
        {TEXT.dashboard_reset}
      </LegacyButton>
    );
  }

  renderResetFormButton() {
    return (
      <LegacyButton
        type="link"
        className="btn btn-link filter-panel-reset"
        onClick={this.onResetForm}
      >
        {TEXT.dashboard_reset}
        {TEXT.form_reset}
      </LegacyButton>
    );
  }

  renderFilterPanel() {
    return (
      <div className="form-filters ">
        {this.maybeRenderFilterSection()}
        {this.maybeRenderDateSection()}
        {this.maybeRenderAggregationSection()}
      </div>
    );
  }

  renderButtons() {
    return (
      <div className="form-actions">
        {this.renderUpdateButton()}
        {this.renderResetDashboardButton()}
      </div>
    );
  }

  render() {
    const { selectedOptions } = this.props;
    if (!selectedOptions.size()) {
      return null;
    }
    const datesOption = selectedOptions.includes(FILTER_OPTIONS.DATES);
    const filtersOption = selectedOptions.includes(FILTER_OPTIONS.FILTERS);
    const filterClassName = filtersOption ? 'more-filters' : '';
    const className =
      this.props.filterPanelSettings.datePickerType() !==
        DATE_PICKER_TYPE_OPTIONS.ET_CHOOSE_YEARS && datesOption
        ? 'horizontal-layout--normal-date'
        : 'horizontal-layout';

    return (
      <div className="dashboard-filters-panel">
        <div
          className={`${className} ${filterClassName}`}
          style={this.getFilterPanelStyle()}
        >
          {this.maybeRenderNewFormWarning()}
          {this.maybeRenderAQTDisclaimer()}
          {this.renderFilterPanel()}
          {this.renderButtons()}
        </div>
      </div>
    );
  }
}
