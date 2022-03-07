// @flow
import * as React from 'react';
import invariant from 'invariant';

import * as Zen from 'lib/Zen';
import QuerySelections from 'models/core/wip/QuerySelections';
import QueryTabItem from 'models/AdvancedQueryApp/QueryTabItem';
import selectVisualization from 'models/AdvancedQueryApp/VisualizationType/selectVisualization';
import { DEFAULT_VISUALIZATION_TYPE } from 'models/AdvancedQueryApp/VisualizationType/registry';
import { noop } from 'util/util';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type { VisualizationType } from 'models/AdvancedQueryApp/VisualizationType/types';

/** Track the app status as a state machine */
export const AQTStatuses = Object.freeze({
  LOADING_TABS: 'LOADING_TABS',

  // signifies when AQT is ready (i.e. all tabs have loaded)
  AQT_READY: 'AQT_READY',
});
export type AQTStatus = $Keys<typeof AQTStatuses>;

/**
 * This holds the AdvancedQueryApp's global app state that is managed by
 * AQTDispatch.
 */
export type AQTState = {
  /** The index of the current tab being displayed */
  currentTabIdx: number,

  /** The list of all tabs currently held in state */
  tabList: Zen.Array<QueryTabItem>,

  /**
   * Whether or not we should show the viz picker's Explore view over the
   * current query result.
   */
  showVizPickerExploreView: boolean,

  /** The visualization we've locked in on in the viz picker */
  vizPickerLockedVisualization: VisualizationType | void,

  /** Track the app status as a state machine */
  status: AQTStatus,
};

export function initializeAQTState(initialValues: {
  enableTabs: boolean,
  initialTab: QueryTabItem | void,
}): AQTState {
  const { enableTabs, initialTab } = initialValues;
  const tabList = Zen.Array.create([
    initialTab || QueryTabItem.createWithUniqueId(),
  ]);
  return {
    tabList,
    currentTabIdx: 0,
    showVizPickerExploreView: initialTab === undefined,
    vizPickerLockedVisualization: undefined,
    status: enableTabs ? AQTStatuses.LOADING_TABS : AQTStatuses.AQT_READY,
  };
}

export type AQTAction =
  /** Sets a new query selections model */
  | { type: 'QUERY_SELECTIONS_CHANGE', querySelections: QuerySelections }

  /** Sets a new query result spec */
  | { type: 'QUERY_RESULT_SPEC_CHANGE', newSpec: QueryResultSpec }

  /**
   * Change the current *visualization* type. This is different from changing
   * a ResultViewType because a visualization type can be a more specific form
   * of a view type. E.g. a SCORECARD is a visualization that is a specific
   * configuration of the TABLE view type.
   */
  | { type: 'VISUALIZATION_TYPE_CHANGE', visualizationType: VisualizationType }

  /** Toggle the viz picker's explore view to either show or not */
  | { type: 'VIZ_PICKER_EXPLORE_VIEW_TOGGLE', show: boolean }

  /**
   * Lock in on a visualization in the viz picker's explore view (or unlock
   * it by setting to undefined)
   */
  | {
      type: 'VIZ_PICKER_VISUALIZATION_LOCK',
      visualizationType: VisualizationType | void,
    }

  /** Add a new tab and switch to it */
  | { type: 'NEW_TAB_ADD', newTab: QueryTabItem }

  /** Update the current tab list as well as the current tab index
   * if necessary. */
  | {
      type: 'TAB_LIST_CHANGE',
      tabList: Zen.Array<QueryTabItem>,
      newTabIdx?: number,
    }

  /** Load in a new tab list and reset the current tab index */
  | {
      type: 'TAB_LIST_LOAD',
      tabList: Zen.Array<QueryTabItem>,
      currentTabIdx: number,
    }

  /** Change the current tab to a new index */
  | { type: 'CURRENT_TAB_CHANGE', newTabIdx: number }

  /** Change the current visualization and the result spec */
  | {
      type: 'VISUALIZATION_AND_SPEC_CHANGE',
      visualizationType: VisualizationType,
      newSpec: QueryResultSpec,
    };

export function appReducer(state: AQTState, action: AQTAction): AQTState {
  const { currentTabIdx, tabList, vizPickerLockedVisualization } = state;
  const currentTab = tabList.get(currentTabIdx);

  switch (action.type) {
    case 'QUERY_SELECTIONS_CHANGE': {
      const { querySelections } = action;
      // NOTE(toshi, stephen): If there are no fields selected, we need to clear
      // queryResultSpec as well
      let updatedTab = currentTab.querySelections(querySelections);
      if (querySelections.fields().size() === 0) {
        updatedTab = updatedTab.queryResultSpec(undefined);
      }

      // if we are locked into a visualization and it suddenly is enabled, then
      // lets switch to it
      if (
        vizPickerLockedVisualization !== undefined &&
        updatedTab.isVisualizationTypeEnabled(vizPickerLockedVisualization)
      ) {
        const newState = {
          ...state,
          tabList: tabList.set(currentTabIdx, updatedTab),
        };

        return appReducer(newState, {
          type: 'VISUALIZATION_TYPE_CHANGE',
          visualizationType: vizPickerLockedVisualization,
        });
      }

      // If the query selections have changed, but the visualization type is
      // undefined, then we need to set a visualization to display.
      if (
        updatedTab.visualizationType() === undefined &&
        updatedTab.queryResultSpec() !== undefined
      ) {
        // NOTE(nina): If a user has "locked" on a visualization at this point,
        // we should not switch to the default visualization, because that
        // is not the visualization that they intended to display.
        const newVisualization =
          vizPickerLockedVisualization || DEFAULT_VISUALIZATION_TYPE;
        const newState = {
          ...state,
          tabList: tabList.set(
            currentTabIdx,
            updatedTab.visualizationType(newVisualization),
          ),
        };
        return appReducer(newState, {
          type: 'VISUALIZATION_TYPE_CHANGE',
          visualizationType: newVisualization,
        });
      }

      return {
        ...state,
        tabList: tabList.set(currentTabIdx, updatedTab),
      };
    }
    case 'QUERY_RESULT_SPEC_CHANGE':
      return {
        ...state,
        tabList: tabList.set(
          currentTabIdx,
          currentTab.queryResultSpec(action.newSpec),
        ),
      };
    case 'VISUALIZATION_TYPE_CHANGE': {
      const currentQueryResultSpec = currentTab.queryResultSpec();
      invariant(
        currentQueryResultSpec,
        'VISUALIZATION_TYPE_CHANGE requires a current tab with an initialized query result spec',
      );

      const { visualizationType } = action;
      const [newSpec, viewType] = selectVisualization(
        currentQueryResultSpec,
        visualizationType,
      );

      // update the viz type if it changed
      const newTabList =
        visualizationType !== currentTab.visualizationType()
          ? tabList.set(
              currentTabIdx,
              currentTab.visualizationType(visualizationType),
            )
          : tabList;

      let newState = {
        ...state,
        tabList: newTabList,
      };

      // update the view type if it changed
      if (viewType !== currentTab.viewType()) {
        // We need to preserve the tab changes if the viz type has
        // also been changed. It's not the cleanest way, but unfortunately
        // that comes with making multiple state changes in the same case.
        newState = {
          ...state,
          tabList: newTabList.apply(currentTabIdx, tab =>
            tab.viewType(viewType),
          ),
        };
      }

      // now update the queryResultSpec
      return {
        ...appReducer(newState, {
          newSpec,
          type: 'QUERY_RESULT_SPEC_CHANGE',
        }),
        showVizPickerExploreView: false,
        // NOTE(nina): We want to clear out the "locked" viz selection, since
        // changing the visualization type implies that our "intended"
        // visualization has changed. This is primarily a UI change, so it
        // shouldn't happen here, and should be resolved as part of a larger
        // refactor of the viz picker logic
        vizPickerLockedVisualization: undefined,
      };
    }
    case 'VIZ_PICKER_EXPLORE_VIEW_TOGGLE':
      return {
        ...state,
        showVizPickerExploreView: action.show,
      };
    case 'VIZ_PICKER_VISUALIZATION_LOCK': {
      return {
        ...state,
        vizPickerLockedVisualization: action.visualizationType,
      };
    }
    case 'NEW_TAB_ADD': {
      const newTabList = tabList.push(action.newTab);
      const newState = { ...state, tabList: newTabList };
      return appReducer(newState, {
        type: 'CURRENT_TAB_CHANGE',
        newTabIdx: newTabList.size() - 1,
      });
    }
    case 'TAB_LIST_CHANGE': {
      const newState = { ...state, tabList: action.tabList };
      let newTabIdx;
      if (!action.newTabIdx) {
        newTabIdx =
          currentTabIdx >= action.tabList.size()
            ? action.tabList.size() - 1
            : currentTabIdx;
      } else {
        // Because we defined newTabIdx and we want to destructure, we have to
        // put this in an expression context to distinguish it from a block
        // statement.
        // source: https://stackoverflow.com/a/48714713/3145912
        ({ newTabIdx } = action);
      }
      return appReducer(newState, {
        type: 'CURRENT_TAB_CHANGE',
        newTabIdx,
      });
    }
    case 'TAB_LIST_LOAD': {
      const newState = {
        ...state,
        tabList: action.tabList,
        status: AQTStatuses.AQT_READY,
      };
      return appReducer(newState, {
        type: 'CURRENT_TAB_CHANGE',
        newTabIdx: action.currentTabIdx,
      });
    }
    case 'CURRENT_TAB_CHANGE': {
      const { newTabIdx } = action;
      const newCurrentTab = tabList.get(newTabIdx);
      // Every time we update which tab we are 'currently' on, we need to
      // perform some resets. We have to make sure the explore view isn't
      // hidden/showing for a selected visualization that is enabled/disabled.
      // We also don't want to persist the 'locked' visualization from any
      // other tabs, so we reset it to undefined. This also means that if a
      // user has locked on a visualization, switched to a different tab, and
      // switched back, that change has not persisted. The more we update
      // this context, the more tricky it might be to maintain this. We might
      // need to do a small refactor of this context to clean up any unstable
      // logic.
      return {
        ...state,
        currentTabIdx: newTabIdx,
        showVizPickerExploreView:
          newCurrentTab.visualizationType() === undefined,
        vizPickerLockedVisualization: undefined,
      };
    }
    case 'VISUALIZATION_AND_SPEC_CHANGE': {
      const { visualizationType, newSpec } = action;
      if (currentTab.isVisualizationTypeEnabled(visualizationType)) {
        const newState = appReducer(state, {
          type: 'VISUALIZATION_TYPE_CHANGE',
          visualizationType,
        });
        return appReducer(newState, {
          type: 'QUERY_RESULT_SPEC_CHANGE',
          newSpec,
        });
      }
      return state;
    }
    default:
      throw new Error(
        `[AQTDispatch] Invalid action type '${action.type}' received.`,
      );
  }
}

export default (React.createContext(noop): React.Context<$Dispatch<AQTAction>>);
