// @flow
import PropTypes from 'prop-types';

import * as Zen from 'lib/Zen';
import GroupBySettings from 'models/core/QueryResultSpec/GroupBySettings';
import TitleSettings from 'models/core/QueryResultSpec/TitleSettings';
import VisualizationSettings from 'models/core/QueryResultSpec/VisualizationSettings';
import ZenMap from 'util/ZenModel/ZenMap';
import ZenModel, { def } from 'util/ZenModel';
import override from 'decorators/override';
import type { ResultViewType } from 'components/QueryResult/viewTypes';

export type SerializedDashboardItemSettings = {
  id: string,
  titleSettings: Zen.Serialized<TitleSettings>,
  groupBySettings: Zen.Serialized<GroupBySettings>,
  viewTypeSettings: {
    [viewType: ResultViewType]: Zen.Serialized<VisualizationSettings>,
  },
};

/**
 * The DashboardItemSettings model represents all the settings associated with
 * a single tile on a given dashboard.
 */
export default class DashboardItemSettings extends ZenModel.withTypes({
  id: def(PropTypes.string.isRequired, undefined, ZenModel.PRIVATE),

  groupBySettings: def(PropTypes.instanceOf(GroupBySettings).isRequired),
  titleSettings: def(PropTypes.instanceOf(TitleSettings).isRequired),

  viewTypeSettings: def(
    ZenMap.of(PropTypes.instanceOf(VisualizationSettings)).isRequired,
    undefined,
  ),
}) {
  @override
  static deserialize(
    values: SerializedDashboardItemSettings,
  ): DashboardItemSettings {
    const { id, groupBySettings, titleSettings, viewTypeSettings } = values;
    let _viewTypeSettings: ZenMap<VisualizationSettings> = ZenMap.create();

    Object.keys(viewTypeSettings).forEach((viewType: ResultViewType) => {
      const rawSetting: ?Zen.Serialized<VisualizationSettings> =
        viewTypeSettings[viewType];
      if (!rawSetting) {
        return;
      }

      const {
        axesSettings,
        legendSettings,
        seriesSettings,
        viewSpecificSettings,
      } = rawSetting;

      const setting = VisualizationSettings.deserialize(
        {
          axesSettings,
          seriesSettings,
          legendSettings,
          viewSpecificSettings,
        },
        { viewType },
      );
      _viewTypeSettings = _viewTypeSettings.set(viewType, setting);
    });

    return DashboardItemSettings.create({
      id,
      titleSettings: TitleSettings.deserialize(titleSettings),
      groupBySettings: GroupBySettings.deserialize(groupBySettings),
      viewTypeSettings: _viewTypeSettings,
    });
  }

  serialize(): SerializedDashboardItemSettings {
    const {
      id,
      titleSettings,
      groupBySettings,
      viewTypeSettings,
    } = this.modelValues();
    return {
      id,
      titleSettings: titleSettings.serialize(),
      groupBySettings: groupBySettings.serialize(),
      viewTypeSettings: Zen.serializeMap<ResultViewType, VisualizationSettings>(
        viewTypeSettings,
      ),
    };
  }
}
