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

type SerializedExpandoTreeSettings = {|
  selectedField: string,
|};

class ExpandoTreeSettings
  extends Zen.BaseModel<ExpandoTreeSettings, RequiredValues>
  implements
    Serializable<SerializedExpandoTreeSettings>,
    IViewSpecificSettings<ExpandoTreeSettings> {
  static fromFieldIds(
    fields: $ReadOnlyArray<string>,
  ): Zen.Model<ExpandoTreeSettings> {
    invariant(
      fields.length > 0,
      'ExpandoTreeSettings requires at least 1 field',
    );
    return ExpandoTreeSettings.create({ selectedField: fields[0] });
  }

  static deserialize(
    values: SerializedExpandoTreeSettings,
  ): Zen.Model<ExpandoTreeSettings> {
    return ExpandoTreeSettings.create(values);
  }

  serialize(): SerializedExpandoTreeSettings {
    return {
      selectedField: this._.selectedField(),
    };
  }

  updateFromNewGroupBySettings(
    // eslint-disable-next-line no-unused-vars
    newGroupBySettings: GroupBySettings,
  ): Zen.Model<ExpandoTreeSettings> {
    return this._;
  }

  updateFromNewSeriesSettings(
    newSeriesSettings: SeriesSettings,
  ): Zen.Model<ExpandoTreeSettings> {
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

  changeToVisualizationType(): Zen.Model<ExpandoTreeSettings> {
    return this._;
  }
}

export default ((ExpandoTreeSettings: $Cast): Class<
  Zen.Model<ExpandoTreeSettings>,
>);
