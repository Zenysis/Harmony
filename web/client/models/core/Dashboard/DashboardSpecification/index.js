// @flow
import PropTypes from 'prop-types';

import DashboardDateRange from 'models/core/Dashboard/DashboardSpecification/DashboardDateRange';
import DashboardEditableText from 'models/core/Dashboard/DashboardSpecification/DashboardEditableText';
import DashboardFilter from 'models/core/Dashboard/DashboardSpecification/DashboardFilter';
import DashboardItem from 'models/core/Dashboard/DashboardSpecification/DashboardItem';
import DashboardItemSettings from 'models/core/Dashboard/DashboardSpecification/DashboardItemSettings';
import DashboardOptions from 'models/core/Dashboard/DashboardSpecification/DashboardOptions';
import DashboardQuery from 'models/core/Dashboard/DashboardSpecification/DashboardQuery';
import RelationalDashboardQuery from 'models/core/Dashboard/DashboardSpecification/RelationalDashboardQuery';
import ZenError from 'util/ZenError';
import ZenMap from 'util/ZenModel/ZenMap';
import ZenModel, {
  def,
  derived,
  hasChanged,
  statefulCompute,
} from 'util/ZenModel';
import override from 'decorators/override';
import { getEnabledDimensions } from 'components/QueryApp/QueryForm/queryUtil';
import { recomputeQueries } from 'models/core/Dashboard/DashboardSpecification/derivedValue';
import type { SerializedDashboardDateRange } from 'models/core/Dashboard/DashboardSpecification/DashboardDateRange';
import type { SerializedDashboardEditableText } from 'models/core/Dashboard/DashboardSpecification/DashboardEditableText';
import type { SerializedDashboardFilter } from 'models/core/Dashboard/DashboardSpecification/DashboardFilter';
import type { SerializedDashboardItem } from 'models/core/Dashboard/DashboardSpecification/DashboardItem';
import type { SerializedDashboardItemSettings } from 'models/core/Dashboard/DashboardSpecification/DashboardItemSettings';
import type { SerializedDashboardOptions } from 'models/core/Dashboard/DashboardSpecification/DashboardOptions';
import type { SerializedDashboardQuery } from 'models/core/Dashboard/DashboardSpecification/RelationalDashboardQuery';

const EXPECTED_VERSION = '2019-09-18';

const DEFAULT_DASHBOARD_TITLE = 'New Dashboard';

const QUERIES_DEPENDENT_VALUES = ['dateRanges', 'filters', 'relationalQueries'];

export type SerializedDashboardSpecification = {
  dateRanges: { [string]: SerializedDashboardDateRange },
  filters: { [string]: SerializedDashboardFilter },
  items: { [string]: SerializedDashboardItem },
  options: SerializedDashboardOptions,
  queries: { [string]: SerializedDashboardQuery },
  textItems: { [string]: SerializedDashboardEditableText },
  settings: { [string]: SerializedDashboardItemSettings },
  version: string,
};

/**
 * The DashboardSpecification is the JSON-Object representation of a dashboard.
 * It contains the metadata including visualizations, placements, queries,
 * date ranges and other information required to completely render a dashboard.
 */
export default class DashboardSpecification extends ZenModel.withTypes({
  /**
   * The model containing options/preferences that have a dashboard-wide effect.
   */
  dashboardOptions: def(
    DashboardOptions.type(),
    DashboardOptions.create({ title: DEFAULT_DASHBOARD_TITLE }),
  ),

  /**
   * The mapping of `DashboardDateRange` instances to their corresponding `id`
   * property.
   */
  dateRanges: def(ZenMap.of(DashboardDateRange).isRequired, ZenMap.create()),

  /**
   * The mapping of `DashboardFilter` instances to their corresponding `id`
   * property.
   */
  filters: def(ZenMap.of(DashboardFilter).isRequired, ZenMap.create()),

  /**
   * The mapping of `DashboardItem` instances to their corresponding
   * `id` property.
   */
  items: def(ZenMap.of(DashboardItem).isRequired, ZenMap.create()),

  /**
   * The mapping of `DashboardEditableText` instances to their corresponding
   * `id` property.
   */
  textItems: def(ZenMap.of(DashboardEditableText), ZenMap.create()),

  /**
   * The mapping of `RelationalDashboardQuery` instances to their corresponding
   * `id` property.
   */
  relationalQueries: def(
    ZenMap.of(RelationalDashboardQuery).isRequired,
    ZenMap.create(),
  ),

  /**
   * The mapping of `DashboardItemSettings` instances to their corresponding
   * `id` property.
   */
  settings: def(ZenMap.of(DashboardItemSettings).isRequired, ZenMap.create()),

  /**
   * @readonly
   * The schema version of the Dashboard Specification.
   */
  version: def(PropTypes.string.isRequired, undefined, ZenModel.PRIVATE),
}).withDerivedValues({
  /**
   * The mapping of 'rich' `DashboardQuery` instances to their corresponding
   * `id` property. Recomputed whenever a change to one of the dependencies of
   * a dashboard query has been detected.
   */
  queries: derived(
    ZenMap.of(DashboardQuery).isRequired,
    hasChanged(...QUERIES_DEPENDENT_VALUES),
    statefulCompute(recomputeQueries),
  ),
}) {
  @override
  static deserializeAsync(
    values: SerializedDashboardSpecification,
  ): Promise<DashboardSpecification> {
    const {
      options,
      dateRanges,
      items,
      filters,
      queries,
      textItems,
      settings,
      version,
    } = values;

    if (version !== EXPECTED_VERSION) {
      throw new ZenError(
        `Unexpected Dashboard Specification version of '${version}'.
         Expected version '${EXPECTED_VERSION}'.
         Please force refresh the page.`,
      );
    }

    let settingsModelMap: ZenMap<DashboardItemSettings> = ZenMap.create();
    Object.keys(settings).forEach((settingId: string) => {
      const backendSettings: SerializedDashboardItemSettings =
        settings[settingId];
      const settingModel = DashboardItemSettings.deserialize(backendSettings);
      settingsModelMap = settingsModelMap.set(settingModel.id(), settingModel);
    });

    let dateRangeModelMap: ZenMap<DashboardDateRange> = ZenMap.create();
    Object.keys(dateRanges).forEach((dateRangeId: string) => {
      const backendDateRange: SerializedDashboardDateRange =
        dateRanges[dateRangeId];
      const dateRangeModel: DashboardDateRange = DashboardDateRange.deserialize(
        backendDateRange,
      );
      dateRangeModelMap = dateRangeModelMap.set(
        dateRangeModel.id(),
        dateRangeModel,
      );
    });

    let filterModelMap: ZenMap<DashboardFilter> = ZenMap.create();
    Object.keys(filters).forEach((filterId: string) => {
      const backendFilter: SerializedDashboardFilter = filters[filterId];
      const filterModel: DashboardFilter = DashboardFilter.deserialize(
        backendFilter,
      );
      filterModelMap = filterModelMap.set(filterModel.id(), filterModel);
    });

    let itemModelMap: ZenMap<DashboardItem> = ZenMap.create();
    Object.keys(items).forEach((itemId: string) => {
      const itemModel: DashboardItem = DashboardItem.deserialize(items[itemId]);
      itemModelMap = itemModelMap.set(itemModel.id(), itemModel);
    });

    let textItemModelMap: ZenMap<DashboardEditableText> = ZenMap.create();
    Object.keys(textItems).forEach((textItemId: string) => {
      const textItemModel: DashboardEditableText = DashboardEditableText.deserialize(
        textItems[textItemId],
      );
      textItemModelMap = textItemModelMap.set(
        textItemModel.id(),
        textItemModel,
      );
    });

    const dashboardQueryPromises = Object.keys(queries).map(queryId => {
      const backendQuery = queries[queryId];
      const seriesSettings = settingsModelMap
        .forceGet(backendQuery.settingId)
        .viewTypeSettings()
        .forceGet(backendQuery.type)
        .seriesSettings();
      return DashboardQuery.deserializeAsync(backendQuery, {
        seriesSettings,
      });
    });

    return Promise.all(dashboardQueryPromises).then(
      (queryModels: Array<RelationalDashboardQuery>) => {
        const queryModelMap = ZenMap.fromArray(queryModels, 'id');
        return DashboardSpecification.create({
          dashboardOptions: DashboardOptions.deserialize(options),
          dateRanges: dateRangeModelMap,
          filters: filterModelMap,
          items: itemModelMap,
          textItems: textItemModelMap,
          relationalQueries: queryModelMap,
          settings: settingsModelMap,
          version,
        });
      },
    );
  }

  hasAQTQueries(): boolean {
    return this.relationalQueries().some(dashboardQuery =>
      dashboardQuery.isAdvancedQueryItem(),
    );
  }

  @override
  serialize(): SerializedDashboardSpecification {
    return {
      options: this.dashboardOptions().serialize(),
      dateRanges: this.dateRanges().serialize(),
      filters: this.filters().serialize(),
      items: this.items().serialize(),
      textItems: this.textItems().serialize(),
      queries: this.relationalQueries().serialize(),
      settings: this.settings().serialize(),
      version: EXPECTED_VERSION,
    };
  }

  getValidDimensions(): Array<string> {
    const fields = [];
    this.items().forEach(item =>
      item
        .query()
        .advancedFields()
        .forEach(field => fields.push(field.id())),
    );
    return getEnabledDimensions(fields);
  }
}
