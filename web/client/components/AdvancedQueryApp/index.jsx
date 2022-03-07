// @flow
import * as React from 'react';
import ReactDOM from 'react-dom';
import invariant from 'invariant';

import * as Zen from 'lib/Zen';
import AQTDispatch, {
  appReducer,
  initializeAQTState,
} from 'components/AdvancedQueryApp/AQTDispatch';
import LiveResultsView from 'components/AdvancedQueryApp/LiveResultsView';
import QueryFormPanel from 'components/AdvancedQueryApp/QueryFormPanel';
import QuerySelections from 'models/core/wip/QuerySelections';
import QueryTabItem from 'models/AdvancedQueryApp/QueryTabItem';
import QueryTabList from 'components/AdvancedQueryApp/QueryTabList';
import Spacing from 'components/ui/Spacing';
import Tag from 'components/ui/Tag';
import Toaster from 'components/ui/Toaster';
import VisualizationPickerContext from 'components/AdvancedQueryApp/VisualizationPickerContext';
import autobind from 'decorators/autobind';
import memoizeOne from 'decorators/memoizeOne';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type {
  AQTAction,
  AQTState,
} from 'components/AdvancedQueryApp/AQTDispatch';
import type { VisualizationType } from 'models/AdvancedQueryApp/VisualizationType/types';

type Props = {
  /** Enable AQT tabs (and persisting them to the browser store) */
  enableTabs: boolean,

  /**
   * Optional initial tab to start AQT with
   */
  initialTab?: QueryTabItem,

  /**
   * Optional callback for when the AQT tabs change
   */
  onTabsChange?: (tabs: Zen.Array<QueryTabItem>) => void,

  /**
   * Render the secondary action buttons (e.g. 'Share' and 'Add to Dashboard')
   * as a menu, instead of a row of buttons.
   */
  showSecondaryActionButtonsAsMenu: boolean,
};

type State = {
  ...AQTState,

  /** Detects if any state change causes an error */
  hasError: boolean,

  /** List of all previous tabs current held in state */
  prevTabList: Zen.Array<QueryTabItem>,

  /** Detects if there is an error and we cannot recover from it */
  unrecoverableError: boolean,
};

const TEXT = t('AdvancedQueryApp');

function notifyRecoverableError(errorMsg: string) {
  Toaster.error(errorMsg);
}

export default class AdvancedQueryApp extends React.Component<Props, State> {
  static defaultProps: $AllowZenModelDefaultProp = {
    enableTabs: true,
    initialTab: undefined,
    onTabsChange: undefined,
    showSecondaryActionButtonsAsMenu: false,
  };

  static renderToDOM(elementId?: string = 'app') {
    const elt: ?HTMLElement = document.getElementById(elementId);
    invariant(elt, `Element ID does not exist: ${elementId}`);
    ReactDOM.render(<AdvancedQueryApp />, elt);
  }

  /**
   * Detects if an error has occured when a state change occurs, this can
   * derive from any form of state change (e.g. settings)
   * In addition, this function detects if there is an unrecoverable state
   * where the previous and current state are the same but the error exists.
   *
   * @param props
   * @param state
   */
  static getDerivedStateFromProps(props: Props, state: State): $Shape<State> {
    const { currentTabIdx, hasError, prevTabList, tabList } = state;
    if (hasError) {
      // we encountered an error, so determine if it is recoverable or not:
      // things are recoverable if the previous tab list had the current tab
      // index we're looking at, and it is NOT the same as the current tab.
      // If it's different then we can assume it's safe to revert back to it.
      if (
        prevTabList.get(currentTabIdx) &&
        prevTabList.get(currentTabIdx) !== tabList.get(currentTabIdx)
      ) {
        notifyRecoverableError(TEXT.unknownError);
        return {
          ...state,

          // set the tab list to the prevTabList, which didn't have any errors
          tabList: state.prevTabList,
          hasError: false,
          unrecoverableError: false,
        };
      }
      return { unrecoverableError: true };
    }

    return { prevTabList: state.tabList };
  }

  static getDerivedStateFromError(): $Shape<State> {
    return { hasError: true };
  }

  state: State = {
    ...initializeAQTState({
      enableTabs: this.props.enableTabs,
      initialTab: this.props.initialTab,
    }),
    hasError: false,
    unrecoverableError: false,
    prevTabList: Zen.Array.create([QueryTabItem.createWithUniqueId()]),
  };

  dispatch: $Dispatch<AQTAction> = action => {
    const prevTabs = this.state.tabList;
    this.setState(
      ({ hasError, unrecoverableError, prevTabList, ...prevState }) =>
        appReducer(prevState, action),
      () => {
        // if the tabs changed after a dispatched action, then trigger
        // the onTabsChange event
        const { tabList } = this.state;
        const { onTabsChange } = this.props;
        if (prevTabs !== tabList && onTabsChange) {
          onTabsChange(tabList);
        }
      },
    );
  };

  currentTab(): QueryTabItem {
    const { tabList, currentTabIdx } = this.state;
    return tabList.get(currentTabIdx);
  }

  @memoizeOne
  buildVisualizationPickerContext(
    vizPickerLockedVisualization: VisualizationType | void,
    currentTab: QueryTabItem,
  ): $ContextType<typeof VisualizationPickerContext> {
    return {
      lockedVisualization: vizPickerLockedVisualization,
      vizRequirementsStatusMap: currentTab.vizRequirementsStatusMap(),
      enabledVisualizationTypes: currentTab.enabledVisualizationTypes(),
      displayedVisualizationType: currentTab.visualizationType(),
      looselyEnabledVisualizationTypes: currentTab.looselyEnabledVisualizationTypes(),
    };
  }

  // create the context specific to the visualizationPicker
  getVisualizationPickerContext(): $ContextType<
    typeof VisualizationPickerContext,
  > {
    const { vizPickerLockedVisualization } = this.state;
    return this.buildVisualizationPickerContext(
      vizPickerLockedVisualization,
      this.currentTab(),
    );
  }

  // TODO(pablo): eventually we should just be calling dispatch at the call site
  // (e.g. inside LiveResultsView) instead of bubbling up an
  // onQueryResultSpecChange event
  @autobind
  onQueryResultSpecChange(newSpec: QueryResultSpec) {
    this.dispatch({ newSpec, type: 'QUERY_RESULT_SPEC_CHANGE' });
  }

  // TODO(pablo): same comment as above - eventually just call dispatch at the
  // call site (in QueryFormPanel) instead of drilling down this prop
  @autobind
  onQuerySelectionsChange(querySelections: QuerySelections) {
    this.dispatch({
      querySelections,
      type: 'QUERY_SELECTIONS_CHANGE',
    });
  }

  renderErrorMessage(): React.Node {
    return (
      <Spacing flex flexValue={1} justifyContent="center" alignItems="center">
        <Tag.Simple intent={Tag.Intents.DANGER}>
          {TEXT.unrecoverableError}
        </Tag.Simple>
      </Spacing>
    );
  }

  renderAQT(): React.Node {
    const {
      currentTabIdx,
      tabList,
      showVizPickerExploreView,
      status,
    } = this.state;
    const { enableTabs, showSecondaryActionButtonsAsMenu } = this.props;
    const currentTab = this.currentTab();
    const queryFormPanel = (
      <QueryFormPanel
        currentQueryTab={currentTab}
        queryResultSpec={currentTab.queryResultSpec()}
        querySelections={currentTab.querySelections()}
        onQuerySelectionsChange={this.onQuerySelectionsChange}
        tabsAreEnabled={enableTabs}
      />
    );

    const liveResultsView = (
      <VisualizationPickerContext.Provider
        value={this.getVisualizationPickerContext()}
      >
        <LiveResultsView
          onQueryResultSpecChange={this.onQueryResultSpecChange}
          queryResultSpec={currentTab.queryResultSpec()}
          querySelections={currentTab.querySelections()}
          viewType={currentTab.viewType()}
          visualizationType={currentTab.visualizationType()}
          showVizPickerExploreView={showVizPickerExploreView}
          tabsAreEnabled={enableTabs}
          showSecondaryActionButtonsAsMenu={showSecondaryActionButtonsAsMenu}
        />
      </VisualizationPickerContext.Provider>
    );

    const queryTabList = enableTabs && (
      <QueryTabList
        activeTabIdx={currentTabIdx}
        tabList={tabList}
        status={status}
      />
    );
    return (
      <AQTDispatch.Provider value={this.dispatch}>
        <div className="advanced-query-app__query-view">
          {queryFormPanel}
          {liveResultsView}
        </div>
        {queryTabList}
      </AQTDispatch.Provider>
    );
  }

  render(): React.Node {
    const { unrecoverableError } = this.state;
    return (
      <div
        className="advanced-query-app min-full-page-height"
        data-testid="advanced-query-app"
        id="advanced-query-app"
      >
        {unrecoverableError ? this.renderErrorMessage() : this.renderAQT()}
      </div>
    );
  }
}
