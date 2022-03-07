// @flow
import * as Zen from 'lib/Zen';
import CustomField from 'models/core/Field/CustomField';
import DataFilterGroup from 'models/core/QueryResultSpec/DataFilterGroup';
import GroupBySettings from 'models/core/QueryResultSpec/GroupBySettings';
import XAxisSettings from 'models/core/QueryResultSpec/VisualizationSettings/XAxisSettings';
import YAxisSettings from 'models/core/QueryResultSpec/VisualizationSettings/YAxisSettings';
import type TitleSettings from 'models/core/QueryResultSpec/TitleSettings';
import type VisualizationSettings from 'models/core/QueryResultSpec/VisualizationSettings';
import type { ResultViewType } from 'components/QueryResult/viewTypes';
import type { SerializedXAxis } from 'models/core/QueryResultSpec/VisualizationSettings/XAxisSettings';
import type { SerializedYAxis } from 'models/core/QueryResultSpec/VisualizationSettings/YAxisSettings';

/**
 * NOTE(isabel): This hack is meant to address an issue where existing AQT tabs
 * using the old queryResultSpec contain six 'goalLine'-related keys and were
 * not upgraded to use the new Spec, which no longer contains those keys. This
 * function therefore upgrades the Query result spec. Delete this function
 * after February 28 2022 — this should give enough time for any active users
 * to log in and upgrade their tabs (hopefully).
 * Ignored flow errors are expected as this is all hacky.
 */

type SerializedVisualizationSettingsMap = {
  +[ResultViewType]: Zen.Serialized<VisualizationSettings>,
  ...,
};

type SerializedQueryResultSpec = {
  customFields: $ReadOnlyArray<Zen.Serialized<CustomField>>,
  dataFilters: Zen.Serialized<DataFilterGroup>,
  groupBySettings: Zen.Serialized<GroupBySettings>,
  titleSettings: Zen.Serialized<TitleSettings>,
  viewTypes: $ReadOnlyArray<ResultViewType>,
  visualizationSettings: SerializedVisualizationSettingsMap,
};

function removeGoalLinePropertiesFromXAxis(
  xAxisSettings: SerializedXAxis,
): SerializedXAxis {
  const xAxis = XAxisSettings.create({
    additionalAxisTitleDistance: xAxisSettings.additionalAxisTitleDistance,
    labelsFontColor: xAxisSettings.labelsFontColor,
    labelsFontFamily: xAxisSettings.labelsFontFamily,
    labelsFontSize: xAxisSettings.labelsFontSize,
    title: xAxisSettings.title,
    titleFontColor: xAxisSettings.titleFontColor,
    titleFontFamily: xAxisSettings.titleFontFamily,
    titleFontSize: xAxisSettings.titleFontSize,
  });

  return xAxis.serialize();
}

function removeGoalLinePropertiesFromYAxis(
  yAxisSettings: SerializedYAxis,
): SerializedYAxis {
  const yAxis = YAxisSettings.create({
    additionalAxisTitleDistance: yAxisSettings.additionalAxisTitleDistance,
    labelsFontColor: yAxisSettings.labelsFontColor,
    labelsFontFamily: yAxisSettings.labelsFontFamily,
    labelsFontSize: yAxisSettings.labelsFontSize,
    rangeFrom: yAxisSettings.rangeFrom,
    rangeTo: yAxisSettings.rangeTo,
    title: yAxisSettings.title,
    titleFontColor: yAxisSettings.titleFontColor,
    titleFontFamily: yAxisSettings.titleFontFamily,
    titleFontSize: yAxisSettings.titleFontSize,
  });

  return yAxis.serialize();
}

export default function upgradeQueryResultSpec20210707(
  serializedObject: SerializedQueryResultSpec,
): SerializedQueryResultSpec {
  const { visualizationSettings } = serializedObject;
  Object.keys(visualizationSettings).forEach(resultViewType => {
    const vizSettings = visualizationSettings[resultViewType];

    if (!vizSettings || !vizSettings.axesSettings) {
      return;
    }

    const { axesSettings } = vizSettings;

    if (axesSettings && axesSettings.xAxis) {
      const updatedXAxis = removeGoalLinePropertiesFromXAxis(
        axesSettings.xAxis,
      );
      axesSettings.xAxis = updatedXAxis;
    }

    if (axesSettings && axesSettings.y1Axis) {
      const updatedY1Axis = removeGoalLinePropertiesFromYAxis(
        axesSettings.y1Axis,
      );
      axesSettings.y1Axis = updatedY1Axis;
    }

    if (axesSettings && axesSettings.y2Axis) {
      const updatedY2Axis = removeGoalLinePropertiesFromYAxis(
        axesSettings.y2Axis,
      );
      axesSettings.y2Axis = updatedY2Axis;
    }

    // $FlowExpectedError[cannot-write]
    visualizationSettings[resultViewType] = vizSettings;
  });

  return {
    ...serializedObject,
    visualizationSettings,
  };
}
