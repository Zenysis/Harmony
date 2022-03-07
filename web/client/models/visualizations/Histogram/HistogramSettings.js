// @flow
import invariant from 'invariant';

import * as Zen from 'lib/Zen';
import { DEFAULT_PALETTE } from 'models/visualizations/PieChart/PieChartSettings';
import type GroupBySettings from 'models/core/QueryResultSpec/GroupBySettings';
import type SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';
import type { GoalLineData } from 'components/ui/visualizations/common/MetricAxis/types';
import type { IViewSpecificSettings } from 'models/visualizations/common/interfaces';
import type { Serializable } from 'lib/Zen';

type RequiredValues = {
  selectedField: string,
};

type DefaultValues = {
  alwaysShowFocusWindow: boolean,
  barTreatment: 'overlaid' | 'stacked',
  breakdown: 'dimension' | 'field',
  displayBorders: boolean,
  goalLines: Zen.Array<GoalLineData>,
  hideZeroValueLabels: boolean,
  palette: $ReadOnlyArray<string>,
  resultLimit: number,
  rotateDataValueLabels: boolean,
  rotateXAxisLabels: boolean,
  xTickFormat: string,
};

type SerializedHistogramSettings = {
  alwaysShowFocusWindow: boolean,
  barTreatment: 'overlaid' | 'stacked',
  breakdown: 'dimension' | 'field',
  displayBorders: boolean,
  goalLines: $ReadOnlyArray<GoalLineData>,
  hideZeroValueLabels: boolean,
  palette: $ReadOnlyArray<string>,
  resultLimit: number,
  rotateDataValueLabels: boolean,
  rotateXAxisLabels: boolean,
  selectedField: string,
  xTickFormat: string,

  // NOTE(pablo): it is possible for the serialized type to have extra values
  // (e.g. if the user's tab was stored in their browser before a version update
  // removed any of these keys), so we need to use an inexact type here.

  ...
};

// TODO(sophie): move this functionality to GROUP settings tab
// HACK(sophie): constant used as placeholder, taken from old bargraph
export const DEFAULT_TIME_FORMAT = 'Default';

class HistogramSettings
  extends Zen.BaseModel<HistogramSettings, RequiredValues, DefaultValues>
  implements
    Serializable<SerializedHistogramSettings>,
    IViewSpecificSettings<HistogramSettings> {
  static defaultValues: DefaultValues = {
    alwaysShowFocusWindow: false,
    barTreatment: 'stacked',
    breakdown: 'field',
    displayBorders: true,
    goalLines: Zen.Array.create(),
    hideZeroValueLabels: false,
    palette: DEFAULT_PALETTE,
    resultLimit: 50,
    rotateDataValueLabels: true,
    rotateXAxisLabels: true,
    xTickFormat: DEFAULT_TIME_FORMAT,
  };

  static deserialize(
    values: SerializedHistogramSettings,
  ): Zen.Model<HistogramSettings> {
    const {
      alwaysShowFocusWindow,
      barTreatment,
      breakdown,
      displayBorders,
      goalLines,
      hideZeroValueLabels,
      palette,
      resultLimit,
      rotateDataValueLabels,
      rotateXAxisLabels,
      selectedField,
      xTickFormat,
    } = values;
    return HistogramSettings.create({
      goalLines: Zen.Array.create(goalLines),
      alwaysShowFocusWindow,
      barTreatment,
      breakdown,
      displayBorders,
      hideZeroValueLabels,
      palette,
      resultLimit,
      rotateDataValueLabels,
      rotateXAxisLabels,
      selectedField,
      xTickFormat,
    });
  }

  static fromFieldIds(
    fields: $ReadOnlyArray<string>,
  ): Zen.Model<HistogramSettings> {
    invariant(fields.length > 0, 'HistogramSettings requires at least 1 field');
    return HistogramSettings.create({ selectedField: fields[0] });
  }

  serialize(): SerializedHistogramSettings {
    return {
      alwaysShowFocusWindow: this._.alwaysShowFocusWindow(),
      barTreatment: this._.barTreatment(),
      breakdown: this._.breakdown(),
      displayBorders: this._.displayBorders(),
      goalLines: this._.goalLines().toArray(),
      hideZeroValueLabels: this._.hideZeroValueLabels(),
      palette: this._.palette(),
      resultLimit: this._.resultLimit(),
      rotateDataValueLabels: this._.rotateDataValueLabels(),
      rotateXAxisLabels: this._.rotateXAxisLabels(),
      selectedField: this._.selectedField(),
      xTickFormat: this._.xTickFormat(),
    };
  }

  updateFromNewGroupBySettings(
    // eslint-disable-next-line no-unused-vars
    newGroupBySettings: GroupBySettings,
  ): Zen.Model<HistogramSettings> {
    return this._;
  }

  updateFromNewSeriesSettings(
    newSeriesSettings: SeriesSettings,
  ): Zen.Model<HistogramSettings> {
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

  changeToVisualizationType(): Zen.Model<HistogramSettings> {
    return this._;
  }
}

export default ((HistogramSettings: $Cast): Class<
  Zen.Model<HistogramSettings>,
>);
