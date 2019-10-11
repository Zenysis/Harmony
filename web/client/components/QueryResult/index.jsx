// @flow
import * as React from 'react';
import Promise from 'bluebird';
import classNames from 'classnames';

import CustomField from 'models/core/Field/CustomField';
import Field from 'models/core/Field';
import GraphTitle from 'components/visualizations/common/GraphTitle';
import QueryResultActionButtons from 'components/QueryResult/QueryResultActionButtons';
import QueryResultSpec from 'models/core/QueryResultSpec';
import QuerySelections from 'models/core/wip/QuerySelections';
import ResizeService from 'services/ResizeService';
import SettingsModal from 'components/visualizations/common/SettingsModal';
import SimpleQuerySelections from 'models/core/SimpleQuerySelections';
import ZenMap from 'util/ZenModel/ZenMap';
import { AQT_QUERY_RESULT_STATES } from 'components/AdvancedQueryApp/registry/queryResultStates';
import {
  RESULT_VIEW_COMPONENTS,
  RESULT_VIEW_CONTROLS_BLOCKS,
  RESULT_VIEW_DATA_MODEL,
  RESULT_VIEW_TYPES,
} from 'components/QueryResult/common';
import { SIMPLE_SELECTIONS_QUERY_RESULT_STATES } from 'components/QueryResult/registry/queryResultStates';
import { VENDOR_SCRIPTS } from 'vendor/registry';
import { autobind, memoizeOne } from 'decorators';
import { debounce, pick, noop } from 'util/util';
import type QueryResultState from 'models/core/QueryResultState';
import type { AxisType } from 'components/visualizations/common/SettingsModal/AxesSettingsTab/constants';
import type { ButtonControlsProps } from 'components/visualizations/common/commonTypes';
import type { Dimensions } from 'types/common';
import type { ResultViewType } from 'components/QueryResult/viewTypes';
import type { SubscriptionObject } from 'services/ResizeService';

// Allow our promises to be cancellable so that their handlers can be cleaned
// up if a component is unmounted before the promise resolves.
// TODO(stephen): Can this be configured globally?
Promise.config({ cancellation: true });

const MOBILE_WIDTH_THRESHOLD = 800;
const WINDOW_RESIZE_DEBOUNCE_TIMEOUT = 100;

type Selections = QuerySelections | SimpleQuerySelections;

type Mode =
  | 'GRID_DASHBOARD_VIEW'
  | 'GRID_DASHBOARD_AQT_VIEW'
  | 'GRID_DASHBOARD_EDIT'
  | 'QUERY_APP_VIEW'
  | 'AQT_VIEW'
  | 'PRESENT_VIEW';

const MODES: { [Mode]: Mode } = {
  GRID_DASHBOARD_VIEW: 'GRID_DASHBOARD_VIEW',
  GRID_DASHBOARD_AQT_VIEW: 'GRID_DASHBOARD_AQT_VIEW',
  GRID_DASHBOARD_EDIT: 'GRID_DASHBOARD_EDIT',
  QUERY_APP_VIEW: 'QUERY_APP_VIEW',
  AQT_VIEW: 'AQT_VIEW', // Advanced Query Tool
  PRESENT_VIEW: 'PRESENT_VIEW',
};

function getInitialQueryResultState(
  selections: Selections,
  viewType: ResultViewType,
):
  | QueryResultState<QuerySelections, any>
  | QueryResultState<SimpleQuerySelections, any> {
  if (selections instanceof SimpleQuerySelections) {
    return SIMPLE_SELECTIONS_QUERY_RESULT_STATES[viewType];
  }
  if (selections instanceof QuerySelections) {
    return AQT_QUERY_RESULT_STATES[viewType];
  }
  throw new Error(
    'Argument `selections` is not a valid type of Query Selections model',
  );
}

type Props<QSelections: Selections, ViewType: ResultViewType> = {
  queryResultSpec: QueryResultSpec,
  querySelections: QSelections,
  viewType: ViewType,

  className: string,
  collapsedLayout: boolean,
  isEditor: boolean,
  mode: Mode,
  onQueryResultSpecChange: (newSpec: QueryResultSpec) => void,
  renderButtonControlsComponent: (
    buttonControlsProps: ButtonControlsProps,
  ) => React.Node,
  smallMode: boolean,
};

type State<QSelections: Selections> = {
  isMobile: boolean,
  loadingStates: ZenMap<boolean>,
  queryResultStates: ZenMap<QueryResultState<QSelections, any>>,
  showSettingsModal: boolean,
};

function defaultRenderButtonControlsComponent(
  buttonControlsProps: ButtonControlsProps,
) {
  return (
    <QueryResultActionButtons
      className="query-result__query-app-action-buttons"
      {...buttonControlsProps}
    />
  );
}

export default class QueryResult<
  QSelections: Selections,
  ViewType: ResultViewType,
> extends React.PureComponent<
  Props<QSelections, ViewType>,
  State<QSelections>,
> {
  static Modes = MODES;
  static defaultProps = {
    className: '',
    collapsedLayout: false,
    isEditor: true,
    mode: MODES.QUERY_APP_VIEW,
    onQueryResultSpecChange: noop,
    renderButtonControlsComponent: defaultRenderButtonControlsComponent,
    smallMode: false,
  };

  // TODO(pablo): use resize subscription
  _resizeSubscription: ?SubscriptionObject = undefined;
  _queryResultStatePromise: ?Promise<void> = undefined;

  constructor(props: Props<QSelections, ViewType>) {
    super(props);
    const { queryResultSpec, querySelections } = props;

    // Global state for all visualization types:
    const loadingStates = {};
    const queryResultStates = {};
    queryResultSpec.viewTypes().forEach(viewType => {
      loadingStates[viewType] = true;
      const queryResultState = getInitialQueryResultState(
        querySelections,
        viewType,
      );
      queryResultStates[viewType] = queryResultState;
    });

    this.state = {
      isMobile: window.innerWidth < MOBILE_WIDTH_THRESHOLD,
      loadingStates: ZenMap.create(loadingStates),

      // $FlowSuppressError - remove when SimpleQuerySelections is removed
      queryResultStates: ZenMap.create(queryResultStates),
      showSettingsModal: false,
    };
  }

  componentDidMount() {
    this._resizeSubscription = ResizeService.subscribe(
      debounce(this.handleResize, WINDOW_RESIZE_DEBOUNCE_TIMEOUT),
    );
    const { queryResultSpec, querySelections, viewType } = this.props;
    const { loadingStates, queryResultStates } = this.state;
    this.processChanges(
      queryResultStates.forceGet(viewType),
      querySelections,
      queryResultSpec,
      viewType,
      loadingStates.forceGet(viewType),
    );
  }

  componentDidUpdate(prevProps: Props<QSelections, ViewType>) {
    const { queryResultSpec, querySelections, viewType } = this.props;

    // HACK(stephen): Quick check to avoid updating when only the loading state
    // has changed. This avoids updating the queryResultState multiple times in
    // a row for the same changes.
    if (
      querySelections === prevProps.querySelections &&
      queryResultSpec === prevProps.queryResultSpec &&
      viewType === prevProps.viewType
    ) {
      return;
    }

    const { loadingStates, queryResultStates } = this.state;
    this.processChanges(
      queryResultStates.forceGet(viewType),
      querySelections,
      queryResultSpec,
      viewType,
      loadingStates.forceGet(viewType),
    );
  }

  componentWillUnmount() {
    if (this._resizeSubscription) {
      ResizeService.unsubscribe(this._resizeSubscription);
    }

    this.cancelOutstandingPromise();
  }

  // Decide if a new query should be run or if the stored query result data
  // should be updated based on changes to the provided querySelections and
  // queryResultSpec.
  // NOTE(stephen): This would be a good place to use the memoizeOne decorator.
  processChanges(
    queryResultState: QueryResultState<QSelections, any>,
    querySelections: QSelections,
    queryResultSpec: QueryResultSpec,
    viewType: ViewType,
    isLoading: boolean,
  ): void {
    if (queryResultState.shouldRunNewQuery(querySelections, queryResultSpec)) {
      this.updateQueryResultState(
        queryResultState.runQuery(querySelections, queryResultSpec),
        viewType,
      );
    } else if (queryResultState.shouldRebuildQueryResult(queryResultSpec)) {
      this.updateQueryResultState(
        queryResultState.applyQueryResultTransformations(queryResultSpec),
        viewType,
      );
    } else if (isLoading) {
      // If no updates are needed but the visualization is still marked as
      // loading, mark it as not loading anymore.
      this.updateLoadingState(viewType, false);
    }
  }

  // If a queryResultState is in currently being updated, cancel its promsie
  // so the update does not continue.
  cancelOutstandingPromise(): void {
    if (
      this._queryResultStatePromise &&
      this._queryResultStatePromise.isPending()
    ) {
      this._queryResultStatePromise.cancel();
    }
  }

  updateLoadingState(viewType: ViewType, value: boolean): void {
    this.setState(({ loadingStates }) => {
      // Only update the loading state for this viewType if the value has
      // changed from the current state. This check is helpful for reducing
      // the number of state changes and component rerenders.
      if (loadingStates.get(viewType) === value) {
        return undefined;
      }
      return { loadingStates: loadingStates.set(viewType, value) };
    });
  }

  updateQueryResultState(
    promise: Promise<QueryResultState<QSelections, any>>,
    viewType: ViewType,
  ): void {
    // Mark this viewType as loading.
    this.updateLoadingState(viewType, true);

    // Cancel any existing update promises since we are running a new one.
    this.cancelOutstandingPromise();

    // When the promise completes, store the new queryResultState. Always mark
    // the viewType as not loading, even if an error is triggered. If an error
    // happens, we will not set a new queryResultState and will fallback to the
    // previously stored version.
    const queryResultStatePromise = promise
      .then(queryResultState => {
        this.setState(({ queryResultStates }) => ({
          queryResultStates: queryResultStates.set(viewType, queryResultState),
        }));
      })
      .finally(() => {
        // Only update the loading state if a new Promise has not been issued.
        // This happens if multiple long-running queries are issued close to
        // each other. Without this guard, the first query could complete before
        // the latest query, causing us to state *incorrectly* that the
        // visualization is not being loaded.
        if (
          this._queryResultStatePromise === queryResultStatePromise &&
          !queryResultStatePromise.isCancelled()
        ) {
          this.updateLoadingState(viewType, false);
        }
      });
    this._queryResultStatePromise = queryResultStatePromise;
  }

  @autobind
  closeSettingsModal(): void {
    this.setState({ showSettingsModal: false });
  }

  @autobind
  handleResize(event: Event, windowDimensions: Dimensions): void {
    const { width } = windowDimensions;
    this.setState({ isMobile: width < MOBILE_WIDTH_THRESHOLD });
  }

  @memoizeOne
  getAllFieldsHelper(
    selectedFields: $ReadOnlyArray<Field>,
    customFields: $ReadOnlyArray<CustomField>,
  ): Array<Field> {
    return selectedFields.concat(customFields);
  }

  getAllFields(): Array<Field> {
    const { querySelections, queryResultSpec } = this.props;
    let selectedFields: Array<Field>;
    if (querySelections instanceof SimpleQuerySelections) {
      selectedFields = querySelections.fields();
    } else if (querySelections instanceof QuerySelections) {
      selectedFields = querySelections.simpleQuerySelections().fields();
    } else {
      throw new Error('Prop `querySelections` is not a valid type of model.');
    }
    return this.getAllFieldsHelper(
      selectedFields,
      queryResultSpec.customFields(),
    );
  }

  getAdditionalControlsBlockArgs() {
    const { queryResultSpec, viewType } = this.props;
    if (viewType === RESULT_VIEW_TYPES.BUBBLE_CHART) {
      return { seriesSettings: queryResultSpec.getSeriesSettings(viewType) };
    }
    return null;
  }

  shouldDisplayAdvancedSettings(): boolean {
    return this.props.mode.includes('AQT');
  }

  getControlsBlock() {
    const { queryResultSpec, querySelections, viewType } = this.props;
    const queryResult = this.state.queryResultStates
      .forceGet(viewType)
      .queryResult();
    const legacySelections = querySelections.get('legacySelections');
    const displayAdvancedSettings = this.shouldDisplayAdvancedSettings();
    const ControlsBlock = RESULT_VIEW_CONTROLS_BLOCKS[viewType];

    if (ControlsBlock) {
      return (
        <ControlsBlock
          onControlsSettingsChange={this.onControlsSettingsChange}
          controls={queryResultSpec.getVisualizationControls(viewType)}
          dataFilters={queryResultSpec.dataFilters()}
          colorFilters={queryResultSpec.colorFilters()}
          selections={legacySelections}
          fields={this.getAllFields()}
          filters={queryResultSpec.filters()}
          queryResult={queryResult}
          displayAdvancedSettings={displayAdvancedSettings}
          {...this.getAdditionalControlsBlockArgs()}
        />
      );
    }
    return null;
  }

  @autobind
  updateCustomFieldsForAllQueryResults(newSpec: QueryResultSpec) {
    this.props.onQueryResultSpecChange(newSpec);
    // update the query data with the new custom field
    // TODO(stephen): Remove this and have all calculations be applied by
    // the QueryResultState directly.
    VENDOR_SCRIPTS.jsInterpreter.load().then(() => {
      this.setState(({ queryResultStates }, { viewType }) => {
        const queryState = queryResultStates.forceGet(viewType);
        const queryResult = queryState.queryResult();

        return {
          queryResultStates: queryResultStates.set(
            viewType,
            queryState.deprecatedUpdateQueryResult(
              queryResult.applyCustomFields(newSpec.customFields()),
            ),
          ),
        };
      });
    });
  }

  @autobind
  onOpenSettingsModalClick() {
    this.setState({ showSettingsModal: true });
  }

  @autobind
  onQueryDataLoad(data: any) {
    // NOTE(stephen): Using an updater function so that we always apply the
    // state change using the correct props and state. If we build the updated
    // state object outside the JS Interpreter load (but apply it inside), we
    // could accidentally operate on an old props value if the vendor script
    // load took a significant amount of time and setState was called in the
    // interim.
    const updater = (
      { loadingStates, queryResultStates },
      { viewType, queryResultSpec },
    ) => {
      // NOTE(stephen): This method is only called by visualizations who
      // have not converted to using QueryResultState yet and still fetch their
      // own data. This will be removed soon.
      let queryResult = RESULT_VIEW_DATA_MODEL[viewType].create(data);
      const customFields = queryResultSpec.customFields();
      if (customFields.length > 0) {
        queryResult = queryResult.applyCustomFields(customFields);
      }

      const queryResultState = queryResultStates
        .forceGet(viewType)
        .deprecatedUpdateQueryResult(queryResult);

      return {
        loadingStates: loadingStates.set(viewType, false),
        queryResultStates: queryResultStates.set(viewType, queryResultState),
      };
    };

    // Avoid loading JS Interpreter if we don't need to.
    if (this.props.queryResultSpec.customFields().length === 0) {
      this.setState(updater);
    } else {
      // Ensure JS Interpreter is loaded before applying custom calculations.
      // Avoiding using withScriptLoader here since it causes the query result
      // rendering to be very jarring (the loading bar won't appear until after
      // the external script has been loaded).
      VENDOR_SCRIPTS.jsInterpreter.load().then(() => {
        this.setState(updater);
      });
    }
  }

  @autobind
  onQueryDataStartLoading() {
    this.setState(({ loadingStates }, props) => {
      const { viewType } = props;
      return {
        loadingStates: loadingStates.set(viewType, true),
      };
    });
  }

  // Changing global settings: title/subtitle and their font sizes
  @autobind
  onTitleSettingsChange(settingType: string, value: any) {
    const { queryResultSpec } = this.props;
    const newSpec = queryResultSpec.updateTitleSettingValue(settingType, value);
    this.props.onQueryResultSpecChange(newSpec);

    analytics.track('Chart setting change', {
      panel: 'title',
      settingType,
      value,
    });
  }

  // Handle change in axis settings from the AxesSettingsTab in SettingsModal
  @autobind
  onAxisSettingsChange(axisType: AxisType, settingType: string, value: any) {
    const { queryResultSpec, viewType } = this.props;
    const newSpec = queryResultSpec.updateAxisValue(
      viewType,
      axisType,
      settingType,
      value,
    );
    this.props.onQueryResultSpecChange(newSpec);

    analytics.track('Chart setting change', {
      panel: 'axis',
      axisType,
      settingType,
      value,
    });
  }

  // Handle change from the SeriesSettingsTab in SettingsModal
  // This change should affect all visualizations globally
  @autobind
  onSeriesSettingsGlobalChange(
    seriesId: string,
    settingType: string,
    value: any,
  ) {
    const { queryResultSpec } = this.props;
    const newSpec = queryResultSpec.updateGlobalSeriesObjectValue(
      seriesId,
      settingType,
      value,
    );
    this.props.onQueryResultSpecChange(newSpec);

    analytics.track('Chart setting change', {
      panel: 'seriesGlobal',
      seriesId,
      settingType,
      value,
    });
  }

  // Handle change from the SeriesSettingsTab in SettingsModal
  // This event handler is visualization-specific, so it will only change
  // settings (like color, data label font sizes, etc.) for the current viewType
  @autobind
  onSeriesSettingsLocalChange(
    seriesId: string,
    settingType: string,
    value: any,
  ) {
    const { queryResultSpec, viewType } = this.props;
    const newSpec = queryResultSpec.updateSeriesObjectValue(
      viewType,
      seriesId,
      settingType,
      value,
    );
    this.props.onQueryResultSpecChange(newSpec);

    analytics.track('Chart setting change', {
      panel: 'seriesLocal',
      seriesId,
      settingType,
      value,
    });
  }

  // Handle change from the SeriesSettingsTab in SettingsModal
  // This event handler is visualization-specific, so it will only change the
  // order of the series objects for the current viewType
  @autobind
  onSeriesOrderChange(seriesId: string, newIndex: number) {
    const { queryResultSpec, viewType } = this.props;
    const newSpec = queryResultSpec.moveSeriesToNewIndex(
      viewType,
      seriesId,
      newIndex,
    );
    this.props.onQueryResultSpecChange(newSpec);

    analytics.track('Chart setting change', {
      panel: 'seriesOrder',
      seriesId,
      type: 'order',
      value: newIndex,
    });
  }

  @autobind
  onLegendSettingsChange(settingType: string, value: any) {
    const { queryResultSpec, viewType } = this.props;
    const newSpec = queryResultSpec.updateLegendSettingValue(
      viewType,
      settingType,
      value,
    );
    this.props.onQueryResultSpecChange(newSpec);

    analytics.track('Chart setting change', {
      panel: 'legend',
      type: settingType,
      value,
    });
  }

  @autobind
  onControlsSettingsChange(controlKey: string, value: any) {
    const { queryResultSpec, viewType } = this.props;
    const newSpec = queryResultSpec.updateVisualizationControlValue(
      viewType,
      controlKey,
      value,
    );
    this.props.onQueryResultSpecChange(newSpec);
  }

  // TODO(pablo): refactor this. Filters should not be returning two
  // different representations of the same filters.
  @autobind
  onFiltersChange(newFilters: {}, optionsSelected: {}) {
    const { queryResultSpec } = this.props;
    const newSpec = queryResultSpec
      .filters(newFilters)
      .modalFilters(optionsSelected);
    this.props.onQueryResultSpecChange(newSpec);
  }

  @autobind
  onCalculationSubmit(customField: CustomField) {
    this.updateCustomFieldsForAllQueryResults(
      this.props.queryResultSpec.addNewCustomField(customField),
    );
  }

  @autobind
  onEditCalculation(previousField: CustomField, newField: CustomField) {
    this.updateCustomFieldsForAllQueryResults(
      this.props.queryResultSpec.changeExistingCustomField(
        previousField,
        newField,
      ),
    );
  }

  @autobind
  onDeleteCalculation(customField: CustomField) {
    this.updateCustomFieldsForAllQueryResults(
      this.props.queryResultSpec.removeExistingCustomField(customField),
    );
  }

  maybeRenderSettingsModal() {
    if (
      !this.state.showSettingsModal ||
      this.props.mode === MODES.GRID_DASHBOARD_EDIT
    ) {
      return null;
    }

    const { queryResultSpec, viewType } = this.props;
    const settingsEvents = pick(this, SettingsModal.eventNames);
    const displayAdvancedSettings = this.shouldDisplayAdvancedSettings();
    return (
      <SettingsModal
        viewType={viewType}
        controlsBlock={this.getControlsBlock()}
        fullScreen={this.state.isMobile}
        show={this.state.showSettingsModal}
        onRequestClose={this.closeSettingsModal}
        titleSettings={queryResultSpec.titleSettings()}
        visualizationSettings={
          queryResultSpec.visualizationSettings()[viewType]
        }
        displayAdvancedSettings={displayAdvancedSettings}
        {...settingsEvents}
      />
    );
  }

  maybeRenderActionButtons() {
    const {
      querySelections,
      queryResultSpec,
      viewType,
      renderButtonControlsComponent,
    } = this.props;

    const buttonControlsProps = {
      allFields: this.getAllFields(),
      onFiltersChange: this.onFiltersChange,
      onOpenSettingsModalClick: this.onOpenSettingsModalClick,
      onCalculationSubmit: this.onCalculationSubmit,
      onEditCalculation: this.onEditCalculation,
      onDeleteCalculation: this.onDeleteCalculation,
      queryResultSpec,
      querySelections,
      viewType,
    };

    return renderButtonControlsComponent(buttonControlsProps);
  }

  renderVisualization() {
    const {
      queryResultSpec,
      querySelections,
      viewType,
      smallMode,
      mode,
    } = this.props;
    // TODO(pablo): make this function type-safe, currently it does not actually
    // type check VisualizationComponent at all because it is `any`
    const VisualizationComponent = RESULT_VIEW_COMPONENTS[viewType];
    const { loadingStates, queryResultStates } = this.state;
    const loading = loadingStates.get(viewType);
    const queryResult = queryResultStates.forceGet(viewType).queryResult();
    const legacySelections = querySelections.get('legacySelections');
    const isPresentMode = mode === MODES.PRESENT_VIEW;

    return (
      <VisualizationComponent
        smallMode={smallMode}
        isMobile={this.state.isMobile}
        loading={loading}
        queryResult={queryResult}
        queryResultSpec={queryResultSpec}
        onQueryDataLoad={this.onQueryDataLoad}
        onQueryDataStartLoading={this.onQueryDataStartLoading}
        onControlsSettingsChange={this.onControlsSettingsChange}
        selections={legacySelections}
        fields={this.getAllFields()}
        filters={queryResultSpec.filters()}
        dataFilters={queryResultSpec.dataFilters()}
        colorFilters={queryResultSpec.colorFilters()}
        axesSettings={queryResultSpec.getAxesSettings(viewType)}
        groupBySettings={queryResultSpec.groupBySettings()}
        seriesSettings={queryResultSpec.getSeriesSettings(viewType)}
        legendSettings={queryResultSpec.getLegendSettings(viewType)}
        controls={queryResultSpec.getVisualizationControls(viewType)}
        isPresentMode={isPresentMode}
      />
    );
  }

  renderTitle() {
    return (
      <div className="title">
        <GraphTitle
          isMobile={this.state.isMobile}
          settings={this.props.queryResultSpec.titleSettings()}
        />
      </div>
    );
  }

  render() {
    const { className, smallMode } = this.props;
    const mainClassName = classNames('query-result-view', className, {
      'small-mode': smallMode,
    });

    return (
      <div className={mainClassName}>
        {this.maybeRenderActionButtons()}
        <div className="visualization-container">
          {this.renderTitle()}
          {this.renderVisualization()}
          {this.maybeRenderSettingsModal()}
        </div>
      </div>
    );
  }
}
