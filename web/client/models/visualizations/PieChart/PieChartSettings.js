// @flow
import * as Zen from 'lib/Zen';
import type GroupBySettings from 'models/core/QueryResultSpec/GroupBySettings';
import type { IViewSpecificSettings } from 'models/visualizations/common/interfaces';
import type { Serializable } from 'lib/Zen';

type DrilldownSelection = {
  +[string]: string | null,
  ...,
};

type DefaultValues = {
  breakdown: 'dimension' | 'field',
  displayLabelType: 'percent' | 'raw' | 'both',
  drilldownSelection: DrilldownSelection | void,
  palette: $ReadOnlyArray<string>,
  selectedSegments: $ReadOnlyArray<string>,
};

type SerializedPieChartSettings = {
  breakdown: 'dimension' | 'field',
  displayLabelType: 'percent' | 'raw' | 'both',
  drilldownSelection: ?DrilldownSelection,
  palette: $ReadOnlyArray<string>,
  selectedSegments: $ReadOnlyArray<string>,
};

// The default palette is the Tableau 10 color scheme.
export const DEFAULT_PALETTE = [
  '#4e79a7',
  '#f28e2c',
  '#e15759',
  '#76b7b2',
  '#59a14f',
  '#edc949',
  '#af7aa1',
  '#ff9da7',
  '#9c755f',
  '#bab0ab',
];

class PieChartSettings
  extends Zen.BaseModel<PieChartSettings, {}, DefaultValues>
  implements
    Serializable<SerializedPieChartSettings>,
    IViewSpecificSettings<PieChartSettings> {
  static defaultValues: DefaultValues = {
    breakdown: 'field',
    displayLabelType: 'percent',
    drilldownSelection: undefined,
    palette: DEFAULT_PALETTE,
    selectedSegments: [],
  };

  static deserialize(
    values: SerializedPieChartSettings,
  ): Zen.Model<PieChartSettings> {
    const {
      breakdown,
      drilldownSelection,
      displayLabelType,
      palette,
      selectedSegments,
    } = values;
    return PieChartSettings.create({
      breakdown,
      selectedSegments,
      palette,
      displayLabelType,
      drilldownSelection: drilldownSelection || undefined,
    });
  }

  serialize(): SerializedPieChartSettings {
    return {
      breakdown: this._.breakdown(),
      drilldownSelection: this._.drilldownSelection(),
      displayLabelType: this._.displayLabelType(),
      palette: this._.palette(),
      selectedSegments: this._.selectedSegments(),
    };
  }

  updateFromNewGroupBySettings(
    // eslint-disable-next-line no-unused-vars
    newGroupBySettings: GroupBySettings,
  ): Zen.Model<PieChartSettings> {
    return this._;
  }

  updateFromNewSeriesSettings(): Zen.Model<PieChartSettings> {
    return this._;
  }

  getTitleField(): void {
    return undefined;
  }

  changeToVisualizationType(): Zen.Model<PieChartSettings> {
    return this._;
  }
}

export default ((PieChartSettings: $Cast): Class<Zen.Model<PieChartSettings>>);
