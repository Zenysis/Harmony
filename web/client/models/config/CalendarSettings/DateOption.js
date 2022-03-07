// @flow
import * as Zen from 'lib/Zen';
import type { Serializable } from 'lib/Zen';

type RequiredValues = {
  defaultDateFormat: string,
  enabled: boolean,
  id: string,
  name: string,
};

type DefaultValues = {
  graphDateFormat: string,
  shortDateFormat: string,
  shortGraphDateFormat: string,
};

type SerializedDateOption = {
  defaultDateFormat: string,
  enabled: boolean,
  id: string,
  name: string,

  graphDateFormat: ?string,
  shortDateFormat: ?string,
  shortGraphDateFormat: ?string,
};

class DateOption
  extends Zen.BaseModel<DateOption, RequiredValues, DefaultValues>
  implements Serializable<SerializedDateOption> {
  static defaultValues: DefaultValues = {
    graphDateFormat: 'YYYY-MM-DD',
    shortDateFormat: 'YYYY-MM-DD',
    shortGraphDateFormat: 'YYYY-MM-DD',
  };

  static deserialize(values: SerializedDateOption): Zen.Model<DateOption> {
    // If any of the optional date formats are not provided, use the default
    // format (or the most applicable default format).
    const {
      defaultDateFormat,
      graphDateFormat,
      shortDateFormat,
      shortGraphDateFormat,
      ...additionalValues
    } = values;
    return DateOption.create({
      ...additionalValues,
      defaultDateFormat,
      graphDateFormat: graphDateFormat || defaultDateFormat,
      shortDateFormat: shortDateFormat || defaultDateFormat,
      shortGraphDateFormat:
        shortGraphDateFormat ||
        shortDateFormat ||
        graphDateFormat ||
        defaultDateFormat,
    });
  }

  serialize(): SerializedDateOption {
    return {
      defaultDateFormat: this._.defaultDateFormat(),
      enabled: this._.enabled(),
      graphDateFormat: this._.graphDateFormat(),
      id: this._.id(),
      name: this._.name(),
      shortDateFormat: this._.shortDateFormat(),
      shortGraphDateFormat: this._.shortGraphDateFormat(),
    };
  }
}

export default ((DateOption: $Cast): Class<Zen.Model<DateOption>>);
