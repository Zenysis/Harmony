// @flow
import * as Zen from 'lib/Zen';
import {
  SELECT_GRANULARITY_BUTTON_ORDER,
  FILTER_OPTIONS,
  FILTER_ORDER,
} from 'backend_config';
import type { Serializable } from 'lib/Zen';

// TODO(moriah): put these in the config/ui.
export const ET_PUBLIC_FILTER_OPTIONS = {
  FILTERS: 'filters',
  DATES: 'dates',
};

export const DATE_PICKER_TYPE_OPTIONS: { [string]: string } = {
  CUSTOM: 'CUSTOM',
  CHOOSE_YEARS: 'choose_years',
  ET_CHOOSE_YEARS: 'et_choose_years',
};

export type SerializedFilterSettings = {
  aggregationLevels: Array<string>,
  autoUpdateGranularity: boolean,
  datePickerType: string,
  filterPanelComponents: Array<string>,
  enabledFilters: Array<string>,
  initialSelectedComponents: Array<string>,
  showDashboardFilterButton: boolean,
};

type Values = {
  /**
   * The date picker type selected for the filter panel.
   * E.g. "Custom", "Choose months", etc.
   */
  datePickerType: string,

  /**
   * The components in the filter panel that should be visible as
   options in the filter panel dropdown.
   */
  filterPanelComponents: Zen.Array<string>,

  /**
   * The components in the filter panel that should be selected in the
   filter panel drop down and open on dashboard.
   */
  initialSelectedComponents: Zen.Array<string>,

  /**
   * The options users will be able to select to display from in the
   * filter panel.
   */
  aggregationLevels: Zen.Array<string>,

  /**
   * The Query Filters that users will be able to select in the filter
   * panel. E.g. "geography".
   */
  enabledFilters: Zen.Array<string>,

  /**
   * The Query Filters that users will be able to select in the filter
   * panel. E.g. "geography".
   */
  showDashboardFilterButton: boolean,

  /**
   * Whether or not the granularity should automatically update to one
   * level below the selected filter.
   */
  autoUpdateGranularity: boolean,
};

/**
 * FilterPanelConfigSpec is a representation of the config for admins in
 * the filter panel. It is used to allow the to define what should or should
 * not be visible.
 */
class FilterPanelSettings extends Zen.BaseModel<FilterPanelSettings, {}, Values>
  implements Serializable<SerializedFilterSettings> {
  static defaultValues = {
    datePickerType:
      DATE_PICKER_TYPE_OPTIONS[
        window.__JSON_FROM_BACKEND.ui.defaultDatePickerType
      ],
    // $FlowFixMe: flow cant figure out that this is not a Array<mixed>
    filterPanelComponents: Zen.Array.create(
      Object.values(FILTER_OPTIONS || {}),
    ),
    initialSelectedComponents: Zen.Array.create([]),
    aggregationLevels: Zen.Array.create(SELECT_GRANULARITY_BUTTON_ORDER),
    enabledFilters: Zen.Array.create(FILTER_ORDER),
    showDashboardFilterButton: false,
    autoUpdateGranularity: false,
  };

  static deserialize(
    filterPanelSettings: SerializedFilterSettings,
  ): Zen.Model<FilterPanelSettings> {
    const {
      datePickerType,
      filterPanelComponents,
      initialSelectedComponents,
      aggregationLevels,
      enabledFilters,
      showDashboardFilterButton,
      autoUpdateGranularity,
    } = filterPanelSettings;
    return FilterPanelSettings.create({
      aggregationLevels: Zen.Array.create(aggregationLevels),
      autoUpdateGranularity,
      datePickerType,
      enabledFilters: Zen.Array.create(enabledFilters),
      filterPanelComponents: Zen.Array.create(filterPanelComponents),
      initialSelectedComponents: Zen.Array.create(initialSelectedComponents),
      showDashboardFilterButton,
    });
  }

  serialize(): SerializedFilterSettings {
    const {
      aggregationLevels,
      autoUpdateGranularity,
      datePickerType,
      enabledFilters,
      filterPanelComponents,
      initialSelectedComponents,
      showDashboardFilterButton,
    } = this.modelValues();
    return {
      aggregationLevels: aggregationLevels.toArray(),
      autoUpdateGranularity,
      datePickerType,
      enabledFilters: enabledFilters.toArray(),
      filterPanelComponents: filterPanelComponents.toArray(),
      initialSelectedComponents: initialSelectedComponents.toArray(),
      showDashboardFilterButton,
    };
  }
}

export default ((FilterPanelSettings: any): Class<
  Zen.Model<FilterPanelSettings>,
>);
