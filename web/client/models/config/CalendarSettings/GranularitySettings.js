// @flow
import * as Zen from 'lib/Zen';
import DateOption from 'models/config/CalendarSettings/DateOption';
import memoizeOne from 'decorators/memoizeOne';
import type { Serializable } from 'lib/Zen';

type Values = {
  day: DateOption,
  dayOfYear: DateOption,
  epiWeek: DateOption,
  epiWeekOfYear: DateOption,
  fiscalQuarter: DateOption,
  fiscalHalf: DateOption,
  fiscalYear: DateOption,
  month: DateOption,
  monthOfYear: DateOption,
  quarter: DateOption,
  quarterOfYear: DateOption,
  week: DateOption,
  weekOfYear: DateOption,
  year: DateOption,
};

type SerializedGranularitySettings = {
  day: Zen.Serialized<DateOption>,
  dayOfYear: Zen.Serialized<DateOption>,
  epiWeek: Zen.Serialized<DateOption>,
  epiWeekOfYear: Zen.Serialized<DateOption>,
  fiscalQuarter: Zen.Serialized<DateOption>,
  fiscalHalf: Zen.Serialized<DateOption>,
  fiscalYear: Zen.Serialized<DateOption>,
  month: Zen.Serialized<DateOption>,
  monthOfYear: Zen.Serialized<DateOption>,
  quarter: Zen.Serialized<DateOption>,
  quarterOfYear: Zen.Serialized<DateOption>,
  week: Zen.Serialized<DateOption>,
  weekOfYear: Zen.Serialized<DateOption>,
  year: Zen.Serialized<DateOption>,
};

class GranularitySettings extends Zen.BaseModel<GranularitySettings, Values>
  implements Serializable<SerializedGranularitySettings> {
  static deserialize(
    serializedValues: SerializedGranularitySettings,
  ): Zen.Model<GranularitySettings> {
    const values = {};
    Object.keys(serializedValues).forEach(key => {
      values[key] = DateOption.deserialize(serializedValues[key]);
    });
    return GranularitySettings.create(values);
  }

  isGranularityEnabled(granularityId: string): boolean {
    const enabledDateOptions = this.enabledGranularities();
    return enabledDateOptions.some(
      dateOption => dateOption.id() === granularityId,
    );
  }

  @memoizeOne
  enabledGranularities(): $ReadOnlyArray<DateOption> {
    const values = this._.modelValues();
    const output = [];
    Object.keys(values).forEach(key => {
      const dateOption = values[key];
      if (dateOption.enabled()) {
        output.push(dateOption);
      }
    });
    return output;
  }

  @memoizeOne
  granularities(): $ReadOnlyArray<DateOption> {
    const values = this._.modelValues();
    return Object.keys(values).map(key => values[key]);
  }

  serialize(): SerializedGranularitySettings {
    return {
      day: this._.day().serialize(),
      dayOfYear: this._.dayOfYear().serialize(),
      epiWeek: this._.epiWeek().serialize(),
      epiWeekOfYear: this._.epiWeekOfYear().serialize(),
      fiscalQuarter: this._.fiscalQuarter().serialize(),
      fiscalHalf: this._.fiscalHalf().serialize(),
      fiscalYear: this._.fiscalYear().serialize(),
      month: this._.month().serialize(),
      monthOfYear: this._.monthOfYear().serialize(),
      quarter: this._.quarter().serialize(),
      quarterOfYear: this._.quarterOfYear().serialize(),
      week: this._.week().serialize(),
      weekOfYear: this._.weekOfYear().serialize(),
      year: this._.year().serialize(),
    };
  }
}

export default ((GranularitySettings: $Cast): Class<
  Zen.Model<GranularitySettings>,
>);
