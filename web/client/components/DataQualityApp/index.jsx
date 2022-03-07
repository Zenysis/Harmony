// @flow
import * as React from 'react';
import Promise from 'bluebird';
import ReactDOM from 'react-dom';
import { RelayEnvironmentProvider } from 'react-relay/hooks';

import DataCatalogPoweredHierarchicalSelector from 'components/common/QueryBuilder/FieldHierarchicalSelector/DataCatalogPoweredHierarchicalSelector';
import DataQualityMap from 'models/DataQualityApp/DataQualityMap';
import DataQualityService from 'services/wip/DataQualityService';
import DataQualitySummary from 'components/DataQualityApp/DataQualitySummary';
import DataQualityTabs from 'components/DataQualityApp/DataQualityTabs';
import DimensionService from 'services/wip/DimensionService';
import DimensionValueFilterItem from 'models/core/wip/QueryFilterItem/DimensionValueFilterItem';
import Field from 'models/core/wip/Field';
import FieldMetadataService from 'services/wip/FieldMetadataService';
import FieldService from 'services/wip/FieldService';
import HierarchicalSelectorDropdown from 'components/ui/HierarchicalSelectorDropdown';
import HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import I18N from 'lib/I18N';
import LoadingSpinner from 'components/ui/LoadingSpinner';
import Moment from 'models/core/wip/DateTime/Moment';
import ProgressBar from 'components/ui/ProgressBar';
import Spacing from 'components/ui/Spacing';
import TimeInterval from 'models/core/wip/DateTime/TimeInterval';
import Well from 'components/ui/Well';
import patchLegacyServices from 'components/DataCatalogApp/common/patchLegacyServices';
import { autobind } from 'decorators';
import { buildFieldHierarchy } from 'models/AdvancedQueryApp/QueryFormPanel/HierarchyTree';
import { cancelPromise, cancelPromises } from 'util/promiseUtil';
import {
  createMonthlyTimeFilter,
  getDimensionValueFilterFromURL,
  getTimeIntervalFromURL,
  getURLParamFromDimensionValueFilter,
  getURLParamFromTimeInterval,
  isTabEnabled,
  updateURLParameter,
  updateURLParameters,
  OUTLIER_ANALYSIS_URL_PARAMS,
  QUALITY_SCORE_TYPES,
  REPORTING_COMPLETENESS_URL_PARAMS,
  TAB_NAMES,
  TODAY,
  URL_PARAMS,
} from 'components/DataQualityApp/util';
import { environment } from 'util/graphql';
import { getQueryParam } from 'util/util';
import type Dimension from 'models/core/wip/Dimension';
import type LinkedCategory from 'models/core/wip/LinkedCategory';
import type {
  Filters,
  QualityScoreType,
  TabName,
} from 'components/DataQualityApp/util';

const LOADING_SPINNER = (
  <Spacing marginTop="xxxl" flex justifyContent="center">
    <LoadingSpinner />
  </Spacing>
);

type DefaultProps = {
  getAllDimensions: typeof DimensionService.getAll,
  getAllFieldMetadata: typeof FieldMetadataService.getAll,
  getAllFields: typeof FieldService.getAll,
  getField: typeof FieldService.get,
  getQualityReport: typeof DataQualityService.getQualityReport,
};

type Props = DefaultProps;

// TODO(david): We do a lot of prop drilling of the selected field, filters and
// aggregations in DQL. When we move to only using global filters and
// aggregations we should store these in context.
type State = {
  allGeographyDimensions: $ReadOnlyArray<Dimension>,
  dataQualityMap: DataQualityMap | void,
  dateOptions: $ReadOnlyArray<Moment>,
  mapQualityScoreType: QualityScoreType,
  filters: Filters,
  geographyGroupBy: Dimension | void,
  hierarchyLoaded: boolean,
  indicatorHierarchy: HierarchyItem<Field | LinkedCategory>,
  loadingDataQuality: boolean,
  mapGroupByDimensions: $ReadOnlyArray<Dimension>,
  selectedField: Field | void,
  selectedIndicatorItem: HierarchyItem<Field | LinkedCategory> | void,
  selectedTab: TabName,
  timeInterval: TimeInterval,
};

const TEXT = t('DataQualityApp');

const MAP_GROUP_BY_OPTIONS = window.__JSON_FROM_BACKEND.dqlMapDimensions;
// HACK(david): Come up with a better way to know which dimensions are geography
// dimensions without using the window object
const GEO_DIMENSION_IDS = window.__JSON_FROM_BACKEND.geoFieldOrdering;
// Min data date for the date slider.
const MIN_DATA_DATE = Moment.create(window.__JSON_FROM_BACKEND.ui.minDataDate);

function buildDateOptions(startDate: Moment): $ReadOnlyArray<Moment> {
  const earliestMonth = startDate.startOf('month');
  const todaysMonth = TODAY.startOf('month');

  let month = earliestMonth;

  const options = [];
  while (month.isSameOrBefore(todaysMonth)) {
    options.push(month);
    month = month.add(1, 'months');
  }

  return options;
}

// Patch services to use GraphQL relay queries instead of potions.
patchLegacyServices();

export default class DataQualityApp extends React.Component<Props, State> {
  static defaultProps: DefaultProps = {
    getAllDimensions: DimensionService.getAll,
    getAllFieldMetadata: FieldMetadataService.getAll,
    getAllFields: FieldService.getAll,
    getField: FieldService.get,
    getQualityReport: DataQualityService.getQualityReport,
  };

  state: State = {
    allGeographyDimensions: [],
    dataQualityMap: undefined,
    dateOptions: [],
    mapQualityScoreType: QUALITY_SCORE_TYPES[0],
    filters: {
      dimensionValue: undefined,
      // time filter is updated when an indicator is selected,
      // the passed dates here just serve as initial values
      time: createMonthlyTimeFilter(Moment.create(), Moment.create()),
    },
    geographyGroupBy: undefined,
    hierarchyLoaded: false,
    indicatorHierarchy: HierarchyItem.createRoot(),
    loadingDataQuality: false,
    mapGroupByDimensions: [],
    selectedField: undefined,
    selectedIndicatorItem: undefined,
    selectedTab: TAB_NAMES.INDICATOR_CHARACTERISTICS,
    timeInterval: TimeInterval.create({
      start: Moment.create(0),
      end: Moment.create(),
    }),
  };

  _allFieldsPromise: Promise<void> | void = undefined;
  _dataQualityPromise: Promise<void> | void = undefined;
  _geographyDimensionsPromise: Promise<void> | void = undefined;

  static renderToDOM(elementId: string = 'app'): void {
    const container = document.getElementById(elementId);
    if (container) {
      ReactDOM.render(<DataQualityApp />, container);
    }
  }

  componentDidMount(): void {
    window.addEventListener('popstate', this.updateStateFromURL);

    this.updateStateFromURL();

    this.loadIndicatorHierarchy();
    this.loadGeographyDimensions();
  }

  componentDidUpdate(prevProps: Props, prevState: State): void {
    const { filters, geographyGroupBy, selectedField } = this.state;

    if (
      selectedField !== prevState.selectedField ||
      filters !== prevState.filters ||
      geographyGroupBy !== prevState.geographyGroupBy
    ) {
      this.loadDataQuality();
    }
  }

  componentWillUnmount(): void {
    cancelPromises(
      [this._allFieldsPromise, this._dataQualityPromise].filter(Boolean),
    );

    window.removeEventListener('popstate', this.updateStateFromURL);
  }

  loadIndicatorHierarchy(): void {
    const { getAllFieldMetadata, getAllFields } = this.props;

    if (this._allFieldsPromise) {
      cancelPromise(this._allFieldsPromise);
    }

    this._allFieldsPromise = Promise.all([
      getAllFields(),
      getAllFieldMetadata(),
    ]).then(([fields, fieldMetadata]) => {
      const fieldCategoryMapping = {};
      fieldMetadata.forEach(metadata => {
        fieldCategoryMapping[metadata.id()] = metadata.category();
      });
      this.setState(
        {
          indicatorHierarchy: buildFieldHierarchy(fields, fieldCategoryMapping),
          hierarchyLoaded: true,
        },
        this.updateSelectedIndicatorFromURL,
      );
    });
  }

  loadGeographyDimensions(): void {
    const { getAllDimensions } = this.props;

    if (this._geographyDimensionsPromise) {
      cancelPromise(this._geographyDimensionsPromise);
    }

    this._geographyDimensionsPromise = getAllDimensions().then(dimensions => {
      // TODO(stephen): Figure out a better way to do this since it is similar
      // logic to AQT groupings section and viz picker
      const allGeographyDimensions = dimensions.filter(dimension =>
        GEO_DIMENSION_IDS.includes(dimension.id()),
      );

      // Subset of Geo Dimensions for DQL Map. Excludes dimensions for which we
      // don't have coordinates and those for which the map takes too long to
      // load.
      // TODO(david): Do we need this any more? The limiting factor on the
      // performance of most dql queries is outliers analysis which queries at
      // the facility level anyway.
      const mapGroupByDimensions = dimensions.filter(dimension =>
        MAP_GROUP_BY_OPTIONS.includes(dimension.id()),
      );

      this.setState(
        {
          allGeographyDimensions,
          mapGroupByDimensions,
          geographyGroupBy: mapGroupByDimensions[0],
        },
        this.updateGeographyGroupByFromURL,
      );
    });
  }

  loadDataQuality(): void {
    const { getQualityReport } = this.props;
    const { filters, geographyGroupBy, selectedField } = this.state;

    if (geographyGroupBy && selectedField) {
      this.setState({ loadingDataQuality: true }, () => {
        if (this._dataQualityPromise) {
          cancelPromise(this._dataQualityPromise);
        }
        this._dataQualityPromise = getQualityReport(
          selectedField,
          filters,
          geographyGroupBy,
        ).then(dataQualityMap => {
          this.setState(
            { dataQualityMap, loadingDataQuality: false },
            this.ensureSelectedTabIsNotDisabled,
          );
        });
      });
    }
  }

  @autobind
  ensureSelectedTabIsNotDisabled() {
    const { dataQualityMap } = this.state;

    if (dataQualityMap !== undefined) {
      const overallQuality = dataQualityMap.overall();

      // If the current selected tab is disabled we select the first available
      // enabled tab
      if (!isTabEnabled(this.state.selectedTab, overallQuality)) {
        const tabNames = ((Object.values(
          TAB_NAMES,
        ): $Cast): $ReadOnlyArray<TabName>);
        const newTab = tabNames.find(tabName =>
          isTabEnabled(tabName, overallQuality),
        );

        if (newTab !== undefined) {
          this.onTabChange(newTab);
        }
      }
    }
  }

  @autobind
  updateFieldAndTimeFilters(
    indicatorId: string,
    loadedFromUrl: boolean = false,
  ): void {
    const { selectedIndicatorItem } = this.state;

    if (selectedIndicatorItem && selectedIndicatorItem.id() === indicatorId) {
      return;
    }

    // Show the loading spinner on the indicator selector until we have gathered
    // all the infromation we need about the indicator to update the page
    this.setState({ hierarchyLoaded: false }, () => {
      this.props.getField(indicatorId).then(field => {
        // TODO(yitian): use default min data date for now. Check with product
        // and find a new way to retrieve field's start date without using the
        // outdated FieldInfoService.
        const startDate = MIN_DATA_DATE;

        const dateOptions = buildDateOptions(startDate);

        this.setState(prevState => {
          const startMoment =
            dateOptions.find(option =>
              option.isSame(prevState.timeInterval.start(), 'month'),
            ) || dateOptions[0];
          const endMoment =
            dateOptions.find(option =>
              option.isSame(prevState.timeInterval.end(), 'month'),
            ) || dateOptions[dateOptions.length - 1];
          const timeFilter = createMonthlyTimeFilter(startMoment, endMoment);

          if (loadedFromUrl) {
            analytics.track('DQL Indicator Changed from URL', {
              selectedIndicator: indicatorId,
            });
          }

          return {
            selectedIndicatorItem: prevState.indicatorHierarchy.findItemById(
              indicatorId,
            ),
            selectedField: field,
            dateOptions,
            timeInterval: TimeInterval.create({
              start: startMoment,
              end: endMoment,
            }),
            filters: {
              ...prevState.filters,
              time: timeFilter,
            },
            hierarchyLoaded: true,
          };
        }, this.updateTimeFilterFromURL);
      });
    });
  }

  @autobind
  updateStateFromURL(): void {
    this.updateDimensionvalueFilterFromURL();
    this.updateGeographyGroupByFromURL();
    this.updateMapQualityScoreTypeFromURL();
    this.updateSelectedIndicatorFromURL();
    this.updatedSelectedTabFromUrl();
    this.updateTimeFilterFromURL();
  }

  updateDimensionvalueFilterFromURL(): void {
    getDimensionValueFilterFromURL(URL_PARAMS.DIMENSION_VALUE_FILTER).then(
      dimensionValueFilter =>
        this.setState(prevState => {
          if (
            !(
              prevState.filters.dimensionValue &&
              dimensionValueFilter &&
              prevState.filters.dimensionValue.isSame(dimensionValueFilter)
            ) &&
            !(prevState.filters.dimensionValue === dimensionValueFilter)
          ) {
            return {
              filters: {
                ...prevState.filters,
                dimensionValue: dimensionValueFilter,
              },
            };
          }
          return undefined;
        }),
    );
  }

  @autobind
  updateMapQualityScoreTypeFromURL(): void {
    const urlQualityScoreType = getQueryParam(URL_PARAMS.MAP_SCORE_TYPE);

    if (
      urlQualityScoreType &&
      QUALITY_SCORE_TYPES.includes(urlQualityScoreType)
    ) {
      const mapQualityScoreType = ((urlQualityScoreType: $Cast): QualityScoreType);
      this.setState({ mapQualityScoreType });
    } else {
      this.setState({ mapQualityScoreType: QUALITY_SCORE_TYPES[0] });
    }
  }

  @autobind
  updateGeographyGroupByFromURL(): void {
    const groupById = getQueryParam(URL_PARAMS.GEOGRAPHY_GROUP_BY);

    this.setState(prevState => {
      const { mapGroupByDimensions } = prevState;
      if (mapGroupByDimensions.length === 0) {
        return { geographyGroupBy: undefined };
      }

      // Find the grouping specified in the URL. If no grouping exists, default
      // to the first geo dimension.
      const geographyGroupBy =
        mapGroupByDimensions.find(dimension => dimension.id() === groupById) ||
        mapGroupByDimensions[0];

      return { geographyGroupBy };
    });
  }

  @autobind
  updateSelectedIndicatorFromURL(): void {
    const { hierarchyLoaded } = this.state;

    if (!hierarchyLoaded) {
      return;
    }

    const indicatorId = getQueryParam(URL_PARAMS.SELECTED_INDICATOR);

    if (indicatorId) {
      this.updateFieldAndTimeFilters(indicatorId, true);
    } else {
      // Default to no indicator
      this.setState({
        selectedField: undefined,
        selectedIndicatorItem: undefined,
      });
    }
  }

  updateTimeFilterFromURL(): void {
    const { dateOptions } = this.state;

    this.setState(prevState => {
      const timeInterval = getTimeIntervalFromURL(
        dateOptions,
        URL_PARAMS.TIME_FILTER,
      );

      if (
        dateOptions.length > 0 &&
        !timeInterval.isSame(prevState.timeInterval)
      ) {
        const timeFilter = createMonthlyTimeFilter(
          timeInterval.start(),
          timeInterval.end(),
        );

        return {
          timeInterval,
          filters: { ...prevState.filters, time: timeFilter },
        };
      }
      return undefined;
    });
  }

  updatedSelectedTabFromUrl(): void {
    const selectedTabParameter = getQueryParam(URL_PARAMS.SELECTED_TAB);
    const validTabNames = Object.values(TAB_NAMES);

    if (selectedTabParameter && validTabNames.includes(selectedTabParameter)) {
      const castSelectedTabParameter = ((selectedTabParameter: $Cast): TabName);
      if (this.state.selectedTab !== selectedTabParameter) {
        analytics.track('DQL Tab Changed from URL', {
          selectedTabName: castSelectedTabParameter,
        });
      }

      this.setState({ selectedTab: castSelectedTabParameter });
    } else {
      // Default to first tab
      this.setState({ selectedTab: TAB_NAMES.INDICATOR_CHARACTERISTICS });
    }
  }

  @autobind
  onDimensionValueFilterSelected(
    dimensionValueFilter: DimensionValueFilterItem | void,
  ) {
    const urlParameterValue = getURLParamFromDimensionValueFilter(
      dimensionValueFilter,
    );

    updateURLParameters([
      {
        name: URL_PARAMS.DIMENSION_VALUE_FILTER,
        value: urlParameterValue,
      },
      {
        name: REPORTING_COMPLETENESS_URL_PARAMS.DIMENSION_VALUE_FILTER,
        value: urlParameterValue,
      },
      {
        name: OUTLIER_ANALYSIS_URL_PARAMS.DIMENSION_VALUE_FILTER,
        value: urlParameterValue,
      },
    ]);

    this.setState(prevState => ({
      filters: { ...prevState.filters, dimensionValue: dimensionValueFilter },
    }));
  }

  @autobind
  onGeographyGroupBySelected(geographyGroupBy: Dimension) {
    updateURLParameter(URL_PARAMS.GEOGRAPHY_GROUP_BY, geographyGroupBy.id());

    this.setState({ geographyGroupBy });
  }

  @autobind
  onIndicatorSelected(
    selectedIndicatorItem: HierarchyItem<Field | LinkedCategory>,
  ) {
    analytics.track('DQL Indicator Selected', {
      selectedIndicator: selectedIndicatorItem.id(),
    });

    updateURLParameter(
      URL_PARAMS.SELECTED_INDICATOR,
      selectedIndicatorItem.id(),
    );

    this.updateFieldAndTimeFilters(selectedIndicatorItem.id());
  }

  @autobind
  onMapQualityScoreTypeSelected(mapQualityScoreType: QualityScoreType) {
    updateURLParameter(URL_PARAMS.MAP_SCORE_TYPE, mapQualityScoreType);
    this.setState({ mapQualityScoreType });
  }

  @autobind
  onTimeFilterSelected(start: Moment, end: Moment) {
    const timeInterval = TimeInterval.create({ start, end });
    const urlParameterValue = getURLParamFromTimeInterval(timeInterval);

    updateURLParameters([
      {
        name: URL_PARAMS.TIME_FILTER,
        value: urlParameterValue,
      },
      {
        name: REPORTING_COMPLETENESS_URL_PARAMS.TIME_FILTER,
        value: urlParameterValue,
      },
      {
        name: OUTLIER_ANALYSIS_URL_PARAMS.TIME_FILTER,
        value: urlParameterValue,
      },
    ]);

    const timeFilter = createMonthlyTimeFilter(start, end);

    this.setState(prevState => ({
      timeInterval: TimeInterval.create({ start, end }),
      filters: { ...prevState.filters, time: timeFilter },
    }));
  }

  @autobind
  onTabChange(selectedTab: TabName) {
    updateURLParameter(URL_PARAMS.SELECTED_TAB, selectedTab);
    this.setState({ selectedTab });
  }

  maybeRenderLoadingBar(): React.Node {
    const { dataQualityMap, loadingDataQuality, selectedField } = this.state;

    // Show a loading bar the first time an indicator is selected - i.e. before
    // dataQualityMap is first set. After this the sub-components, which are
    // only rendered if DataQualityMap exists, handle their own loading
    // behaviour.
    if (loadingDataQuality && selectedField && !dataQualityMap) {
      return (
        <Well className="dq-summary">
          <ProgressBar className="dq-loading-bar" enabled />
        </Well>
      );
    }
    return null;
  }

  maybeRenderDataQualityTabs(): React.Node {
    const {
      allGeographyDimensions,
      dataQualityMap,
      dateOptions,
      filters,
      loadingDataQuality,
      selectedField,
      selectedTab,
      timeInterval,
    } = this.state;

    if (
      !dataQualityMap ||
      !dataQualityMap.overall().success() ||
      !selectedField
    ) {
      return null;
    }

    return (
      <DataQualityTabs
        dateFilterOptions={dateOptions}
        dataQualityMap={dataQualityMap}
        field={selectedField}
        filters={filters}
        geographyDimensions={allGeographyDimensions}
        loading={loadingDataQuality}
        onTabChange={this.onTabChange}
        selectedTab={selectedTab}
        timeInterval={timeInterval}
      />
    );
  }

  maybeRenderDataQualitySummary(): React.Node {
    const {
      dataQualityMap,
      mapQualityScoreType,
      dateOptions,
      filters,
      geographyGroupBy,
      mapGroupByDimensions,
      loadingDataQuality,
      selectedField,
      timeInterval,
    } = this.state;

    if (!selectedField || !dataQualityMap || !geographyGroupBy) {
      return null;
    }

    return (
      <DataQualitySummary
        dataQualityMap={dataQualityMap}
        mapQualityScoreType={mapQualityScoreType}
        dateFilterOptions={dateOptions}
        dimensionValueFilter={filters.dimensionValue}
        geographyGroupBy={geographyGroupBy}
        geographyGroupByDimensions={mapGroupByDimensions}
        loading={loadingDataQuality}
        onMapQualityScoreTypeSelected={this.onMapQualityScoreTypeSelected}
        onDimensionValueFilterSelected={this.onDimensionValueFilterSelected}
        onGeographyGroupBySelected={this.onGeographyGroupBySelected}
        onTimeFilterSelected={this.onTimeFilterSelected}
        timeInterval={timeInterval}
      />
    );
  }

  renderSelector(): React.Node {
    const { selectedIndicatorItem } = this.state;
    return (
      <RelayEnvironmentProvider environment={environment}>
        <React.Suspense fallback={LOADING_SPINNER}>
          <DataCatalogPoweredHierarchicalSelector
            buttonClassName="dq-dropdown"
            defaultDropdownText={I18N.text('Select indicator')}
            enableSearch
            maxHeight={500}
            onIndicatorSelected={this.onIndicatorSelected}
            selectedIndicatorItem={selectedIndicatorItem}
            showLoadingSpinnerOnButton
          />
        </React.Suspense>
      </RelayEnvironmentProvider>
    );
  }

  renderHierarchicalSelectorDropdown(): React.Node {
    const {
      hierarchyLoaded,
      indicatorHierarchy,
      selectedIndicatorItem,
    } = this.state;
    return (
      <HierarchicalSelectorDropdown
        buttonClassName="dq-dropdown"
        defaultDropdownText={TEXT.selectIndicator}
        enableSearch
        hierarchyRoot={indicatorHierarchy}
        hierarchyLoaded={hierarchyLoaded}
        maxHeight={500}
        onItemSelected={this.onIndicatorSelected}
        selectedItem={selectedIndicatorItem}
        showLoadingSpinnerOnButton
      />
    );
  }

  render(): React.Node {
    return (
      <div
        className="dq-main-contents min-full-page-height"
        data-testid="data-quality-app"
      >
        <div className="dq-indicator-selector-container">
          <h2>{TEXT.indicator}</h2>
          <div className="dq-indicator-selector-container__selector">
            {this.renderSelector()}
          </div>
        </div>
        {this.maybeRenderLoadingBar()}
        {this.maybeRenderDataQualitySummary()}
        {this.maybeRenderDataQualityTabs()}
      </div>
    );
  }
}
