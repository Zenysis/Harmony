// @flow
import * as Zen from 'lib/Zen';
import DashboardDateRange from 'models/core/Dashboard/DashboardSpecification/DashboardDateRange';
import DashboardEditableText from 'models/core/Dashboard/DashboardSpecification/DashboardEditableText';
import DashboardFilter from 'models/core/Dashboard/DashboardSpecification/DashboardFilter';
import DashboardItem from 'models/core/Dashboard/DashboardSpecification/DashboardItem';
import DashboardItemSettings from 'models/core/Dashboard/DashboardSpecification/DashboardItemSettings';
import DashboardLayoutMetadata from 'models/core/Dashboard/DashboardSpecification/DashboardLayoutMetadata';
import DashboardQuery from 'models/core/Dashboard/DashboardSpecification/DashboardQuery';
import QuerySelections from 'models/core/wip/QuerySelections';
import RelationalDashboardQuery from 'models/core/Dashboard/DashboardSpecification/RelationalDashboardQuery';
import SimpleQuerySelections from 'models/core/SimpleQuerySelections';
import ZenArray from 'util/ZenModel/ZenArray';
import ZenMap from 'util/ZenModel/ZenMap';
import {
  buildQueryResultSpec,
  updateVisualizationCustomField,
  updateVisualizationFilters,
  updateAdvancedVisualizationQuery,
  updateSimpleVisualizationQuery,
  updateVisualizationSettings,
} from 'components/GridDashboardApp/util';
import { pick, uuid } from 'util/util';
import type Dashboard from 'models/core/Dashboard';
import type DashboardOptions from 'models/core/Dashboard/DashboardSpecification/DashboardOptions';
import type DashboardSpecification from 'models/core/Dashboard/DashboardSpecification';
import type GridDashboard from 'components/GridDashboardApp/index';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type { ResultViewType } from 'components/QueryResult/viewTypes';

const MUTABLE_SELECTION_FIELDS = [
  'startDate',
  'endDate',
  'dateType',
  'granularity',
  'filters',
];

export type ReactGridItem = {
  i: string,
  x: number,
  y: number,
  w: number,
  h: number,
  static: boolean,
};

type State = $PropertyType<GridDashboard, 'state'>;

export function generateStateFromModel(
  dashboardModel: Dashboard,
): $Shape<State> {
  const queries: ZenMap<DashboardQuery> = dashboardModel
    .specification()
    .queries();
  const queryResultSpecs = {};
  const querySelectionsMap = {};

  queries.values().forEach((query: DashboardQuery) => {
    const queryResultSpec: QueryResultSpec = buildQueryResultSpec(query);
    queryResultSpecs[query.id()] = queryResultSpec;

    const querySelectionsModel = query.isAdvancedQueryItem()
      ? QuerySelections.create({
          fields: query.advancedFields(),
          groups: query.advancedGroups(),
          filter: query.advancedFilters(),
        })
      : SimpleQuerySelections.fromLegacyObject(query.legacySelection());
    querySelectionsMap[query.id()] = querySelectionsModel;
  });

  return {
    loaded: true,
    dashboardModel,
    queryResultSpecs: ZenMap.create(queryResultSpecs),
    querySelections: ZenMap.create(querySelectionsMap),
  };
}

export function updateStateFromSpecification(
  specification: DashboardSpecification,
): (state: State) => $Shape<State> {
  return (prevState: State) => {
    const updatedModel = prevState.dashboardModel.specification(specification);
    const newState = generateStateFromModel(updatedModel);
    newState.unsavedChanges = true;
    return newState;
  };
}

export function updateDashboardOptions(
  newOptions: DashboardOptions,
): (state: State) => $Shape<State> {
  return (prevState: State) => {
    const { dashboardModel } = prevState;
    const updatedModel = dashboardModel
      .deepUpdate()
      .specification()
      .dashboardOptions(newOptions);
    return {
      dashboardModel: updatedModel,
      unsavedChanges: true,
    };
  };
}

export function setComponentLockStatus(
  componentId: string,
  isLocked: boolean,
): (state: State) => $Shape<State> {
  return prevState => {
    const { dashboardModel } = prevState;

    let dashboardComponent = dashboardModel
      .specification()
      .queries()
      .get(componentId, undefined);

    if (!dashboardComponent) {
      // The component id is not a query.
      dashboardComponent = dashboardModel
        .specification()
        .textItems()
        .forceGet(componentId);
    }

    const newItem: DashboardItem = dashboardModel
      .specification()
      .items()
      .forceGet(dashboardComponent.itemId())
      .deepUpdate()
      .layoutMetadata()
      .isLocked(isLocked);

    const updatedModel = dashboardModel
      .deepUpdate()
      .specification()
      .items()
      .set(newItem.id(), newItem);

    return {
      dashboardModel: updatedModel,
      unsavedChanges: true,
    };
  };
}

export function deleteQueryComponent(
  queryId: string,
): (state: State) => $Shape<State> {
  return (prevState: State) => {
    const { dashboardModel } = prevState;
    const itemId = dashboardModel
      .specification()
      .queries()
      .forceGet(queryId)
      .itemId();

    const newDashboardModel = dashboardModel
      .deepUpdate()
      .specification()
      .items()
      .delete(itemId);

    return {
      queryResultSpecs: prevState.queryResultSpecs.delete(queryId),
      querySelections: prevState.querySelections.delete(queryId),
      dashboardModel: newDashboardModel
        .deepUpdate()
        .specification()
        .relationalQueries()
        .delete(queryId),
      unsavedChanges: true,
    };
  };
}

export function deleteTextItemComponent(
  textItemId: string,
): (state: State) => $Shape<State> {
  return (prevState: State) => {
    const { dashboardModel } = prevState;
    const dashboardItemId = dashboardModel
      .specification()
      .textItems()
      .forceGet(textItemId)
      .itemId();

    const newDashboardModel = dashboardModel
      .deepUpdate()
      .specification()
      .items()
      .delete(dashboardItemId);

    return {
      dashboardModel: newDashboardModel
        .deepUpdate()
        .specification()
        .textItems()
        .delete(textItemId),
      unsavedChanges: true,
    };
  };
}

export function updateDashboardLayout(
  newLayout: $ReadOnlyArray<ReactGridItem>,
): (state: State) => $Shape<State> {
  return (prevState: State) => {
    const { dashboardModel } = prevState;
    let newSpec: DashboardSpecification = dashboardModel.specification();
    const queriesNeedingTriggering = new Set();
    newLayout.forEach((itemGridMetadata: ReactGridItem) => {
      const item: DashboardItem = newSpec.items().forceGet(itemGridMetadata.i);
      let itemLayoutMetadata = item.layoutMetadata();

      if (
        itemGridMetadata.x !== itemLayoutMetadata.upperX() ||
        itemGridMetadata.y !== itemLayoutMetadata.upperY() ||
        itemGridMetadata.w !== itemLayoutMetadata.columns() ||
        itemGridMetadata.h !== itemLayoutMetadata.rows()
      ) {
        if (
          itemGridMetadata.w !== itemLayoutMetadata.columns() ||
          itemGridMetadata.h !== itemLayoutMetadata.rows()
        ) {
          queriesNeedingTriggering.add(item.id());
        }
        itemLayoutMetadata = itemLayoutMetadata
          .upperX(itemGridMetadata.x)
          .upperY(itemGridMetadata.y)
          .rows(itemGridMetadata.h)
          .columns(itemGridMetadata.w);

        newSpec = newSpec
          .deepUpdate()
          .items()
          .set(item.id(), item.layoutMetadata(itemLayoutMetadata));
      }
    });

    // NOTE(stephen): Intentionally not building the new QueryResultSpecs
    // inside the loop above since newSpec is modified on each pass.
    // NOTE(moriah): only changes to item dimensions (rows & columns)
    // require updating the queryResultSpecs.
    const queryResultSpecs = {};
    dashboardModel
      .specification()
      .queries()
      .forEach((query: DashboardQuery) => {
        if (queriesNeedingTriggering.has(query.itemId())) {
          queryResultSpecs[query.id()] = buildQueryResultSpec(query);
        } else {
          queryResultSpecs[query.id()] = prevState.queryResultSpecs.forceGet(
            query.id(),
          );
        }
      });

    return {
      dashboardModel: dashboardModel.specification(newSpec),
      unsavedChanges: true,
      queryResultSpecs: ZenMap.create(queryResultSpecs),
    };
  };
}

export function updateDashboardFilters(newFilterSelections: {
  [key: string]: any,
}): (state: State) => $Shape<State> {
  return (prevState: State) => {
    const { dashboardModel, querySelections } = prevState;
    const spec: DashboardSpecification = dashboardModel.specification();
    const queries: ZenMap<DashboardQuery> = spec.queries();
    const validSelections = pick(newFilterSelections, MUTABLE_SELECTION_FIELDS);
    let newSpecification = spec;

    const querySelectionsObj = querySelections.toObject();

    queries.forEach((query: DashboardQuery) => {
      // TODO(pablo): we are not enabling filters yet for Advanced Query Items.
      // So we'll skip processing them here.
      if (!query.isAdvancedQueryItem()) {
        const legacySelections = query.legacySelection();

        const newSelections = Object.assign(
          {},
          legacySelections,
          validSelections,
        );
        newSpecification = updateSimpleVisualizationQuery(
          query,
          SimpleQuerySelections.fromLegacyObject(newSelections),
          newSpecification,
        );

        const itemId = query.id();
        querySelectionsObj[itemId] = SimpleQuerySelections.fromLegacyObject(
          newSelections,
        );
      }
    });

    // NOTE(stephen): Intentionally not building the new QueryResultSpecs inside
    // the loop above since newSpecification is modified on each pass.
    const queryResultSpecs = {};
    queries.forEach((query: DashboardQuery) => {
      queryResultSpecs[query.id()] = buildQueryResultSpec(query);
    });

    return {
      unsavedChanges: true,
      dashboardModel: dashboardModel.specification(newSpecification),
      queryResultSpecs: ZenMap.create(queryResultSpecs),
      querySelections: ZenMap.create(querySelectionsObj),
    };
  };
}
export function updateTextItem(
  textItem: DashboardEditableText,
): (prevState: State) => $Shape<State> {
  return (prevState: State) => {
    const { dashboardModel } = prevState;
    const newSpecification = dashboardModel
      .specification()
      .deepUpdate()
      .textItems()
      .set(textItem.id(), textItem);
    return {
      unsavedChanges: true,
      dashboardModel: dashboardModel.specification(newSpecification),
    };
  };
}

export function updateVisualization(
  queryId: string,
  selectionsModel: SimpleQuerySelections | QuerySelections,
  settings: DashboardItemSettings,
  viewType?: ResultViewType,
): (prevState: State) => $Shape<State> {
  return (prevState: State) => {
    const { dashboardModel } = prevState;

    let newSpecification = updateVisualizationSettings(
      dashboardModel.specification(),
      queryId,
      settings,
    );
    const query: DashboardQuery = newSpecification.queries().forceGet(queryId);

    if (selectionsModel instanceof SimpleQuerySelections) {
      newSpecification = updateSimpleVisualizationQuery(
        query,
        Zen.cast<SimpleQuerySelections>(selectionsModel),
        newSpecification,
        viewType,
      );
    } else if (selectionsModel instanceof QuerySelections) {
      newSpecification = updateAdvancedVisualizationQuery(
        query,
        Zen.cast<QuerySelections>(selectionsModel),
        newSpecification,
        viewType,
      );
    } else {
      throw new Error(
        '[GridDashboard:stateChanges] Invalid selectionsModel instance passed',
      );
    }

    // Build a new QueryResultSpec for this changed item.
    const queryResultSpecs = prevState.queryResultSpecs.set(
      queryId,
      buildQueryResultSpec(query),
    );

    const querySelectionsMap = prevState.querySelections.set(
      queryId,
      selectionsModel,
    );

    return {
      queryResultSpecs,
      unsavedChanges: true,
      dashboardModel: dashboardModel.specification(newSpecification),
      querySelections: querySelectionsMap,
    };
  };
}

export function updateQueryResultSpecification(
  queryId: string,
  viewType: ResultViewType,
  updatedQueryResultSpec: QueryResultSpec,
): (state: State) => $Shape<State> {
  // TODO(pablo): once DashboardSpecification is changed to ZenModel and
  // composed entirely of QueryResultSpecs, we can remove these dependencies
  // on updateVisualizationFilters, updateVisualizationCustomField, and
  // updateVisualizationSettings

  return (prevState: State) => {
    const { queryResultSpecs } = prevState;
    let { dashboardModel } = prevState;

    const queryResultSpec: QueryResultSpec = queryResultSpecs.forceGet(queryId);

    if (
      queryResultSpec.filters() !== updatedQueryResultSpec.filters() ||
      queryResultSpec.modalFilters() !== updatedQueryResultSpec.modalFilters()
    ) {
      const specification: DashboardSpecification = updateVisualizationFilters(
        dashboardModel.specification(),
        queryId,
        updatedQueryResultSpec.filters(),
        updatedQueryResultSpec.modalFilters(),
      );
      dashboardModel = dashboardModel.specification(specification);
    }

    if (
      queryResultSpec.customFields() !== updatedQueryResultSpec.customFields()
    ) {
      const specification = updateVisualizationCustomField(
        dashboardModel.specification(),
        queryId,
        updatedQueryResultSpec.customFields(),
      );
      dashboardModel = dashboardModel.specification(specification);
    }

    if (
      queryResultSpec.titleSettings() !==
        updatedQueryResultSpec.titleSettings() ||
      queryResultSpec.visualizationSettings() !==
        updatedQueryResultSpec.visualizationSettings()
    ) {
      const specification: DashboardSpecification = updateVisualizationSettings(
        dashboardModel.specification(),
        queryId,
        updatedQueryResultSpec.getSettingsForDashboard(),
      );
      dashboardModel = dashboardModel.specification(specification);
    }

    const newQueryResultSpecs = queryResultSpecs.set(
      queryId,
      updatedQueryResultSpec,
    );
    return {
      unsavedChanges: true,
      dashboardModel,
      queryResultSpecs: newQueryResultSpecs,
    };
  };
}

function _collides(
  itemLayoutMetadata: DashboardLayoutMetadata,
  bounds: { maxX: number, maxY: number, minX: number, minY: number },
): boolean {
  // Check if a layout item's metadata will fit within the bounds specified.
  return (
    bounds.minX <= itemLayoutMetadata.upperX() &&
    itemLayoutMetadata.upperX() < bounds.maxX &&
    bounds.minY <= itemLayoutMetadata.upperY() &&
    itemLayoutMetadata.upperY() < bounds.maxY
  );
}

function _getNewPositionedItem(
  items: ZenMap<DashboardItem>,
  itemLayoutMetadata: DashboardLayoutMetadata,
  columnCount: number,
): DashboardLayoutMetadata {
  let maxRow = 0;
  let rightCollides = false;
  let bottomCollides = false;
  const { upperX, upperY, rows, columns } = itemLayoutMetadata.modelValues();
  const right = {
    minX: upperX + columns,
    minY: upperY,
    maxX: upperX + 2 * columns,
    maxY: upperY + rows,
  };
  const bottom = {
    minX: upperX,
    minY: upperY + rows,
    maxX: upperX + columns,
    maxY: upperY + 2 * rows,
  };
  items.values().forEach(existingItem => {
    const existingMetadata = existingItem.layoutMetadata();
    if (_collides(existingMetadata, right)) {
      rightCollides = true;
    }
    if (_collides(existingMetadata, bottom)) {
      bottomCollides = true;
    }

    if (upperY > maxRow) {
      maxRow = upperY;
    }
  });
  if (!rightCollides && right.maxX <= columnCount) {
    return itemLayoutMetadata.upperX(upperX + columns);
  }
  if (!bottomCollides) {
    return itemLayoutMetadata.upperY(upperY + rows);
  }
  return itemLayoutMetadata.upperY(maxRow + 1).upperX(0);
}

function _getNewItemAtBottom(
  items: ZenMap<DashboardItem>,
): DashboardLayoutMetadata {
  let maxUpperY = 0;
  items.forEach(item => {
    const { upperY, rows } = item.layoutMetadata().modelValues();
    if (upperY + rows > maxUpperY) {
      maxUpperY = upperY + rows;
    }
  });
  return DashboardLayoutMetadata.create({
    upperX: 0,
    upperY: maxUpperY,
    rows: 2,
    columns: 3,
  });
}

export function addTextElement(): (prevState: State) => $Shape<State> {
  return (prevState: State) => {
    const newId = uuid();
    const { dashboardModel } = prevState;
    let newSpecification = dashboardModel.specification();

    const items = newSpecification.items();
    const newItemLayoutMetadata = _getNewItemAtBottom(items);

    const layoutItemId = `layout_${newId}`;
    const newItem: DashboardItem = DashboardItem.create({
      id: layoutItemId,
      layoutMetadata: newItemLayoutMetadata,
    });

    const newTextItem = DashboardEditableText.deserialize({
      id: `text_item_${newId}`,
      itemId: layoutItemId,
      text: '',
    });

    newSpecification = newSpecification
      .deepUpdate()
      .textItems()
      .set(newTextItem.id(), newTextItem);

    newSpecification = newSpecification
      .deepUpdate()
      .items()
      .set(newItem.id(), newItem);
    return {
      unsavedChanges: true,
      dashboardModel: dashboardModel.specification(newSpecification),
    };
  };
}

export function cloneVisualization(
  queryId: string,
): (prevState: State) => $Shape<State> {
  return (prevState: State) => {
    const newId = uuid();
    const { dashboardModel } = prevState;

    let newSpecification = dashboardModel.specification();
    const items = newSpecification.items();
    const oldQuery: DashboardQuery = newSpecification
      .queries()
      .forceGet(queryId);
    const oldItem: DashboardItem = items.forceGet(oldQuery.itemId());
    const columnCount = newSpecification.dashboardOptions().columnCount();

    const newItemLayoutMetadata = _getNewPositionedItem(
      items,
      oldItem.layoutMetadata(),
      columnCount,
    ).isLocked(false);
    const newItem: DashboardItem = oldItem
      .id(`layout_${newId}`)
      .layoutMetadata(newItemLayoutMetadata);

    const oldRelationalQuery: RelationalDashboardQuery = newSpecification
      .relationalQueries()
      .forceGet(queryId);
    const oldDateRange: DashboardDateRange = oldQuery.dateRange();
    const oldFilters: ZenArray<DashboardFilter> = oldQuery.filters();
    const oldSettings: DashboardItemSettings = oldQuery.setting();

    // Duplicate Dashboard Filters and add to the specificaiton.
    let filterCount = 0;
    const newFilters: ZenArray<DashboardFilter> = oldFilters.map(
      (filter: DashboardFilter) => {
        const { filterOn, filterValues, name } = filter.modelValues();

        const newFilter: DashboardFilter = DashboardFilter.create({
          id: `filter_${newId}_${filterCount}`,
          filterOn,
          filterValues,
          name,
        });

        filterCount++;
        newSpecification = newSpecification
          .deepUpdate()
          .filters()
          .set(newFilter.id(), newFilter);
        return newFilter;
      },
    );

    const newDateRangeValues = {
      ...oldDateRange.modelValues(),
      id: `dateRange_${newId}`,
    };
    const newDateRange: DashboardDateRange = DashboardDateRange.create(
      newDateRangeValues,
    );
    newSpecification = newSpecification
      .deepUpdate()
      .dateRanges()
      .set(newDateRange.id(), newDateRange);

    const newSettingsValues = {
      ...oldSettings.modelValues(),
      id: `settings_${newId}`,
    };

    const newSettings: DashboardItemSettings = DashboardItemSettings.create(
      newSettingsValues,
    );
    newSpecification = newSpecification
      .deepUpdate()
      .settings()
      .set(newSettings.id(), newSettings);

    const newQueryValues = {
      ...oldRelationalQuery.modelValues(),
      id: `query_${newId}`,
      dateRange: newDateRange.id(),
      settingId: newSettings.id(),
      filters: newFilters.map((filter: DashboardFilter) => filter.id()),
      itemId: newItem.id(),
    };
    const newQuery: RelationalDashboardQuery = RelationalDashboardQuery.create(
      newQueryValues,
    );
    newSpecification = newSpecification
      .deepUpdate()
      .relationalQueries()
      .set(newQuery.id(), newQuery);

    newSpecification = newSpecification
      .deepUpdate()
      .items()
      .set(newItem.id(), newItem);

    const { querySelections, queryResultSpecs } = prevState;
    const newQueryResultSpecs = queryResultSpecs.set(
      newQuery.id(),
      queryResultSpecs.forceGet(queryId),
    );

    const newQuerySelections = querySelections.set(
      newQuery.id(),
      querySelections.forceGet(queryId),
    );

    return {
      unsavedChanges: true,
      queryResultSpecs: newQueryResultSpecs,
      querySelections: newQuerySelections,
      dashboardModel: dashboardModel.specification(newSpecification),
    };
  };
}
