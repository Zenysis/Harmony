// @flow
import * as Zen from 'lib/Zen';
import DatePickerSettings from 'models/config/CalendarSettings/DatePickerSettings';
import GranularitySettings from 'models/config/CalendarSettings/GranularitySettings';
import memoizeOne from 'decorators/memoizeOne';
import type { Serializable } from 'lib/Zen';

type RequiredValues = {
  datePickerSettings: DatePickerSettings,

  fiscalDateUsesCalendarYear: boolean,
  fiscalStartMonth: number,
  granularitySettings: GranularitySettings,
};

type SerializedCalendarSettings = {
  datePickerSettings: Zen.Serialized<DatePickerSettings>,
  fiscalDateUsesCalendarYear: boolean,
  fiscalStartMonth: number,
  granularitySettings: Zen.Serialized<GranularitySettings>,
};

class CalendarSettings extends Zen.BaseModel<CalendarSettings, RequiredValues>
  implements Serializable<SerializedCalendarSettings> {
  // TODO: The calendar settings right now are provided by the backend
  // config. This means that there is a singleton value being passed around. If
  // the backend config moves to an asynchronous loading style, then the code
  // paths that rely on this singleton will need to be refactored. For now, this
  // approach is ok since the backend config refactor is not coming any time
  // soon.
  @memoizeOne
  static current(): Zen.Model<CalendarSettings> {
    return CalendarSettings.deserialize(
      window.__JSON_FROM_BACKEND.calendarSettings,
    );
  }

  static deserialize(
    values: SerializedCalendarSettings,
  ): Zen.Model<CalendarSettings> {
    return CalendarSettings.create({
      datePickerSettings: DatePickerSettings.deserialize(
        values.datePickerSettings,
      ),
      fiscalDateUsesCalendarYear: values.fiscalDateUsesCalendarYear,
      fiscalStartMonth: values.fiscalStartMonth,
      granularitySettings: GranularitySettings.deserialize(
        values.granularitySettings,
      ),
    });
  }

  serialize(): SerializedCalendarSettings {
    return {
      datePickerSettings: this._.datePickerSettings().serialize(),
      fiscalDateUsesCalendarYear: this._.fiscalDateUsesCalendarYear(),
      fiscalStartMonth: this._.fiscalStartMonth(),
      granularitySettings: this._.granularitySettings().serialize(),
    };
  }
}

export default ((CalendarSettings: $Cast): Class<Zen.Model<CalendarSettings>>);
