// @flow
import * as React from 'react';
import invariant from 'invariant';

import * as Zen from 'lib/Zen';
import CustomizableTimeInterval from 'models/core/wip/QueryFilterItem/CustomizableTimeInterval';
import DashboardQueryItemMenu from 'components/GridDashboardApp/DashboardQueryItem/DashboardQueryItemMenu';
import DimensionValueFilterItem from 'models/core/wip/QueryFilterItem/DimensionValueFilterItem';
import InfoTooltip from 'components/ui/InfoTooltip';
import QueryResult from 'components/QueryResult';
import QueryResultSpec from 'models/core/QueryResultSpec';
import QuerySelections from 'models/core/wip/QuerySelections';
import SimpleQuerySelections from 'models/core/SimpleQuerySelections';
import { autobind, memoizeOne } from 'decorators';
import type { ButtonControlsProps } from 'components/visualizations/common/commonTypes';
import type { QueryFilterItem } from 'models/core/wip/QueryFilterItem/types';
import type { ResultViewType } from 'components/QueryResult/viewTypes';

export const DASHBOARD_ITEM_MODES = {
  EDIT: 'edit',
  VIEW: 'view',
};

type Props<Selections: QuerySelections | SimpleQuerySelections> = {
  dashboardFilterItems: Zen.Array<QueryFilterItem>,
  // a unique identifier for this DashboardItem component
  id: string,
  initialLockedState: boolean,
  onClone: (id: string) => void,
  onLockToggled: (id: string, isLocked: boolean) => void,
  onDeleteClicked: (id: string) => void,
  onOpenEditQueryPanel: (id: string) => void,
  onQueryResultSpecChange: (
    id: string,
    viewType: ResultViewType,
    updatedQueryResultSpec: QueryResultSpec,
  ) => void,
  queryResultSpec: QueryResultSpec,
  viewType: ResultViewType,

  canEdit: boolean,
  collapsedLayout: boolean,
  mode: string,
  querySelections: Selections,
};

type State = {
  isLocked: boolean,
  showOptions: boolean,
};

const TEXT = t('dashboard.DashboardItem');

// Object that groups QueryFilterItems by their type. DimensionValueFilterItems
// are stored with a mapping from Dimension ID -> filter item array.
type FilterItemGroup = {
  dimensions: { [string]: $ReadOnlyArray<DimensionValueFilterItem> },
  time: $ReadOnlyArray<CustomizableTimeInterval>,
};

function groupFilters(
  filterItems: Zen.Array<QueryFilterItem>,
): FilterItemGroup {
  const output = {
    dimensions: {},
    time: [],
  };
  filterItems.forEach(item => {
    if (item instanceof CustomizableTimeInterval) {
      output.time.push(item);
      return;
    }
    invariant(
      item instanceof DimensionValueFilterItem,
      'Expected DimensionValueFilterItem.',
    );

    const dimensionID = item.dimension().id();
    if (output.dimensions[dimensionID] === undefined) {
      output.dimensions[dimensionID] = [];
    }
    output.dimensions[dimensionID].push(item);
  });
  return output;
}

export default class DashboardQueryItem<
  Selections: QuerySelections | SimpleQuerySelections,
> extends React.PureComponent<Props<Selections>, State> {
  state: State = {
    isLocked: this.props.initialLockedState,
    showOptions: false,
  };

  getDashboardItemDOMId(): string {
    return `dashboardItem__${this.props.id}`;
  }

  @autobind
  toggleOptions() {
    this.setState(prevState => ({ showOptions: !prevState.showOptions }));
  }

  isEditing(): boolean {
    return this.props.mode === DASHBOARD_ITEM_MODES.EDIT;
  }

  getQueryResultMode(): $Values<typeof QueryResult.Modes> {
    const { mode, querySelections } = this.props;
    if (mode === QueryResult.Modes.PRESENT_VIEW) {
      return QueryResult.Modes.PRESENT_VIEW;
    }

    if (querySelections instanceof SimpleQuerySelections) {
      return QueryResult.Modes.GRID_DASHBOARD_VIEW;
    }

    return QueryResult.Modes.GRID_DASHBOARD_AQT_VIEW;
  }

  /**
   * Apply the currently selected dashboard filters on top of the original
   * query selections to produce the full QuerySelections that should be used
   * when querying.
   */
  @memoizeOne
  buildFilteredQuerySelections(
    querySelections: Selections,
    dashboardFilterItems: Zen.Array<QueryFilterItem>,
  ): Selections {
    // If there are no filters to apply, return the original selections.
    if (dashboardFilterItems.isEmpty()) {
      return querySelections;
    }

    // NOTE(stephen): Right now, simple query selections do not supported the
    // new filtering style.
    if (querySelections instanceof SimpleQuerySelections) {
      return querySelections;
    }

    invariant(
      querySelections instanceof QuerySelections,
      'Must have AQT QuerySelections type here.',
    );
    const dashboardFilters = groupFilters(dashboardFilterItems);
    const queryFilters = groupFilters(querySelections.filter());

    // Prefer the user's dashboard time filter over the time filters
    // set on the original query.
    const timeFilters =
      dashboardFilters.time.length > 0
        ? dashboardFilters.time
        : queryFilters.time;

    // Merge logic:
    // 1) If a filter on a specific dimension is set only on the original query
    //    OR only on the user's dashboard filters, add that dimension's filters
    //    directly.
    // 2) If a filter on a specific dimension is set on both the original query
    //    and on the user's dashboard filters, use the dashboard filter's
    //    version and drop the original query's filter for that dimension.
    const mergedDimensionFilters = {
      ...queryFilters.dimensions,
      // Merge dashboard filters in last since they have precedence over the
      // original query's filters.
      ...dashboardFilters.dimensions,
    };

    // NOTE(stephen): Right now, filter order does not matter because they are
    // all ANDed together when the query is run.
    const fullFilter = [...timeFilters];
    Object.keys(mergedDimensionFilters).forEach(dimensionID => {
      fullFilter.push(...mergedDimensionFilters[dimensionID]);
    });

    return querySelections.filter(Zen.Array.create(fullFilter));
  }

  getFullQuerySelections(): Selections {
    const { dashboardFilterItems, querySelections } = this.props;

    // If the query is currently being edited, return the original query
    // selections since the user is modifying the original query.
    if (this.isEditing()) {
      return querySelections;
    }

    return this.buildFilteredQuerySelections(
      querySelections,
      dashboardFilterItems,
    );
  }

  @autobind
  onQueryResultSpecChange(updatedQueryResultSpecification: QueryResultSpec) {
    const { id, viewType } = this.props;
    this.props.onQueryResultSpecChange(
      id,
      viewType,
      updatedQueryResultSpecification,
    );
  }

  @autobind
  onCloneClicked() {
    this.props.onClone(this.props.id);
  }

  @autobind
  onToggleLock() {
    this.setState(
      prevState => ({ isLocked: !prevState.isLocked }),
      () => this.props.onLockToggled(this.props.id, this.state.isLocked),
    );
  }

  @autobind
  onDeleteClicked() {
    analytics.track('Remove Query from Dashboard');
    this.setState(() => this.props.onDeleteClicked(this.props.id));
  }

  @autobind
  onOpenEditQueryPanel() {
    const queryToolSource =
      this.props.querySelections instanceof QuerySelections ? 'AQT' : 'SQT';
    analytics.track('Edit Dashboard Query', {
      queryToolSource,
    });
    this.props.onOpenEditQueryPanel(this.props.id);
  }

  maybeRenderAQTDisclaimer() {
    if (this.props.querySelections instanceof QuerySelections) {
      // $CycloneIdaiHack
      // TODO(pablo): make the icon take an Intent prop that can be
      // used to color it gray or red or other colors.
      return (
        <div className="aqt-disclaimer">
          <InfoTooltip
            iconStyle={{ color: '#DB3737' }}
            text={TEXT.aqtBetaDisclaimer}
          />
        </div>
      );
    }
    return null;
  }

  @autobind
  renderDashboardQueryMenu(buttonControlsProps: ButtonControlsProps) {
    const { mode } = this.props;
    const { queryResultSpec } = buttonControlsProps;
    if (
      queryResultSpec === undefined ||
      mode === QueryResult.Modes.PRESENT_VIEW
    ) {
      return null;
    }

    return (
      <DashboardQueryItemMenu
        itemDOMId={this.getDashboardItemDOMId()}
        isLocked={this.state.isLocked}
        onDeleteClicked={this.onDeleteClicked}
        onCloneClicked={this.onCloneClicked}
        onOpenEditQueryPanel={this.onOpenEditQueryPanel}
        onToggleLock={this.onToggleLock}
        {...buttonControlsProps}
      />
    );
  }

  renderQueryResult() {
    const { canEdit, collapsedLayout, queryResultSpec, viewType } = this.props;
    return (
      <div className="query-results-container query-result-grid result-container">
        <QueryResult
          collapsedLayout={collapsedLayout}
          isEditor={canEdit}
          mode={this.getQueryResultMode()}
          onQueryResultSpecChange={this.onQueryResultSpecChange}
          queryResultSpec={queryResultSpec}
          querySelections={this.getFullQuerySelections()}
          smallMode
          viewType={viewType}
          renderButtonControlsComponent={this.renderDashboardQueryMenu}
        />
      </div>
    );
  }

  render() {
    const className = this.isEditing()
      ? 'edit-selected dashboard-item'
      : 'dashboard-item';
    return (
      <div className="dashboard-item-container">
        <div id={this.getDashboardItemDOMId()} className={className}>
          {this.renderQueryResult()}
          {this.maybeRenderAQTDisclaimer()}
        </div>
      </div>
    );
  }
}
