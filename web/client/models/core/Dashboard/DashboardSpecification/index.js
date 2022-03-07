// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import DashboardCommonSettings from 'models/DashboardBuilderApp/DashboardCommonSettings';
import DashboardItemHolder from 'models/DashboardBuilderApp/DashboardItem/DashboardItemHolder';
import DashboardOptions from 'models/core/Dashboard/DashboardSpecification/DashboardOptions';
import ZenError from 'util/ZenError';
import type { Serializable } from 'lib/Zen';

export const EXPECTED_VERSION = '2021-10-25';

const DEFAULT_DASHBOARD_TITLE = 'New Dashboard';

type DefaultValues = {
  /**
   * Model containing common settings for the dashboard, such as filters and
   * groupings.
   */
  commonSettings: DashboardCommonSettings,

  /**
   * The model containing options/preferences that have a dashboard-wide effect.
   */
  dashboardOptions: DashboardOptions,

  /**
   * The models containing the information needed to render each dashboard tile.
   */
  items: $ReadOnlyArray<DashboardItemHolder>,

  /**
   * This flag indicates that the dashboard layout was built using the legacy
   * dashboard building experience.
   */
  legacy: boolean,

  /** The schema version of the Dashboard Specification. */
  version: string,
};

type SerializedDashboardSpecification = {
  commonSettings: Zen.Serialized<DashboardCommonSettings>,
  items: $ReadOnlyArray<Zen.Serialized<DashboardItemHolder>>,
  legacy: boolean,
  options: Zen.Serialized<DashboardOptions>,
  version: string,
};

/**
 * The DashboardSpecification is the JSON-Object representation of a dashboard.
 * It contains the metadata including visualizations, placements, queries,
 * date ranges and other information required to completely render a dashboard.
 */
class DashboardSpecification
  extends Zen.BaseModel<DashboardSpecification, {}, DefaultValues>
  implements Serializable<SerializedDashboardSpecification> {
  static defaultValues: DefaultValues = {
    commonSettings: DashboardCommonSettings.create({}),
    dashboardOptions: DashboardOptions.create({
      title: DEFAULT_DASHBOARD_TITLE,
    }),
    items: [],
    legacy: false,
    version: EXPECTED_VERSION,
  };

  static deserializeAsync(
    values: SerializedDashboardSpecification,
  ): Promise<Zen.Model<DashboardSpecification>> {
    const {
      commonSettings: serializedCommonSettings,
      items: serializedItems,
      legacy,
      options,
      version,
    } = values;
    if (version !== EXPECTED_VERSION) {
      throw new ZenError(
        `Unexpected Dashboard Specification version of '${version}'.
         Expected version '${EXPECTED_VERSION}'.
         Please force refresh the page.`,
      );
    }

    const commonSettingsPromise = DashboardCommonSettings.deserializeAsync(
      serializedCommonSettings,
    );

    const itemsPromise = Zen.deserializeAsyncArray(
      DashboardItemHolder,
      serializedItems,
    );

    return Promise.all([commonSettingsPromise, itemsPromise]).then(
      ([commonSettings, items]) => {
        return DashboardSpecification.create({
          commonSettings,
          dashboardOptions: DashboardOptions.deserialize(options),
          items,
          legacy,
          version,
        });
      },
    );
  }

  serialize(): SerializedDashboardSpecification {
    const {
      commonSettings,
      dashboardOptions,
      items,
      legacy,
    } = this.modelValues();
    return {
      commonSettings: commonSettings.serialize(),
      items: Zen.serializeArray(items),
      legacy,
      options: dashboardOptions.serialize(),
      version: EXPECTED_VERSION,
    };
  }
}

export default ((DashboardSpecification: $Cast): Class<
  Zen.Model<DashboardSpecification>,
>);
