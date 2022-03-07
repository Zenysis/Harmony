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

type DefaultValues = {
  displayValueAsPill: boolean,
  secondarySelectedField: string | void,
  showLastValue: boolean,
};

type SerializedNumberTrendSettings = {
  displayValueAsPill: boolean,
  selectedField: string,
  secondarySelectedField: string | void,
  showLastValue: boolean,
};

class NumberTrendSettings
  extends Zen.BaseModel<NumberTrendSettings, RequiredValues, DefaultValues>
  implements
    Serializable<SerializedNumberTrendSettings>,
    IViewSpecificSettings<NumberTrendSettings> {
  static defaultValues: DefaultValues = {
    displayValueAsPill: false,
    secondarySelectedField: undefined,
    showLastValue: false,
  };

  static fromFieldIds(
    fields: $ReadOnlyArray<string>,
  ): Zen.Model<NumberTrendSettings> {
    invariant(
      fields.length > 0,
      'NumberTrendSettings requires at least 1 field',
    );
    return NumberTrendSettings.create({ selectedField: fields[0] });
  }

  static deserialize(
    values: SerializedNumberTrendSettings,
  ): Zen.Model<NumberTrendSettings> {
    return NumberTrendSettings.create(values);
  }

  serialize(): SerializedNumberTrendSettings {
    return {
      displayValueAsPill: this._.displayValueAsPill(),
      selectedField: this._.selectedField(),
      secondarySelectedField: this._.secondarySelectedField(),
      showLastValue: this._.showLastValue(),
    };
  }

  updateFromNewGroupBySettings(
    // eslint-disable-next-line no-unused-vars
    newGroupBySettings: GroupBySettings,
  ): Zen.Model<NumberTrendSettings> {
    return this._;
  }

  updateFromNewSeriesSettings(
    newSeriesSettings: SeriesSettings,
  ): Zen.Model<NumberTrendSettings> {
    const seriesOrder = newSeriesSettings.seriesOrder();
    const defaultFieldId = seriesOrder[0];
    let newSettings = this._;

    // Don't default to new field if no selection has been made.
    if (
      !seriesOrder.includes(this._.selectedField()) &&
      this._.selectedField() !== ''
    ) {
      newSettings = newSettings.selectedField(defaultFieldId);
    }

    // If the secondary field no longer exists, default back to no selection
    if (!seriesOrder.includes(this._.secondarySelectedField())) {
      newSettings = newSettings.secondarySelectedField(undefined);
    }

    return newSettings;
  }

  getTitleField(): string {
    return this._.selectedField();
  }

  changeToVisualizationType(): Zen.Model<NumberTrendSettings> {
    return this._;
  }
}

export default ((NumberTrendSettings: $Cast): Class<
  Zen.Model<NumberTrendSettings>,
>);
