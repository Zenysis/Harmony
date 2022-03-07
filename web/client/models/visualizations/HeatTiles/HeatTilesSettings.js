// @flow
import invariant from 'invariant';

import * as Zen from 'lib/Zen';
import { SORT_DESCENDING } from 'components/QueryResult/graphUtil';
import type GroupBySettings from 'models/core/QueryResultSpec/GroupBySettings';
import type SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';
import type { IViewSpecificSettings } from 'models/visualizations/common/interfaces';
import type { Serializable } from 'lib/Zen';

type RequiredValues = {
  firstYaxisSelections: $ReadOnlyArray<string>,
  selectedField: string,
  sortOn: string,
};

type DefaultValues = {
  divergentColoration: boolean,
  invertColoration: boolean,
  logScaling: boolean,
  resultLimit: number,
  showTimeOnYAxis: boolean,
  sortOrder: string,
  useEthiopianDates: boolean,
};

type SerializedHeatTileSettings = {
  divergentColoration: boolean,
  firstYaxisSelections: $ReadOnlyArray<string>,
  invertColoration: boolean,
  logScaling: boolean,
  resultLimit: number,
  selectedField: string,
  showTimeOnYAxis: boolean,
  sortOn: string,
  sortOrder: string,
  useEthiopianDates: boolean,
};

const DEFAULT_RESULT_LIMIT = 100;

class HeatTilesSettings
  extends Zen.BaseModel<HeatTilesSettings, RequiredValues, DefaultValues>
  implements
    Serializable<SerializedHeatTileSettings>,
    IViewSpecificSettings<HeatTilesSettings> {
  static deserialize(
    values: SerializedHeatTileSettings,
  ): Zen.Model<HeatTilesSettings> {
    return HeatTilesSettings.create(values);
  }

  static defaultValues: DefaultValues = {
    showTimeOnYAxis: true,
    logScaling: true,
    resultLimit: DEFAULT_RESULT_LIMIT,
    sortOrder: SORT_DESCENDING,
    useEthiopianDates: window.__JSON_FROM_BACKEND.timeseriesUseEtDates || false,
    invertColoration: false,
    divergentColoration: true,
  };

  static fromFieldIds(
    fields: $ReadOnlyArray<string>,
  ): Zen.Model<HeatTilesSettings> {
    invariant(fields.length > 0, 'HeatTilesSettings requires at least 1 field');
    return HeatTilesSettings.create({
      firstYaxisSelections: fields,
      selectedField: fields[0],
      sortOn: fields[0],
    });
  }

  serialize(): SerializedHeatTileSettings {
    return {
      divergentColoration: this._.divergentColoration(),
      firstYaxisSelections: this._.firstYaxisSelections(),
      invertColoration: this._.invertColoration(),
      logScaling: this._.logScaling(),
      resultLimit: this._.resultLimit(),
      selectedField: this._.selectedField(),
      showTimeOnYAxis: this._.showTimeOnYAxis(),
      sortOn: this._.sortOn(),
      sortOrder: this._.sortOrder(),
      useEthiopianDates: this._.useEthiopianDates(),
    };
  }

  updateFromNewGroupBySettings(
    // eslint-disable-next-line no-unused-vars
    newGroupBySettings: GroupBySettings,
  ): Zen.Model<HeatTilesSettings> {
    return this._;
  }

  updateFromNewSeriesSettings(
    newSeriesSettings: SeriesSettings,
  ): Zen.Model<HeatTilesSettings> {
    const seriesOrder = newSeriesSettings.seriesOrder();
    const defaultFieldId = seriesOrder[0];

    const { firstYaxisSelections, selectedField, sortOn } = this.modelValues();
    let newSettings = this._;
    if (!seriesOrder.includes(selectedField)) {
      newSettings = newSettings.selectedField(defaultFieldId);
    }

    if (!seriesOrder.includes(sortOn)) {
      newSettings = newSettings.sortOn(defaultFieldId);
    }

    invariant(
      firstYaxisSelections instanceof Array,
      '`firstYaxisSelections` must be an array.',
    );

    const updatedAxisSelections = firstYaxisSelections.filter(fieldId =>
      seriesOrder.includes(fieldId),
    );

    if (updatedAxisSelections.length !== firstYaxisSelections.length) {
      newSettings = newSettings.firstYaxisSelections(updatedAxisSelections);
    }
    return newSettings;
  }

  getTitleField(): string {
    return this._.selectedField();
  }

  changeToVisualizationType(): Zen.Model<HeatTilesSettings> {
    return this._;
  }
}

export default ((HeatTilesSettings: $Cast): Class<
  Zen.Model<HeatTilesSettings>,
>);
