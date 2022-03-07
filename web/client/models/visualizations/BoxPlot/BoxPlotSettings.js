// @flow
import invariant from 'invariant';

import * as Zen from 'lib/Zen';
import BoxPlotTheme from 'components/ui/visualizations/BoxPlot/models/BoxPlotTheme';
import type GroupBySettings from 'models/core/QueryResultSpec/GroupBySettings';
import type QueryResultGrouping from 'models/core/QueryResultSpec/QueryResultGrouping';
import type SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';
import type { IViewSpecificSettings } from 'models/visualizations/common/interfaces';
import type { Serializable } from 'lib/Zen';

type RequiredValues = {
  selectedDimension: string | void,
  selectedField: string,
};

type DefaultValues = {
  resultLimit: number,
  showDistribution: boolean,
  showOutliers: boolean,
  theme: string,
};

type SerializedBoxPlotSettings = {|
  resultLimit: number,
  selectedDimension: ?string,
  selectedField: string,
  showDistribution: boolean,
  showOutliers: boolean,
  theme: string,
|};

const DEFAULT_RESULT_LIMIT = 15;

function getDisplayableGroupings(
  groupings: Zen.Array<QueryResultGrouping>,
): $ReadOnlyArray<QueryResultGrouping> {
  // HACK(stephen): Really annoying that I have to manually filter out Nation.
  return groupings.arrayView().filter(grouping => grouping.id() !== 'nation');
}

class BoxPlotSettings
  extends Zen.BaseModel<BoxPlotSettings, RequiredValues, DefaultValues>
  implements
    Serializable<SerializedBoxPlotSettings>,
    IViewSpecificSettings<BoxPlotSettings> {
  static defaultValues: DefaultValues = {
    resultLimit: DEFAULT_RESULT_LIMIT,
    showDistribution: true,
    showOutliers: true,
    theme: BoxPlotTheme.LightTheme.id(),
  };

  static fromFieldsAndGroupings(
    fields: $ReadOnlyArray<string>,
    groupings: Zen.Array<QueryResultGrouping>,
  ): Zen.Model<BoxPlotSettings> {
    invariant(fields.length > 0, 'BoxPlotSettings requires at least 1 field');
    const displayableGroupings = getDisplayableGroupings(groupings);
    const lastGrouping = displayableGroupings[displayableGroupings.length - 1];
    return BoxPlotSettings.create({
      selectedDimension:
        lastGrouping !== undefined ? lastGrouping.id() : undefined,
      selectedField: fields[0],
    });
  }

  static deserialize(
    values: SerializedBoxPlotSettings,
  ): Zen.Model<BoxPlotSettings> {
    const { selectedDimension, ...additionalValues } = values;
    return BoxPlotSettings.create({
      selectedDimension: selectedDimension || undefined,
      ...additionalValues,
    });
  }

  serialize(): SerializedBoxPlotSettings {
    return {
      resultLimit: this._.resultLimit(),
      selectedDimension: this._.selectedDimension(),
      selectedField: this._.selectedField(),
      showDistribution: this._.showDistribution(),
      showOutliers: this._.showOutliers(),
      theme: this._.theme(),
    };
  }

  updateFromNewGroupBySettings(
    // eslint-disable-next-line no-unused-vars
    newGroupBySettings: GroupBySettings,
  ): Zen.Model<BoxPlotSettings> {
    return this._;
  }

  updateFromNewSeriesSettings(
    newSeriesSettings: SeriesSettings,
  ): Zen.Model<BoxPlotSettings> {
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

  changeToVisualizationType(): Zen.Model<BoxPlotSettings> {
    return this._;
  }
}

export default ((BoxPlotSettings: $Cast): Class<Zen.Model<BoxPlotSettings>>);
