// @flow
import Promise from 'bluebird';
import invariant from 'invariant';

import * as Zen from 'lib/Zen';
import CustomField from 'models/core/Field/CustomField';
import DataFilterGroup from 'models/core/QueryResultSpec/DataFilterGroup';
import Field from 'models/core/wip/Field';
import GroupBySettings from 'models/core/QueryResultSpec/GroupBySettings';
import GroupingDimension from 'models/core/wip/GroupingItem/GroupingDimension';
import GroupingItemUtil from 'models/core/wip/GroupingItem/GroupingItemUtil';
import LayerStyleSettings from 'models/GeoMappingApp/LayerStyleSettings';
import LegendSettings from 'models/core/QueryResultSpec/VisualizationSettings/LegendSettings';
import QueryFilterItemUtil from 'models/core/wip/QueryFilterItem/QueryFilterItemUtil';
import QueryResultSpec, {
  deserializeVisualizationSettingsMap,
} from 'models/core/QueryResultSpec';
import QuerySelections from 'models/core/wip/QuerySelections';
import SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';
import { AQT_RESULT_VIEW_ORDER } from 'components/AdvancedQueryApp/registry/viewTypes';
import type { GeoLayerModel } from 'models/GeoMappingApp/GeoLayerModel';
import type { MapLabelProperties } from 'models/visualizations/MapViz/types';
import type { Serializable } from 'lib/Zen';
import type { SerializedQuerySelections } from 'models/core/wip/QuerySelections';
import type { SerializedVisualizationSettingsMap } from 'models/core/QueryResultSpec';

export type RequiredValues = {
  // TODO(nina): Layers in the AQT have a slightly more sophisticated form of
  // labeling, where we can use colored pills to differentiate between multiple
  // labels in the same label box. The values of the labels are displayed
  // in the box, and the colored pill is used to map to the same color
  // in the legend, which will show the label name corresponding to that value.
  // Ideally, this property would live in the styleSettings. However,
  // that is a common property that all layers in the GIS must have. Entity
  // Layers do not have such a complex labeling system, so this cannot be
  // a "common" property. We will eventually want to unify how to handle labels
  // in the GIS tool, for any layer.
  coloredLabelSettings: MapLabelProperties,
  currentGeoGrouping: GroupingDimension,
  fieldId: string,
  groupBySettings: GroupBySettings,
  id: string,
  legendSettings: LegendSettings,
  querySelections: QuerySelections,
  querySpec: QueryResultSpec,
  seriesSettings: SeriesSettings,
  /** Stores visual layer settings such as label style, color, etc */
  styleSettings: LayerStyleSettings,
};

// TODO(nina): Get rid of this once we don't have two different
// versions of this serialized model
type CommonSerializedValues = {
  coloredLabelSettings: MapLabelProperties,
  currentGeoGrouping: Zen.Serialized<GroupingDimension>,
  fieldId: string,
  id: string,
  styleSettings: Zen.Serialized<LayerStyleSettings>,
};

type SerializedIndicatorLayerModel = {
  ...CommonSerializedValues,
  groupBySettings: Zen.Serialized<GroupBySettings>,
  legendSettings: Zen.Serialized<LegendSettings>,
  querySelections: Zen.Serialized<QuerySelections>,
  querySpec: Zen.Serialized<QueryResultSpec>,
  seriesSettings: Zen.Serialized<SeriesSettings>,
};

// TODO(nina): We store a different representation of the indicator layer
// model in the backend when persisting to dashboards. This is because
// we have no easy representation of the query selections or query result spec,
// so instead we persist the properties used to construct those values.
// Eventually, when the DashboardSpecification backend model gets a major
// overhaul, we don't have to define this separate serialized type, and can
// rely on SerializedIndicatorLayerModel.
export type SerializedIndicatorLayerModelForDashboard = {
  ...CommonSerializedValues,
  ...SerializedQuerySelections,
  customFields: $ReadOnlyArray<Zen.Serialized<CustomField>>,
  frontendDataFilters: Zen.Serialized<DataFilterGroup>,
  visualizationSettings: SerializedVisualizationSettingsMap,
};

/**
 * The IndicatorLayerModel model represents frontend information we want to
 * maintain about any particular indicator layer. These are layers whose data
 * comes from a query result, and can be filtered and grouped together. Since
 * this model replicates how we show an indicator layer on the map visualization
 * in the AQT, we will rely on that infrastructure to generate those layers
 * on the map in the GIS tool.
 */
class IndicatorLayerModel
  extends Zen.BaseModel<IndicatorLayerModel, RequiredValues>
  implements
    GeoLayerModel<IndicatorLayerModel, 'INDICATOR'>,
    Serializable<SerializedIndicatorLayerModel> {
  +tag: 'INDICATOR' = 'INDICATOR';

  static deserializeAsyncFromDashboard(
    values: SerializedIndicatorLayerModelForDashboard,
  ): Promise<Zen.Model<IndicatorLayerModel>> {
    const {
      currentGeoGrouping,
      customFields,
      fields,
      filters,
      frontendDataFilters,
      groups,
      id,
      styleSettings,
      visualizationSettings,
      ...passThroughValues
    } = values;

    const fieldPromises = Promise.all(fields.map(Field.deserializeAsync));
    const filterPromises = Promise.all(
      filters.map(QueryFilterItemUtil.deserializeAsync),
    );
    const groupByPromises = Promise.all(
      groups.map(GroupingItemUtil.deserializeAsync),
    );

    return Promise.all([
      fieldPromises,
      filterPromises,
      groupByPromises,
      GroupingDimension.deserializeAsync(currentGeoGrouping),
    ]).then(
      ([
        deserializedFields,
        deserializedFilters,
        deserializedGroups,
        deserializedGeoGrouping,
      ]) => {
        const querySelections = QuerySelections.create({
          fields: Zen.Array.create(deserializedFields),
          filter: Zen.Array.create(deserializedFilters),
          groups: Zen.Array.create(deserializedGroups),
        });

        const initialQueryResultSpec = QueryResultSpec.fromQuerySelections(
          AQT_RESULT_VIEW_ORDER,
          querySelections,
        );

        const deserializedVisualizationSettings = deserializeVisualizationSettingsMap(
          visualizationSettings,
          AQT_RESULT_VIEW_ORDER,
          initialQueryResultSpec.groupBySettings(),
          'MAP',
        );

        const seriesSettings = deserializedVisualizationSettings.MAP.seriesSettings();
        const legendSettings = deserializedVisualizationSettings.MAP.legendSettings();
        invariant(
          legendSettings,
          'Legend settings should always exist for a MAP visualization',
        );

        const deserializedQuerySpec = initialQueryResultSpec
          .customFields(
            Zen.deserializeArray(CustomField, customFields, {
              seriesSettings,
              dimensions: initialQueryResultSpec
                .groupBySettings()
                .groupings()
                .values()
                .map(group => group.getDimensionId()),
            }),
          )
          .dataFilters(DataFilterGroup.deserialize(frontendDataFilters))
          .visualizationSettings(deserializedVisualizationSettings);

        return IndicatorLayerModel.create({
          currentGeoGrouping: deserializedGeoGrouping,
          groupBySettings: deserializedQuerySpec.groupBySettings(),
          id,
          legendSettings,
          querySelections,
          querySpec: deserializedQuerySpec,
          seriesSettings,
          styleSettings: LayerStyleSettings.deserialize(styleSettings),
          ...passThroughValues,
        });
      },
    );
  }

  static deserializeAsync(
    values: SerializedIndicatorLayerModel,
  ): Promise<Zen.Model<IndicatorLayerModel>> {
    const {
      coloredLabelSettings,
      currentGeoGrouping,
      fieldId,
      groupBySettings,
      id,
      legendSettings,
      querySelections,
      querySpec,
      seriesSettings,
      styleSettings,
    } = values;
    return Promise.all([
      QuerySelections.deserializeAsync(querySelections),
      GroupingDimension.deserializeAsync(currentGeoGrouping),
    ]).then(([deserializedQuerySelections, deserializedGeoGrouping]) =>
      IndicatorLayerModel.create({
        coloredLabelSettings,
        fieldId,
        id,
        currentGeoGrouping: deserializedGeoGrouping,
        groupBySettings: GroupBySettings.deserialize(groupBySettings),
        legendSettings: LegendSettings.deserialize(legendSettings),
        querySelections: deserializedQuerySelections,
        querySpec: QueryResultSpec.deserialize(querySpec),
        seriesSettings: SeriesSettings.deserialize(seriesSettings),
        styleSettings: LayerStyleSettings.deserialize(styleSettings),
      }),
    );
  }

  getId(): string {
    return this._.id();
  }

  getLayerStyleSettings(): LayerStyleSettings {
    return this._.styleSettings();
  }

  isLayerVisible(): boolean {
    return this._.styleSettings().showLayer();
  }

  updateLayerStyleSettings(
    newStyleSettings: LayerStyleSettings,
  ): Zen.Model<IndicatorLayerModel> {
    return this._.styleSettings(newStyleSettings);
  }

  serialize(): SerializedIndicatorLayerModel {
    return {
      coloredLabelSettings: this._.coloredLabelSettings(),
      currentGeoGrouping: this._.currentGeoGrouping().serialize(),
      fieldId: this._.fieldId(),
      groupBySettings: this._.groupBySettings().serialize(),
      id: this._.id(),
      legendSettings: this._.legendSettings().serialize(),
      querySelections: this._.querySelections().serialize(),
      querySpec: this._.querySpec().serialize(),
      seriesSettings: this._.seriesSettings().serialize(),
      styleSettings: this._.styleSettings().serialize(),
    };
  }

  serializeForDashboard(): SerializedIndicatorLayerModelForDashboard {
    const { fields, filters, groups } = this._.querySelections().serialize();
    return {
      coloredLabelSettings: this._.coloredLabelSettings(),
      currentGeoGrouping: this._.currentGeoGrouping().serialize(),
      customFields: Zen.serializeArray(this._.querySpec().customFields()),
      fields,
      filters,
      fieldId: this._.fieldId(),
      frontendDataFilters: this._.querySpec()
        .dataFilters()
        .serialize(),
      groups,
      id: this._.id(),
      styleSettings: this._.styleSettings().serialize(),
      visualizationSettings: Zen.serializeMap(
        this._.querySpec().visualizationSettings(),
      ),
    };
  }
}

export default ((IndicatorLayerModel: $Cast): Class<
  Zen.Model<IndicatorLayerModel>,
>);
