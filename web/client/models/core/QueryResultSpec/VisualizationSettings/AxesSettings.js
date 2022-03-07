// @flow
import * as Zen from 'lib/Zen';
import XAxisSettings from 'models/core/QueryResultSpec/VisualizationSettings/XAxisSettings';
import YAxisSettings from 'models/core/QueryResultSpec/VisualizationSettings/YAxisSettings';
import { RESULT_VIEW_TYPES } from 'components/QueryResult/viewTypes';
import type { ResultViewType } from 'components/QueryResult/viewTypes';
import type { Serializable } from 'lib/Zen';

type Values = {
  xAxis: XAxisSettings,
  y1Axis: YAxisSettings,
  y2Axis: YAxisSettings,
};

type SerializedAxesSettings = {
  xAxis?: Zen.Serialized<XAxisSettings>,
  y1Axis?: Zen.Serialized<YAxisSettings>,
  y2Axis?: Zen.Serialized<YAxisSettings>,
};

// NOTE(stephen): I dislike the default settings that get applied to all
// visualizations (they look bad) and want to override it for the new bar graph.
const DEFAULT_AXIS_SETTINGS_BAR_GRAPH = {
  labelsFontColor: '#313234',
  labelsFontFamily: 'Lato, Arial',
  labelsFontSize: '13px',
  titleFontColor: '#313234',
  titleFontFamily: 'Lato, Arial',
  titleFontSize: '13px',
};

class AxesSettings extends Zen.BaseModel<AxesSettings, Values>
  implements Serializable<SerializedAxesSettings> {
  static fromViewType(
    viewType: ResultViewType,
  ): Zen.Model<AxesSettings> | void {
    switch (viewType) {
      case RESULT_VIEW_TYPES.BAR_GRAPH:
      case RESULT_VIEW_TYPES.BOX_PLOT:
      case RESULT_VIEW_TYPES.EPICURVE:
        return AxesSettings.create({
          xAxis: XAxisSettings.create(DEFAULT_AXIS_SETTINGS_BAR_GRAPH),
          y1Axis: YAxisSettings.create(DEFAULT_AXIS_SETTINGS_BAR_GRAPH),
          y2Axis: YAxisSettings.create(DEFAULT_AXIS_SETTINGS_BAR_GRAPH),
        });
      case RESULT_VIEW_TYPES.TIME:
      case RESULT_VIEW_TYPES.HEATTILES:
      case RESULT_VIEW_TYPES.BUBBLE_CHART:
        return AxesSettings.create({
          xAxis: XAxisSettings.create({}),
          y1Axis: YAxisSettings.create({}),
          y2Axis: YAxisSettings.create({}),
        });
      default:
        return undefined;
    }
  }

  static deserialize(values: SerializedAxesSettings): Zen.Model<AxesSettings> {
    const { xAxis, y1Axis, y2Axis } = values;
    return AxesSettings.create({
      xAxis: XAxisSettings.deserialize(xAxis || {}),
      y1Axis: YAxisSettings.deserialize(y1Axis || {}),
      y2Axis: YAxisSettings.deserialize(y2Axis || {}),
    });
  }

  serialize(): SerializedAxesSettings {
    const { xAxis, y1Axis, y2Axis } = this.modelValues();
    return {
      xAxis: xAxis.serialize(),
      y1Axis: y1Axis.serialize(),
      y2Axis: y2Axis.serialize(),
    };
  }
}

export default ((AxesSettings: $Cast): Class<Zen.Model<AxesSettings>>);
