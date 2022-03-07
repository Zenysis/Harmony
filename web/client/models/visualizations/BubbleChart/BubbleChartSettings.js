// @flow
import * as Zen from 'lib/Zen';
import type GroupBySettings from 'models/core/QueryResultSpec/GroupBySettings';
import type SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';
import type { IViewSpecificSettings } from 'models/visualizations/common/interfaces';
import type { Serializable } from 'lib/Zen';

type DefaultValues = {
  linearFit: boolean,
  resultLimit: number,
  showLegend: boolean,
  xAxis: string,
  yAxis: string,
  zAxis: string,
};

type SerializedBubbleChartSettings = {|
  linearFit: boolean,
  resultLimit: number,
  showLegend: boolean,
  xAxis: string,
  yAxis: string,
  zAxis: string,
|};

const DEFAULT_RESULT_LIMIT = 100;

class BubbleChartSettings
  extends Zen.BaseModel<BubbleChartSettings, {}, DefaultValues>
  implements
    Serializable<SerializedBubbleChartSettings>,
    IViewSpecificSettings<BubbleChartSettings> {
  static defaultValues: DefaultValues = {
    linearFit: false,
    resultLimit: DEFAULT_RESULT_LIMIT,
    showLegend: false,
    xAxis: '',
    yAxis: '',
    zAxis: 'none',
  };

  static deserialize(
    values: SerializedBubbleChartSettings,
  ): Zen.Model<BubbleChartSettings> {
    return BubbleChartSettings.create(values);
  }

  static fromFieldIds(
    fields: $ReadOnlyArray<string>,
  ): Zen.Model<BubbleChartSettings> {
    return BubbleChartSettings.create({
      xAxis: fields[0],
      yAxis: fields[1],
      zAxis: fields[2],
    });
  }

  serialize(): SerializedBubbleChartSettings {
    return {
      linearFit: this._.linearFit(),
      resultLimit: this._.resultLimit(),
      showLegend: this._.showLegend(),
      xAxis: this._.xAxis(),
      yAxis: this._.yAxis(),
      zAxis: this._.zAxis(),
    };
  }

  updateFromNewGroupBySettings(
    // eslint-disable-next-line no-unused-vars
    newGroupBySettings: GroupBySettings,
  ): Zen.Model<BubbleChartSettings> {
    return this._;
  }

  updateFromNewSeriesSettings(
    newSeriesSettings: SeriesSettings,
  ): Zen.Model<BubbleChartSettings> {
    const seriesOrder = newSeriesSettings.seriesOrder();
    const defaultFieldId = seriesOrder[0];

    const { xAxis, yAxis, zAxis } = this.modelValues();

    let newSettings = this._;
    if (!seriesOrder.includes(xAxis)) {
      newSettings = newSettings.xAxis(defaultFieldId);
    }

    if (!seriesOrder.includes(yAxis)) {
      // Try to set it to the second field, if one exists. Otherwise
      // fallback to the first field. This makes the default behavior
      // slightly better.
      newSettings = newSettings.yAxis(seriesOrder[1] || defaultFieldId);
    }

    // zAxis is optional. Only update if it is already set.
    if (zAxis && !seriesOrder.includes(zAxis)) {
      newSettings = newSettings.zAxis(defaultFieldId);
    }
    return newSettings;
  }

  getTitleField(): string {
    return this._.xAxis();
  }

  changeToVisualizationType(): Zen.Model<BubbleChartSettings> {
    return this._;
  }
}

export default ((BubbleChartSettings: $Cast): Class<
  Zen.Model<BubbleChartSettings>,
>);
