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

type SerializedLegendSettings = {
  legendFontSize?: string,
  legendFontColor?: string,
  legendFontFamily?: string,
  legendPlacement?: LegendPlacement,
  showLegend?: boolean,
  overlapLegendWithChart?: boolean,
};

class LegendSettings extends Zen.BaseModel<LegendSettings, {}, DefaultValues> {
  static defaultValues = {
    legendFontSize: '16px',
    legendFontColor: 'black',
    legendFontFamily: 'Arial',
    legendPlacement: LEGEND_PLACEMENT.BOTTOM,
    showLegend: true,
    overlapLegendWithChart: false,
  };

  static fromViewType(
    viewType: ResultViewType,
  ): Zen.Model<LegendSettings> | void {
    let legendFontSize = '';
    switch (viewType) {
      case RESULT_VIEW_TYPES.CHART:
        legendFontSize = '16px';
        break;
      case RESULT_VIEW_TYPES.MAP:
      case RESULT_VIEW_TYPES.ANIMATED_MAP:
      case RESULT_VIEW_TYPES.GEOMAP:
      case RESULT_VIEW_TYPES.TIME:
        legendFontSize = '14px';
        break;
      default:
        return undefined;
    }
    return LegendSettings.create({ legendFontSize });
  }

  static deserialize(
    values: SerializedLegendSettings,
  ): Zen.Model<LegendSettings> {
    return LegendSettings.create({ ...values });
  }

  serialize(): SerializedLegendSettings {
    return { ...this.modelValues() };
  }
}

export default ((LegendSettings: any): Class<Zen.Model<LegendSettings>>);
