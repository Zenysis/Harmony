// @flow
import * as Zen from 'lib/Zen';
import type { Serializable } from 'lib/Zen';

/**
 * The default column count value if not specified.
 */
const DEFAULT_COLUMN_COUNT = 100;

type RequiredValues = {
  title: string,
};

type DefaultValues = {
  columnCount: number,
};

type SerializedDashboardOptions = {
  columnCount: number,
  title: string,
};

/**
 * The DashboardOptions model contains options that affect both stylistic and
 * functional preferences for the entire Dashboard.
 */
class DashboardOptions
  extends Zen.BaseModel<DashboardOptions, RequiredValues, DefaultValues>
  implements Serializable<SerializedDashboardOptions> {
  static defaultValues: DefaultValues = {
    columnCount: DEFAULT_COLUMN_COUNT,
  };

  serialize(): SerializedDashboardOptions {
    const { columnCount, title } = this.modelValues();
    return {
      columnCount,
      title,
    };
  }

  static deserialize(
    options: SerializedDashboardOptions,
  ): Zen.Model<DashboardOptions> {
    const { columnCount, title } = options;
    return DashboardOptions.create({
      columnCount,
      title,
    });
  }
}

export default ((DashboardOptions: $Cast): Class<Zen.Model<DashboardOptions>>);
