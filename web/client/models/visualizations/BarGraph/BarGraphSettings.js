// @flow
import invariant from 'invariant';

import * as Zen from 'lib/Zen';
import { DEFAULT_SORT_ORDER } from 'components/QueryResult/graphUtil';
import type GroupBySettings from 'models/core/QueryResultSpec/GroupBySettings';
import type SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';
import type { GoalLineData } from 'components/ui/visualizations/common/MetricAxis/types';
import type { IViewSpecificSettings } from 'models/visualizations/common/interfaces';
import type { Serializable } from 'lib/Zen';
import type { SortOrder } from 'components/QueryResult/graphUtil';
import type { VisualizationType } from 'models/AdvancedQueryApp/VisualizationType/types';

type RequiredValues = {
  sortOn: string,
};

type DefaultValues = {
  alwaysShowFocusWindow: boolean,
  applyMinimumBarHeight: boolean,
  barDirection: 'horizontal' | 'vertical',
  barTreatment: 'overlapping' | 'sequential' | 'stacked',
  goalLines: Zen.Array<GoalLineData>,
  resultLimit: number,
  rotateInnerGroupLabels: boolean,
  sortOrder: SortOrder,
  valueTextAngle: 'auto' | 'vertical',
};

type SerializedBarGraphSettings = {
  alwaysShowFocusWindow: boolean,
  applyMinimumBarHeight: boolean,
  barDirection: 'horizontal' | 'vertical',
  barTreatment: 'overlapping' | 'sequential' | 'stacked',
  goalLines: $ReadOnlyArray<GoalLineData>,
  resultLimit: number,
  rotateInnerGroupLabels: boolean,
  sortOrder: SortOrder,
  sortOn: string,
  valueTextAngle: 'auto' | 'vertical',

  // NOTE(pablo): it is possible for the serialized type to have extra values
  // (e.g. if the user's tab was stored in their browser before a version update
  // removed any of these keys), so we need to use an inexact type here.

  ...
};

class BarGraphSettings
  extends Zen.BaseModel<BarGraphSettings, RequiredValues, DefaultValues>
  implements
    Serializable<SerializedBarGraphSettings>,
    IViewSpecificSettings<BarGraphSettings> {
  static defaultValues: DefaultValues = {
    alwaysShowFocusWindow: false,
    applyMinimumBarHeight: true,
    barDirection: 'vertical',
    barTreatment: 'sequential',
    resultLimit: 50,
    rotateInnerGroupLabels: true,
    sortOrder: DEFAULT_SORT_ORDER,
    valueTextAngle: 'auto',
    goalLines: Zen.Array.create(),
  };

  static deserialize(
    values: SerializedBarGraphSettings,
  ): Zen.Model<BarGraphSettings> {
    const {
      alwaysShowFocusWindow,
      applyMinimumBarHeight,
      barDirection,
      barTreatment,
      goalLines,
      resultLimit,
      rotateInnerGroupLabels,
      sortOrder,
      sortOn,
      valueTextAngle,
    } = values;

    return BarGraphSettings.create({
      alwaysShowFocusWindow,
      applyMinimumBarHeight,
      barDirection,
      barTreatment,
      resultLimit,
      rotateInnerGroupLabels,
      sortOrder,
      sortOn,
      valueTextAngle,
      goalLines: Zen.Array.create(goalLines),
    });
  }

  static fromFieldIds(
    fields: $ReadOnlyArray<string>,
  ): Zen.Model<BarGraphSettings> {
    invariant(fields.length > 0, 'BarGraphSettings requires at least 1 field');
    return BarGraphSettings.create({ sortOn: fields[0] });
  }

  serialize(): SerializedBarGraphSettings {
    return {
      alwaysShowFocusWindow: this._.alwaysShowFocusWindow(),
      applyMinimumBarHeight: this._.applyMinimumBarHeight(),
      barDirection: this._.barDirection(),
      barTreatment: this._.barTreatment(),
      goalLines: this._.goalLines().toArray(),
      resultLimit: this._.resultLimit(),
      rotateInnerGroupLabels: this._.rotateInnerGroupLabels(),
      sortOn: this._.sortOn(),
      sortOrder: this._.sortOrder(),
      valueTextAngle: this._.valueTextAngle(),
    };
  }

  updateFromNewGroupBySettings(
    // eslint-disable-next-line no-unused-vars
    newGroupBySettings: GroupBySettings,
  ): Zen.Model<BarGraphSettings> {
    return this._;
  }

  updateFromNewSeriesSettings(
    newSeriesSettings: SeriesSettings,
  ): Zen.Model<BarGraphSettings> {
    const seriesOrder = newSeriesSettings.seriesOrder();
    const defaultFieldId = seriesOrder[0];
    if (!seriesOrder.includes(this._.sortOn())) {
      return this._.sortOn(defaultFieldId);
    }
    return this._;
  }

  getTitleField(): void {
    return undefined;
  }

  changeToVisualizationType(
    vizType: VisualizationType,
  ): Zen.Model<BarGraphSettings> {
    switch (vizType) {
      // Vertical bar chart types.
      case 'BAR':
        return this.modelValues({
          barDirection: 'vertical',
          barTreatment: 'sequential',
        });
      case 'BAR_LINE':
        // changing to BAR_LINE also needs to set one indicator on the y2 axis,
        // but this has to be changed on the series settings, so it is handled
        // via the `selectVisualization` function in
        // models/AdvancedQueryApp/VisualizationType/selectVisualization.js
        return this.modelValues({
          barDirection: 'vertical',
          barTreatment: 'sequential',
        });
      case 'BAR_OVERLAPPING':
        return this.modelValues({
          barDirection: 'vertical',
          barTreatment: 'overlapping',
        });
      case 'BAR_STACKED':
        return this.modelValues({
          barDirection: 'vertical',
          barTreatment: 'stacked',
        });

      // Horizontal bar chart types.
      case 'BAR_HORIZONTAL':
        return this.modelValues({
          barDirection: 'horizontal',
          barTreatment: 'sequential',
        });
      case 'BAR_HORIZONTAL_LINE':
        return this.modelValues({
          barDirection: 'horizontal',
          barTreatment: 'sequential',
        });
      case 'BAR_HORIZONTAL_OVERLAPPING':
        return this.modelValues({
          barDirection: 'horizontal',
          barTreatment: 'overlapping',
        });
      case 'BAR_HORIZONTAL_STACKED':
        return this.modelValues({
          barDirection: 'horizontal',
          barTreatment: 'stacked',
        });
      default:
        throw new Error(
          '[BarGraphSettings] Invalid BarGraph visualization type',
        );
    }
  }
}

export default ((BarGraphSettings: $Cast): Class<Zen.Model<BarGraphSettings>>);
