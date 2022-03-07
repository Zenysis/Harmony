// @flow
import * as Zen from 'lib/Zen';
import { LEGEND_PLACEMENT } from 'components/visualizations/common/SettingsModal/LegendSettingsTab/constants';
import { RESULT_VIEW_TYPES } from 'components/QueryResult/viewTypes';
import type { LegendPlacement } from 'components/visualizations/common/SettingsModal/LegendSettingsTab/constants';
import type { ResultViewType } from 'components/QueryResult/viewTypes';

type DefaultValues = {
  legendFontSize: string,
  legendFontColor: string,
  legendFontFamily: string,
  legendPlacement: LegendPlacement,
  showLegend: boolean,
  overlapLegendWithChart: boolean,
};

type SerializedLegendSettings = {|
  legendFontSize?: string,
  legendFontColor?: string,
  legendFontFamily?: string,
  legendPlacement?: LegendPlacement,
  showLegend?: boolean,
  overlapLegendWithChart?: boolean,
|};

class LegendSettings extends Zen.BaseModel<LegendSettings, {}, DefaultValues> {
  static defaultValues: DefaultValues = {
    legendFontSize: '16px',
    legendFontColor: 'black',
    legendFontFamily: 'Lato',
    legendPlacement: LEGEND_PLACEMENT.BOTTOM,
    showLegend: true,
    overlapLegendWithChart: false,
  };

  static fromViewType(
    viewType: ResultViewType,
  ): Zen.Model<LegendSettings> | void {
    let legendFontSize = '';
    let showLegend = true;
    switch (viewType) {
      case RESULT_VIEW_TYPES.MAP:
        legendFontSize = '13px';
        break;
      case RESULT_VIEW_TYPES.TABLE:
        legendFontSize = '13px';
        showLegend = false;
        break;
      default:
        return undefined;
    }
    return LegendSettings.create({ legendFontSize, showLegend });
  }

  static deserialize(
    values: SerializedLegendSettings,
  ): Zen.Model<LegendSettings> {
    return LegendSettings.create(values);
  }

  serialize(): SerializedLegendSettings {
    return { ...this.modelValues() };
  }
}

export default ((LegendSettings: $Cast): Class<Zen.Model<LegendSettings>>);
