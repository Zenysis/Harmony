// @flow
import invariant from 'invariant';

import * as Zen from 'lib/Zen';
import { DARK_THEME } from 'components/ui/visualizations/BumpChart/models/BumpChartTheme';
import { SORT_DESCENDING } from 'components/QueryResult/graphUtil';
import type GroupBySettings from 'models/core/QueryResultSpec/GroupBySettings';
import type SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';
import type { IViewSpecificSettings } from 'models/visualizations/common/interfaces';
import type { Serializable } from 'lib/Zen';

type RequiredValues = {
  selectedField: string,
};

type DefaultValues = {
  resultLimit: number,
  selectedKeys: { [string]: number, ... }, // TODO(pablo, stephen): Should be ZenMap eventually.
  sortOrder: string,
  theme: string,
  useEthiopianDates: boolean,
};

type SerializedBumpChartSettings = {
  resultLimit: number,
  selectedKeys: { [string]: number, ... }, // TODO(pablo, stephen): Should be ZenMap eventually.
  selectedField: string,
  sortOrder: string,
  theme: string,
  useEthiopianDates: boolean,
};

const ALLOW_ET_DATES = window.__JSON_FROM_BACKEND.timeseriesUseEtDates;
const DEFAULT_RESULT_LIMIT = 25;

class BumpChartSettings
  extends Zen.BaseModel<BumpChartSettings, RequiredValues, DefaultValues>
  implements
    Serializable<SerializedBumpChartSettings>,
    IViewSpecificSettings<BumpChartSettings> {
  static defaultValues: DefaultValues = {
    resultLimit: DEFAULT_RESULT_LIMIT,
    sortOrder: SORT_DESCENDING,
    theme: DARK_THEME.id(),
    useEthiopianDates: ALLOW_ET_DATES,

    // TODO(stephen): This control is set directly based on user interaction
    // with the chart. We need a default control value to be set, and it
    // feels weird doing that here since the control is managed elsewhere.
    // TODO(stephen, pablo): Support ZenMaps in dashboard serialization of
    // visualization controls since this is supposed to be a ZenMap.
    selectedKeys: {},
  };

  static deserialize(
    values: SerializedBumpChartSettings,
  ): Zen.Model<BumpChartSettings> {
    return BumpChartSettings.create(values);
  }

  static fromFieldIds(
    fields: $ReadOnlyArray<string>,
  ): Zen.Model<BumpChartSettings> {
    invariant(fields.length > 0, 'BumpChartSettings requires at least 1 field');
    return BumpChartSettings.create({ selectedField: fields[0] });
  }

  serialize(): SerializedBumpChartSettings {
    return {
      resultLimit: this._.resultLimit(),
      selectedKeys: this._.selectedKeys(),
      selectedField: this._.selectedField(),
      sortOrder: this._.sortOrder(),
      theme: this._.theme(),
      useEthiopianDates: this._.useEthiopianDates(),
    };
  }

  updateFromNewGroupBySettings(
    // eslint-disable-next-line no-unused-vars
    newGroupBySettings: GroupBySettings,
  ): Zen.Model<BumpChartSettings> {
    return this._;
  }

  updateFromNewSeriesSettings(
    newSeriesSettings: SeriesSettings,
  ): Zen.Model<BumpChartSettings> {
    const seriesOrder = newSeriesSettings.seriesOrder();
    const defaultFieldId = seriesOrder[0];
    if (!seriesOrder.includes(this._.selectedField())) {
      return this._.selectedField(defaultFieldId);
    }
    return this._;
  }

  getTitleField(): string {
    return this._.selectedField();
  }

  changeToVisualizationType(): Zen.Model<BumpChartSettings> {
    return this._;
  }
}

export default ((BumpChartSettings: $Cast): Class<
  Zen.Model<BumpChartSettings>,
>);
