// @flow
import invariant from 'invariant';

import * as Zen from 'lib/Zen';
import type GroupBySettings from 'models/core/QueryResultSpec/GroupBySettings';
import type SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';
import type { IViewSpecificSettings } from 'models/visualizations/common/interfaces';
import type { Serializable } from 'lib/Zen';

type RequiredValues = {
  selectedField: string,
};

type SerializedSunburstSettings = {|
  selectedField: string,
|};

class SunburstSettings extends Zen.BaseModel<SunburstSettings, RequiredValues>
  implements
    Serializable<SerializedSunburstSettings>,
    IViewSpecificSettings<SunburstSettings> {
  static deserialize(
    values: SerializedSunburstSettings,
  ): Zen.Model<SunburstSettings> {
    return SunburstSettings.create(values);
  }

  static fromFieldIds(
    fields: $ReadOnlyArray<string>,
  ): Zen.Model<SunburstSettings> {
    invariant(fields.length > 0, 'SunburstSettings requires at least 1 field');
    return SunburstSettings.create({ selectedField: fields[0] });
  }

  serialize(): SerializedSunburstSettings {
    return {
      selectedField: this._.selectedField(),
    };
  }

  updateFromNewGroupBySettings(
    // eslint-disable-next-line no-unused-vars
    newGroupBySettings: GroupBySettings,
  ): Zen.Model<SunburstSettings> {
    return this._;
  }

  updateFromNewSeriesSettings(
    newSeriesSettings: SeriesSettings,
  ): Zen.Model<SunburstSettings> {
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

  changeToVisualizationType(): Zen.Model<SunburstSettings> {
    return this._;
  }
}

export default ((SunburstSettings: $Cast): Class<Zen.Model<SunburstSettings>>);
