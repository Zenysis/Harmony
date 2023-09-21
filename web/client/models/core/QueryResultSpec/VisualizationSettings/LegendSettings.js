// @flow
import * as Zen from 'lib/Zen';
import { LEGEND_PLACEMENT } from 'components/visualizations/common/SettingsModal/LegendSettingsTab/constants';
import { RESULT_VIEW_TYPES } from 'components/QueryResult/viewTypes';
import type { LegendPlacement } from 'components/visualizations/common/SettingsModal/LegendSettingsTab/constants';
import type { ResultViewType } from 'components/QueryResult/viewTypes';

type DefaultValues = {
  consolidateRules: boolean,
  legendFontColor: string,
  legendFontFamily: string,
  legendFontSize: string,
  legendPlacement: LegendPlacement,
  overlapLegendWithChart: boolean,
  showLegend: boolean,
};

type SerializedLegendSettings = {|
  consolidateRules?: boolean,
  legendFontColor?: string,
  legendFontFamily?: string,
  legendFontSize?: string,
  legendPlacement?: LegendPlacement,
  overlapLegendWithChart?: boolean,
  showLegend?: boolean,
|};

class LegendSettings extends Zen.BaseModel<LegendSettings, {}, DefaultValues> {
  static defaultValues: DefaultValues = {
    consolidateRules: true,
    legendFontColor: 'black',
    legendFontFamily: 'Lato',
    legendFontSize: '16px',
    legendPlacement: LEGEND_PLACEMENT.BOTTOM,
    overlapLegendWithChart: false,
    showLegend: true,
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
