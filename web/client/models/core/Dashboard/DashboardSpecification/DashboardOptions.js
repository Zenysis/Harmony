// @flow
import * as Zen from 'lib/Zen';
import FilterPanelSettings from 'models/core/Dashboard/DashboardSpecification/FilterPanelSettings';
import type { Serializable } from 'lib/Zen';
import type { SerializedFilterSettings } from 'models/core/Dashboard/DashboardSpecification/FilterPanelSettings';

/**
 * The default column count value if not specified.
 */
const DEFAULT_COLUMN_COUNT = 4;

export type SerializedDashboardOptions = {
  columnCount: number,
  title: string,
  filterPanelSettings: SerializedFilterSettings,
};

type RequiredValues = {
  title: string,
};

type DefaultValues = {
  columnCount: number,
  filterPanelSettings: FilterPanelSettings,
};

/**
 * The DashboardOptions model contains options that affect both stylistic and
 * functional preferences for the entire Dashboard.
 */
class DashboardOptions
  extends Zen.BaseModel<DashboardOptions, RequiredValues, DefaultValues>
  implements Serializable<SerializedDashboardOptions> {
  static defaultValues = {
    columnCount: DEFAULT_COLUMN_COUNT,
    filterPanelSettings: FilterPanelSettings.create({}),
  };

  serialize(): SerializedDashboardOptions {
    const { columnCount, title, filterPanelSettings } = this.modelValues();
    return {
      columnCount,
      title,
      filterPanelSettings: filterPanelSettings.serialize(),
    };
  }

  static deserialize(
    options: SerializedDashboardOptions,
  ): Zen.Model<DashboardOptions> {
    const { columnCount, title, filterPanelSettings } = options;
    return DashboardOptions.create({
      columnCount,
      title,
      filterPanelSettings: FilterPanelSettings.deserialize(filterPanelSettings),
    });
  }
}

export default ((DashboardOptions: any): Class<Zen.Model<DashboardOptions>>);
