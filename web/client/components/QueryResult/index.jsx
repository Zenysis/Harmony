// @flow
import * as React from 'react';
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import BubbleChartSettings from 'models/visualizations/BubbleChart/BubbleChartSettings';
import ElementResizeService from 'services/ui/ElementResizeService';
import GraphTitle from 'components/visualizations/common/GraphTitle';
import NoResultsScreen from 'components/QueryResult/NoResultsScreen';
import NumberTrendSettings from 'models/visualizations/NumberTrend/NumberTrendSettings';
import QuerySelections from 'models/core/wip/QuerySelections';
import autobind from 'decorators/autobind';
import { AQT_QUERY_RESULT_STATES } from 'components/AdvancedQueryApp/registry/queryResultStates';
import { RESULT_VIEW_COMPONENTS } from 'components/QueryResult/common';
import { noop } from 'util/util';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type QueryResultState from 'models/core/QueryResultState';
import type { ResizeRegistration } from 'services/ui/ElementResizeService';
import type { ResultViewType } from 'components/QueryResult/viewTypes';

// Allow our promises to be cancellable so that their handlers can be cleaned
// up if a component is unmounted before the promise resolves.
// TODO(stephen): Can this be configured globally?
Promise.config({ cancellation: true });

const MOBILE_WIDTH_THRESHOLD = 800;

type DefaultProps = {
  className: string,

  /** We include this prop because we want the option to bypass any of the
   * visible changes when we enter 'mobile mode', i.e. when we shrink past a
   * specific screen width. In the future we should (1) create a better way
   * to detect 'mobile mode', and (2) better standardize the visual changes
   * so that we don't need this prop anymore.  */
  enableMobileMode: boolean,
  enableWarningMessages: boolean,
  onQueryResultSpecChange: (newSpec: QueryResultSpec) => void,
  smallMode: boolean,
};

type Props<ViewType: ResultViewType> = {
  ...DefaultProps,
  queryResultSpec: QueryResultSpec,
  querySelections: QuerySelections,
  viewType: ViewType,
};

type State = {
  isMobile: boolean,
  loadingStates: Zen.Map<boolean>,
  queryResultStates: Zen.Map<QueryResultState<any>>,
};

export default class QueryResult<
  ViewType: ResultViewType,
> extends React.PureComponent<Props<ViewType>, State> {
  static defaultProps: DefaultProps = {
    className: '',
    enableMobileMode: true,
    enableWarningMessages: false,
    onQueryResultSpecChange: noop,
    smallMode: false,
  };

  queryResultElt: ?HTMLDivElement;
  resizeRegistration: ResizeRegistration<HTMLDivElement> = ElementResizeService.register<HTMLDivElement>(
    this.onResize,
    (elt: HTMLDivElement | null | void) => {
      this.queryResultElt = elt;
    },
  );

  _queryResultStatePromise: ?Promise<void> = undefined;

  constructor(props: Props<ViewType>) {
    super(props);
    const { queryResultSpec } = props;

    // Global state for all visualization types:
    const loadingStates = {};
    const queryResultStates = {};
    queryResultSpec.viewTypes().forEach(viewType => {
      loadingStates[viewType] = true;
      queryResultStates[viewType] = AQT_QUERY_RESULT_STATES[viewType];
    });

    this.state = {
      isMobile: window.innerWidth < MOBILE_WIDTH_THRESHOLD,
      loadingStates: Zen.Map.create(loadingStates),
      queryResultStates: Zen.Map.create(queryResultStates),
    };
  }

  componentDidMount() {
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

  componentDidUpdate(prevProps: Props<ViewType>) {
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
    this.cancelOutstandingPromise();
  }

  // Decide if a new query should be run or if the stored query result data
  // should be updated based on changes to the provided querySelections and
  // queryResultSpec.
  // NOTE(stephen): This would be a good place to use the memoizeOne decorator.
  processChanges(
    queryResultState: QueryResultState<any>,
    querySelections: QuerySelections,
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
    promise: Promise<QueryResultState<any>>,
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
    const queryResultStatePromise = promise.then(queryResultState => {
      this.setState(({ queryResultStates }) => ({
        queryResultStates: queryResultStates.set(viewType, queryResultState),
      }));
    });

    queryResultStatePromise.finally(() => {
      // Only update the loading state if a new Promise has not been issued.
      // This happens if multiple long-running queries are issued close to
      // each other. Without this guard, the first query could complete before
      // the latest query, causing us to state *incorrectly* that the
      // visualization is not being loaded.
      if (
        this._queryResultStatePromise === queryResultStatePromise &&
        // $FlowIssue[prop-missing] bluebird flow-typed is missing an annotation for isCancelled
        !queryResultStatePromise.isCancelled()
      ) {
        this.updateLoadingState(viewType, false);
      }
    });
    this._queryResultStatePromise = queryResultStatePromise;
  }

  @autobind
  onResize(): void {
    if (!this.queryResultElt) {
      return;
    }
    const { innerWidth } = window;
    this.setState({ isMobile: innerWidth < MOBILE_WIDTH_THRESHOLD });
  }

  @autobind
  onControlsSettingsChange(controlKey: string, value: any) {
    const { onQueryResultSpecChange, queryResultSpec, viewType } = this.props;
    const newSpec = queryResultSpec.updateVisualizationControlValue(
      viewType,
      controlKey,
      value,
    );
    onQueryResultSpecChange(newSpec);
  }

  renderVisualization(): React.Node {
    const {
      enableWarningMessages,
      queryResultSpec,
      querySelections,
      viewType,
      smallMode,
    } = this.props;

    // TODO(pablo): make this function type-safe, currently it does not actually
    // type check VisualizationComponent at all because it is `any`
    const VisualizationComponent = RESULT_VIEW_COMPONENTS[viewType];
    const { loadingStates, queryResultStates } = this.state;
    const loading = loadingStates.forceGet(viewType);
    const queryResult = queryResultStates.forceGet(viewType).queryResult();

    // TODO(nina, stephen): Rename `isPresentMode` in viz components to be
    // `enableWarningMessages` since the original name is tied very tightly to
    // implementation.
    return (
      <VisualizationComponent
        smallMode={smallMode}
        loading={loading}
        queryResult={queryResult}
        queryResultSpec={queryResultSpec}
        onControlsSettingsChange={this.onControlsSettingsChange}
        selections={querySelections}
        dataFilters={queryResultSpec.dataFilters()}
        customFields={queryResultSpec.customFields()}
        axesSettings={queryResultSpec.getAxesSettings(viewType)}
        groupBySettings={queryResultSpec.groupBySettings()}
        seriesSettings={queryResultSpec.getSeriesSettings(viewType)}
        legendSettings={queryResultSpec.getLegendSettings(viewType)}
        controls={queryResultSpec.getVisualizationControls(viewType)}
        isPresentMode={enableWarningMessages}
      />
    );
  }

  renderTitle(): React.Node {
    const { enableMobileMode, queryResultSpec, viewType } = this.props;
    const seriesSettings = queryResultSpec.getSeriesSettings(viewType);
    const titleSettings = queryResultSpec.titleSettings();
    const controls = queryResultSpec.getVisualizationControls(viewType);
    const visibleFields = seriesSettings
      .seriesOrder()
      .filter(field => seriesSettings.seriesObjects()[field].isVisible());
    let numExtraFields = 0;
    let displayId;

    // Number/Trend does not show the title or subtitle
    if (controls instanceof NumberTrendSettings) {
      return null;
    }

    if (titleSettings.title() === '') {
      displayId = controls.getTitleField();
      [displayId] = visibleFields;
      numExtraFields = visibleFields.length - 1;
      if (controls instanceof BubbleChartSettings) {
        // only applicable for scatterplot
        const settings = Zen.cast<BubbleChartSettings>(controls);
        const { xAxis, yAxis, zAxis } = settings.modelValues();
        const numUnique = new Set([xAxis, yAxis, zAxis]).size;
        numExtraFields = numUnique - 1;

        // if the zaxis is none, it will be counted as a unique field
        // so we need to subtract it
        if (zAxis === 'none') {
          numExtraFields -= 1;
        }
      }
    }

    const displayTitle = displayId
      ? seriesSettings.seriesObjects()[displayId].label()
      : titleSettings.title();

    return (
      <GraphTitle
        isMobile={enableMobileMode && this.state.isMobile}
        settings={titleSettings}
        displayTitle={displayTitle}
        numExtraFields={numExtraFields}
      />
    );
  }

  render(): React.Node {
    const { viewType } = this.props;
    const { loadingStates, queryResultStates } = this.state;
    const loading = loadingStates.forceGet(viewType);
    const queryResult = queryResultStates.forceGet(viewType).queryResult();

    const vizContent =
      !loading && queryResult.isEmpty() ? (
        <NoResultsScreen />
      ) : (
        this.renderVisualization()
      );

    return (
      <div
        className={`visualization-container ${this.props.className}`}
        ref={this.resizeRegistration.setRef}
      >
        {this.renderTitle()}
        {vizContent}
      </div>
    );
  }
}
