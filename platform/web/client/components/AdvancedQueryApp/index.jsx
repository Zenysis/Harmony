// @flow
import * as React from 'react';
import ReactDOM from 'react-dom';
import invariant from 'invariant';

import * as Zen from 'lib/Zen';
import AQTDispatch, {
  appReducer,
  initializeAQTState,
} from 'components/AdvancedQueryApp/AQTDispatch';
import I18N from 'lib/I18N';
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
import patchLegacyServices from 'components/DataCatalogApp/common/patchLegacyServices';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type {
  AQTAction,
  AQTState,
} from 'components/AdvancedQueryApp/AQTDispatch';
import type { VisualizationType } from 'models/AdvancedQueryApp/VisualizationType/types';

// Patch services to use GraphQL relay queries instead of potions.
patchLegacyServices();

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
   * Detects if an error has occurred when a state change occurs, this can
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
        notifyRecoverableError(
          I18N.text(
            'An unexpected error occurred while updating your query result. Please try again.',
            'unknownError',
          ),
        );
        return {
          ...state,

          hasError: false,
          // set the tab list to the prevTabList, which didn't have any errors
          tabList: state.prevTabList,
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
    prevTabList: Zen.Array.create([QueryTabItem.createWithUniqueId()]),
    unrecoverableError: false,
  };

  dispatch: $Dispatch<AQTAction> = action => {
    const prevTabs = this.state.tabList;
    this.setState(
      ({ hasError, prevTabList, unrecoverableError, ...prevState }) =>
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
    const { currentTabIdx, tabList } = this.state;
    return tabList.get(currentTabIdx);
  }

  @memoizeOne
  buildVisualizationPickerContext(
    vizPickerLockedVisualization: VisualizationType | void,
    currentTab: QueryTabItem,
  ): $ContextType<typeof VisualizationPickerContext> {
    return {
      displayedVisualizationType: currentTab.visualizationType(),
      enabledVisualizationTypes: currentTab.enabledVisualizationTypes(),
      lockedVisualization: vizPickerLockedVisualization,
      looselyEnabledVisualizationTypes: currentTab.looselyEnabledVisualizationTypes(),
      vizRequirementsStatusMap: currentTab.vizRequirementsStatusMap(),
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

  // TODO: eventually we should just be calling dispatch at the call site
  // (e.g. inside LiveResultsView) instead of bubbling up an
  // onQueryResultSpecChange event
  @autobind
  onQueryResultSpecChange(newSpec: QueryResultSpec) {
    this.dispatch({ newSpec, type: 'QUERY_RESULT_SPEC_CHANGE' });
  }

  // TODO: same comment as above - eventually just call dispatch at the
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
      <Spacing alignItems="center" flex flexValue={1} justifyContent="center">
        <Tag.Simple intent={Tag.Intents.DANGER}>
          <I18N id="unrecoverableError">
            Something went wrong and we are unable to show your query result.
            Please refresh the page and try again.
          </I18N>
        </Tag.Simple>
      </Spacing>
    );
  }

  renderAQT(): React.Node {
    const {
      currentTabIdx,
      showVizPickerExploreView,
      status,
      tabList,
    } = this.state;
    const { enableTabs, showSecondaryActionButtonsAsMenu } = this.props;
    const currentTab = this.currentTab();
    const queryFormPanel = (
      <QueryFormPanel
        currentQueryTab={currentTab}
        onQuerySelectionsChange={this.onQuerySelectionsChange}
        queryResultSpec={currentTab.queryResultSpec()}
        querySelections={currentTab.querySelections()}
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
          showSecondaryActionButtonsAsMenu={showSecondaryActionButtonsAsMenu}
          showVizPickerExploreView={showVizPickerExploreView}
          tabsAreEnabled={enableTabs}
          viewType={currentTab.viewType()}
          visualizationType={currentTab.visualizationType()}
        />
      </VisualizationPickerContext.Provider>
    );

    const queryTabList = enableTabs && (
      <QueryTabList
        activeTabIdx={currentTabIdx}
        status={status}
        tabList={tabList}
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
