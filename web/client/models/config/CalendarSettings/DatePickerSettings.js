// @flow
import * as Zen from 'lib/Zen';
import memoizeOne from 'decorators/memoizeOne';
import type {
  AllTimeConfig,
  CalendarType,
  CalendarTypeConfig,
  DateGranularityConfig,
  LastDateConfig,
  ThisDateConfig,
} from 'components/ui/DatePicker/types';
import type { Serializable } from 'lib/Zen';

type RequiredValues = {
  enabledCalendarTypes: $ReadOnlyArray<CalendarTypeConfig>,
  enabledGranularities: $ReadOnlyArray<DateGranularityConfig>,
  defaultCalendarType: CalendarType,
  defaultRelativeDates: $ReadOnlyArray<
    ThisDateConfig | LastDateConfig | AllTimeConfig,
  >,
};

type SerializedDatePickerSettings = RequiredValues;

class DatePickerSettings
  extends Zen.BaseModel<DatePickerSettings, RequiredValues>
  implements Serializable<SerializedDatePickerSettings> {
  // TODO(pablo): this is due a refactoring when we move to load configs
  // asynchronously from API calls. Read Stephen's comments in
  // CalendarSettings about that.
  @memoizeOne
  static current(): Zen.Model<DatePickerSettings> {
    return DatePickerSettings.deserialize(
      window.__JSON_FROM_BACKEND.calendarSettings.datePickerSettings,
    );
  }

  static deserialize(
    values: SerializedDatePickerSettings,
  ): Zen.Model<DatePickerSettings> {
    return DatePickerSettings.create(values);
  }

  serialize(): SerializedDatePickerSettings {
    return this.modelValues();
  }
}

export default ((DatePickerSettings: $Cast): Class<
  Zen.Model<DatePickerSettings>,
>);
