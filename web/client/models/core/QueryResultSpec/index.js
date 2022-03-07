// @flow
import invariant from 'invariant';
import update from 'immutability-helper';

import * as Zen from 'lib/Zen';
import CustomField from 'models/core/Field/CustomField';
import DataActionRule from 'models/core/QueryResultSpec/DataActionRule';
import DataFilterGroup from 'models/core/QueryResultSpec/DataFilterGroup';
import GroupBySettings from 'models/core/QueryResultSpec/GroupBySettings';
import QuerySelections from 'models/core/wip/QuerySelections';
import TitleSettings from 'models/core/QueryResultSpec/TitleSettings';
import VisualizationSettings from 'models/core/QueryResultSpec/VisualizationSettings';
import VisualizationSettingsUtil from 'models/core/QueryResultSpec/VisualizationSettings/VisualizationSettingsUtil';
import upgradeQueryResultSpec20211130 from 'models/core/QueryResultSpec/upgradeQueryResultSpec20211130';
import {
  NO_DATA_DISPLAY_VALUE,
  ZERO_DISPLAY_VALUE,
} from 'models/core/QueryResultSpec/QueryResultSeries';
import { difference } from 'util/setUtil';
import type AxesSettings from 'models/core/QueryResultSpec/VisualizationSettings/AxesSettings';
import type Field from 'models/core/wip/Field';
import type LegendSettings from 'models/core/QueryResultSpec/VisualizationSettings/LegendSettings';
import type QueryResultSeries from 'models/core/QueryResultSpec/QueryResultSeries';
import type SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';
import type { GroupingItem } from 'models/core/wip/GroupingItem/types';
import type { IViewSpecificSettings } from 'models/visualizations/common/interfaces';
import type { ResultViewType } from 'components/QueryResult/viewTypes';
import type { Serializable } from 'lib/Zen';
import type { ViewSpecificSettings } from 'models/visualizations/common/types';
// TODO(pablo): move everything here to use Zen.Array and Zen.Map, that way we
// can remove the dependency of immutability-helper

type RequiredValues = {
  /**
   * Contains grouping data about the query that produced this queryResultSpec.
   * E.g. is the query grouped by Region, by Month, by Quarter, etc.?
   */
  groupBySettings: GroupBySettings,

  /**
   * A model containing metadata such as title, subtitle, and font sizes
   */
  titleSettings: TitleSettings,

  /**
   * An array of view types that represent which visualizations this
   * QueryResultSpec can support. A view type is a key that represents
   * a visualization type: MAP, TABLE, etc.
   * All view types are defined in QueryResult/viewTypes.js
   * ... we probably should have named it visualizationType but that just
   * looks too long.
   */
  viewTypes: $ReadOnlyArray<ResultViewType>,

  /**
   * An object mapping a viewType to a VisualizationSettings object.
   * The VisualizationSettings object contains the AxesSettings,
   * SeriesSettings, LegendSettings, and controls used for each visualization
   */
  visualizationSettings: {
    +[viewType: ResultViewType]: VisualizationSettings,
    ...,
  },
};

type DefaultValues = {
  /**
   * An array with all Custom Fields in this spec.
   */
  customFields: $ReadOnlyArray<CustomField>,

  /** A DataFilterGroup to apply to the query result data */
  dataFilters: DataFilterGroup,
};

export type SerializedVisualizationSettingsMap = {
  +[ResultViewType]: Zen.Serialized<VisualizationSettings>,
};

export type SerializedQueryResultSpec = {
  customFields: $ReadOnlyArray<Zen.Serialized<CustomField>>,
  dataFilters: Zen.Serialized<DataFilterGroup>,
  groupBySettings: Zen.Serialized<GroupBySettings>,
  titleSettings: Zen.Serialized<TitleSettings>,
  viewTypes: $ReadOnlyArray<ResultViewType>,
  visualizationSettings: SerializedVisualizationSettingsMap,
};

/**
 * Deserialize the visualization settings map and ensure the required viewTypes
 * have VisualizationSettings. If a viewType does not have serialized settings,
 * like if a new visualization is added, build the VisualizationSettings from
 * a different viewType's settings.
 */
export function deserializeVisualizationSettingsMap(
  serializedObj: SerializedVisualizationSettingsMap,
  viewTypes: $ReadOnlyArray<ResultViewType>,
  groupBySettings: GroupBySettings,
  currentViewType: ResultViewType | void = undefined,
): { +[ResultViewType]: VisualizationSettings, ... } {
  const vizSettings = {};
  const missingViewSettings = [];
  viewTypes.forEach((viewType: ResultViewType) => {
    const viewSettings = serializedObj[viewType];
    // It is possible for serialized settings to be missing because a new
    // ResultViewType was added.
    if (viewSettings === undefined || viewSettings === null) {
      missingViewSettings.push(viewType);
      return;
    }

    vizSettings[viewType] = VisualizationSettings.deserialize(
      {
        axesSettings: viewSettings.axesSettings,
        legendSettings: viewSettings.legendSettings,
        seriesSettings: viewSettings.seriesSettings,
        viewSpecificSettings: viewSettings.viewSpecificSettings,
      },
      { viewType },
    );
  });

  // Create a new VisualizationSettings instance for all view types that are
  // missing in the serialized data.
  if (missingViewSettings.length > 0) {
    // Sample the current view type's settings (if one is set) to build the
    // new viz settings off of. If the current view type is missing, use the
    // first viz that has a full object as the sample.
    let sampleViewType = currentViewType;
    if (
      currentViewType === undefined ||
      vizSettings[currentViewType] === undefined
    ) {
      // eslint-disable-next-line prefer-destructuring
      sampleViewType = Object.keys(vizSettings)[0];
    }

    invariant(
      sampleViewType !== undefined,
      'Impossible scenario. No visualization settings were deserialized.',
    );
    const sampleVizSettings = vizSettings[sampleViewType];
    const groupings = groupBySettings.groupings().zenValues();
    missingViewSettings.forEach((viewType: ResultViewType) => {
      vizSettings[viewType] = VisualizationSettingsUtil.castToNewViewType(
        sampleVizSettings,
        viewType,
        groupings,
      );
    });
  }

  return vizSettings;
}

/**
 * QueryResultSpec is our frontend representation of a QueryResult.
 * A QueryResultSpec holds everything about the *frontend* configuration
 * of a QueryResult:
 *   The custom calculations, frontend filters, settings, etc.
 *
 * It does NOT hold the selections that were sent to the backend in order
 * to produce this result (e.g. the queried fields, date selections,
 * grouping dimensions, etc.). That information is held in a
 * QuerySelections model.
 *
 * The QuerySelections model is intentionally kept separate from the
 * QueryResultSpec because they represent different stages of a query.
 * QuerySelections represents how data is *requested*, whereas the
 * QueryResultSpec represents how that data is processed once it returns.
 *
 * Note that a single QueryResultSpec can represent *multiple* visualizations.
 * Each visualization type can have its own settings which are stored in the
 * `visualizationSettings` map.
 */
class QueryResultSpec
  extends Zen.BaseModel<QueryResultSpec, RequiredValues, DefaultValues>
  implements Serializable<SerializedQueryResultSpec> {
  static defaultValues: DefaultValues = {
    customFields: [],
    dataFilters: DataFilterGroup.create({ filters: Zen.Array.create() }),
  };

  static fromQuerySelections(
    viewTypes: $ReadOnlyArray<ResultViewType>,
    querySelections: QuerySelections,
    smallMode: boolean = false,
  ): Zen.Model<QueryResultSpec> {
    const { fields, groups } = querySelections.modelValues();
    const titleSettings = TitleSettings.create({});
    const groupBySettings = GroupBySettings.fromGroupingItems(groups);

    // set up visualization settings
    const groupings = groupBySettings.groupings().zenValues();
    const visualizationSettings = {};
    viewTypes.forEach(viewType => {
      visualizationSettings[viewType] = VisualizationSettingsUtil.fromViewType(
        viewType,
        fields.arrayView(),
        groupings,
        smallMode,
      );
    });

    return QueryResultSpec.create({
      groupBySettings,
      titleSettings,
      viewTypes,
      visualizationSettings,
    });
  }

  static deserialize(
    serializedObject: SerializedQueryResultSpec,
  ): Zen.Model<QueryResultSpec> {
    // NOTE(isabel): Remove use of this function and delete the corresponding
    // file upgradeQueryResultSpec20211130.js after February 28 2022, as it would've
    // upgraded all existing AQT user tabs.
    const upgradedSerializedObj = upgradeQueryResultSpec20211130(
      serializedObject,
    );

    const {
      customFields,
      dataFilters,
      titleSettings,
      viewTypes,
      visualizationSettings,
    } = upgradedSerializedObj;

    const groupBySettings = GroupBySettings.deserialize(
      upgradedSerializedObj.groupBySettings,
    );
    const vizSettings = deserializeVisualizationSettingsMap(
      visualizationSettings,
      viewTypes,
      groupBySettings,
    );

    // Use the first view type's series settings when deserializing custom
    // fields.
    const seriesSettingsSample = vizSettings[viewTypes[0]].seriesSettings();
    const deserializedTitleSettings = titleSettings
      ? TitleSettings.deserialize(titleSettings)
      : titleSettings;
    return QueryResultSpec.create({
      groupBySettings,
      viewTypes,
      customFields: Zen.deserializeArray(CustomField, customFields, {
        dimensions: groupBySettings
          .groupings()
          .values()
          .map(group => group.getDimensionId()),
        seriesSettings: seriesSettingsSample,
      }),
      dataFilters: DataFilterGroup.deserialize(dataFilters),
      titleSettings: deserializedTitleSettings,
      visualizationSettings: vizSettings,
    });
  }

  getAxesSettings(viewType: ResultViewType): AxesSettings | void {
    return this._.visualizationSettings()[viewType].axesSettings();
  }

  getSeriesSettings(viewType: ResultViewType): SeriesSettings {
    return this._.visualizationSettings()[viewType].seriesSettings();
  }

  getLegendSettings(viewType: ResultViewType): LegendSettings | void {
    return this._.visualizationSettings()[viewType].legendSettings();
  }

  /**
   * Sometimes (e.g. when editing a query in a dashboard) the underlying
   * query selections will change, but we need to update the queryResultSpec
   * *without* recreating it from scratch (so that other settings don't get
   * reset).
   */
  updateSpecFromNewQuerySelections(
    newSelections: QuerySelections,
    oldSelections: QuerySelections,
  ): Zen.Model<QueryResultSpec> {
    const newFields = newSelections.fields().arrayView();
    const prevFields = oldSelections.fields().arrayView();

    const prevGroups = oldSelections.groups();
    const newGroups = newSelections.groups();

    const newQueryResultSpec = this.updateGroupBySettingsFromGroupingItems(
      prevGroups,
      newGroups,
    )
      .updateDataFiltersFromNewFields(newFields, prevFields)
      .updateSeriesSettingsFromNewFields(newFields, prevFields)
      .updateCustomFieldsFromNewFields(newFields, prevFields);
    return newQueryResultSpec;
  }

  updateGroupBySettingsFromGroupingItems(
    prevGroups: Zen.Array<GroupingItem>,
    newGroups: Zen.Array<GroupingItem>,
  ): Zen.Model<QueryResultSpec> {
    if (newGroups === prevGroups) {
      return this._;
    }

    const newGroupBySettings = GroupBySettings.fromGroupingItems(newGroups);

    const newQueryResultSpec = this._.groupBySettings(newGroupBySettings);

    // Now we've updated the GroupBySettings we need to update any
    // viewSpecificSettings which are dependent on GroupBySettings.
    return this._.viewTypes().reduce(
      (queryResultSpec, viewType) =>
        queryResultSpec.updateVisualizationSettings(viewType, vizSettings => {
          const viewSpecificSettings = vizSettings.viewSpecificSettings();

          return vizSettings.viewSpecificSettings(
            viewSpecificSettings.updateFromNewGroupBySettings(
              newGroupBySettings,
            ),
          );
        }),
      newQueryResultSpec,
    );
  }

  /**
   * This function handles finding which fields were added and removed from the
   * QuerySelctions, and specifically updating the SeriesSettings to handle
   * those fields.
   */
  updateSeriesSettingsFromNewFields(
    newFields: $ReadOnlyArray<Field>,
    prevFields: $ReadOnlyArray<Field>,
  ): Zen.Model<QueryResultSpec> {
    if (newFields === prevFields) {
      return this._;
    }

    // Track the label IDs that have changed so that we can selectively update
    // series settings.
    const changedLabels = {};
    const prevLabels = {};
    // Track the showNullAsZero values that have changed so that we can
    // selectively update series settings.
    const changedNoDataValueToZero = {};
    const prevNoDataValueToZero = {};
    prevFields.forEach(field => {
      const fieldId = field.get('id');
      const fieldLabel = field.label();
      prevLabels[fieldId] = fieldLabel;
      prevNoDataValueToZero[fieldId] = field.showNullAsZero();
    });
    newFields.forEach(field => {
      const fieldId = field.get('id');
      const fieldLabel = field.label();
      if (prevLabels[fieldId] && prevLabels[fieldId] !== fieldLabel) {
        changedLabels[fieldId] = fieldLabel;
      }
      const fieldNoDataValueToZero = field.showNullAsZero();
      if (prevNoDataValueToZero[fieldId] !== fieldNoDataValueToZero) {
        changedNoDataValueToZero[fieldId] = fieldNoDataValueToZero;
      }
    });

    const customFieldIds = this._.customFields().map(field => field.get('id'));
    const newFieldIds = newFields.map(field => field.get('id'));
    const prevFieldIds = prevFields.map(field => field.get('id'));
    const newFieldsSet = new Set(newFieldIds.concat(customFieldIds));
    const fieldOrderChanged =
      newFieldIds.length !== prevFieldIds.length ||
      newFieldIds.some((fieldId, idx) => prevFieldIds[idx] !== fieldId);

    return this._.viewTypes().reduce(
      (spec: Zen.Model<QueryResultSpec>, viewType) => {
        let newSpec = spec;
        const oldSelectedFields = spec
          .getSeriesSettings(viewType)
          .seriesOrder();

        // NOTE(stephen): Concatenating previous field IDs here in case they
        // have somehow diverted.
        // TODO(stephen, pablo): See if this is actually necessary.
        const oldFieldsSet = new Set(
          oldSelectedFields.concat(customFieldIds).concat(prevFieldIds),
        );
        const addedFields = difference(newFieldsSet, oldFieldsSet);
        const removedFields = difference(oldFieldsSet, newFieldsSet);
        if (addedFields.size > 0 || removedFields.size > 0) {
          addedFields.forEach(id => {
            const field = newFields.find(f => f.get('id') === id);
            if (field) {
              newSpec = newSpec.addNewSeries(
                viewType,
                id,
                field.label(),
                field.showNullAsZero(),
              );
            }
          });
          removedFields.forEach(id => {
            newSpec = newSpec.removeSeries(viewType, id);
          });
        }

        // Try to detect if the series order has not been modified by the user.
        // If the order of the previously selected fields matches the series
        // order exactly, then we assume the series order has not been modified
        // by the user.
        // NOTE(stephen): Skipping this check if there are custom fields since
        // it is difficult to determine the original ordering of fields + custom
        // fields.
        // TODO(stephen, pablo): Implement better dirty checking so that we
        // don't have to guess.
        if (customFieldIds.length === 0 && fieldOrderChanged) {
          const seriesOrderUnmodified = oldSelectedFields.every(
            (fieldId, idx) => prevFieldIds[idx] === fieldId,
          );
          if (seriesOrderUnmodified) {
            newSpec = newSpec.updateVisualizationSettings(
              viewType,
              vizSettings =>
                vizSettings.seriesSettings(
                  vizSettings.seriesSettings().seriesOrder(newFieldIds),
                ),
            );
          }
        }

        // some of the current fields may have changed labels, so we
        // need to update them as well
        newSpec = Object.keys(changedLabels).reduce(
          (currSpec, fieldId) =>
            currSpec.updateSeriesObjectValue(
              viewType,
              fieldId,
              'label',
              changedLabels[fieldId],
            ),
          newSpec,
        );

        newSpec = Object.keys(changedNoDataValueToZero).reduce(
          (currSpec, fieldId) =>
            currSpec.updateSeriesObjectValue(
              viewType,
              fieldId,
              'nullValueDisplay',
              changedNoDataValueToZero[fieldId]
                ? ZERO_DISPLAY_VALUE
                : NO_DATA_DISPLAY_VALUE,
            ),
          newSpec,
        );
        return newSpec;
      },
      this._,
    );
  }

  /**
   * The query selections will change when editing a field to (or to not)
   * display 'no data results as zero'. If this field is used in a custom
   * calculated field, then we need to update the custom field's formula
   * metadata to reflect this change.
   */
  updateCustomFieldsFromNewFields(
    newFields: $ReadOnlyArray<Field>,
    prevFields: $ReadOnlyArray<Field>,
  ): Zen.Model<QueryResultSpec> {
    const prevCustomFields = this._.customFields();
    if (prevCustomFields.length === 0 || newFields === prevFields) {
      return this._;
    }

    return this._.customFields(
      prevCustomFields.map(customField => {
        const fieldConfigurations = customField
          .formula()
          .metadata()
          .fieldConfigurations();
        return customField
          .deepUpdate()
          .formula()
          .metadata()
          .fieldConfigurations(
            fieldConfigurations.map(fieldConfig => {
              const configId = fieldConfig.fieldId;
              const field = newFields.find(f => f.id() === configId);
              if (field) {
                return {
                  ...fieldConfig,
                  treatNoDataAsZero: field.showNullAsZero(),
                };
              }
              return fieldConfig;
            }),
          );
      }),
    );
  }

  /**
   * Sometimes (e.g. when editing a query in a dashboard) the underlying
   * query selections will change, so we need to update the dataFilters to
   * remove any references to the removed fields.
   */
  updateDataFiltersFromNewFields(
    newFields: $ReadOnlyArray<Field>,
    prevFields: $ReadOnlyArray<Field>,
  ): Zen.Model<QueryResultSpec> {
    const newIds = new Set(newFields.map(f => f.get('id')));
    const removedIds = new Set(
      prevFields.map(f => f.get('id')).filter(id => !newIds.has(id)),
    );
    if (removedIds.size === 0) {
      return this._;
    }

    const newDataFilters = this._.dataFilters().removeFiltersForFields(
      removedIds,
    );
    return this._.dataFilters(newDataFilters);
  }

  updateTitleSettingValue(
    settingKey: string,
    settingValue: any,
  ): Zen.Model<QueryResultSpec> {
    return this.deepUpdate()
      .titleSettings()
      [settingKey](settingValue);
  }

  updateVisualizationSettings(
    viewType: ResultViewType,
    updaterFn: VisualizationSettings => VisualizationSettings,
  ): Zen.Model<QueryResultSpec> {
    const newVisualizationSettings = update(this._.visualizationSettings(), {
      [(viewType: any)]: { $apply: updaterFn },
    });
    return this._.visualizationSettings(newVisualizationSettings);
  }

  updateAxisValue(
    viewType: ResultViewType,
    axisType: string,
    settingKey: string,
    settingValue: any,
  ): Zen.Model<QueryResultSpec> {
    return this.updateVisualizationSettings(viewType, vizSettings =>
      vizSettings
        .deepUpdate()
        .axesSettings()
        [axisType]()
        [settingKey](settingValue),
    );
  }

  updateGlobalSeriesObjectValue<K: Zen.SettableValueKeys<QueryResultSeries>>(
    seriesId: string,
    settingType: K,
    // $FlowIssue[incompatible-type] this is safe
    settingValue: Zen.SettableValueType<QueryResultSeries, K>,
  ): Zen.Model<QueryResultSpec> {
    let newSpec = this._;

    if (settingType === 'label' && typeof settingValue === 'string') {
      // if we are globally updating the series label, then we need to check
      // if this id matches any custom calculations, and if so, update the
      // custom calculation label too
      const customFieldToEdit = newSpec
        .customFields()
        .find(f => f.id() === seriesId);
      if (customFieldToEdit) {
        newSpec = this.changeExistingCustomField(
          customFieldToEdit,
          customFieldToEdit.label(settingValue),
        );
      }

      // We still need to check if any custom fields depended on the
      // changed field, because then we'd have to update the contained
      // label so that their formulae can still render with the correct
      // labels in the custom calculations modal
      newSpec = newSpec.customFields(
        newSpec
          .customFields()
          .map(customField =>
            customField.updateInternalFieldLabel(seriesId, settingValue),
          ),
      );
    }

    return newSpec._.viewTypes().reduce(
      (spec, viewType) =>
        spec.updateSeriesObjectValue(
          viewType,
          seriesId,
          settingType,
          settingValue,
        ),
      newSpec,
    );
  }

  updateSeriesObjectValue<K: Zen.SettableValueKeys<QueryResultSeries>>(
    viewType: ResultViewType,
    seriesId: string,
    settingType: K,
    settingValue: Zen.SettableValueType<QueryResultSeries, K>,
  ): Zen.Model<QueryResultSpec> {
    return this.updateVisualizationSettings(viewType, vizSettings => {
      // $FlowFixMe[incompatible-call] - fix when ViewSpecificSettingsUnion has better type support
      const viewSpecificSettings = vizSettings.viewSpecificSettings();
      const seriesSettings = vizSettings
        .seriesSettings()
        .updateSeries(seriesId, settingType, settingValue);
      return vizSettings
        .seriesSettings(seriesSettings)
        .viewSpecificSettings(
          viewSpecificSettings.updateFromNewSeriesSettings(seriesSettings),
        );
    });
  }

  updateLegendSettingValue(
    viewType: ResultViewType,
    settingKey: string,
    settingValue: any,
  ): Zen.Model<QueryResultSpec> {
    return this.updateVisualizationSettings(viewType, vizSettings =>
      vizSettings
        .deepUpdate()
        .legendSettings()
        [settingKey](settingValue),
    );
  }

  updateVisualizationControlValue(
    viewType: ResultViewType,
    controlKey: string,
    value: any,
  ): Zen.Model<QueryResultSpec> {
    return this.updateVisualizationSettings(viewType, vizSettings =>
      vizSettings.updateVisualizationControlValue(controlKey, value),
    );
  }

  updateSeriesOrder(
    viewType: ResultViewType,
    newSeriesOrder: $ReadOnlyArray<string>,
  ): Zen.Model<QueryResultSpec> {
    return this.updateVisualizationSettings(viewType, vizSettings =>
      vizSettings.seriesSettings(
        vizSettings.seriesSettings().seriesOrder(newSeriesOrder),
      ),
    );
  }

  updateDataActionRules(
    viewType: ResultViewType,
    dataActionRules: Zen.Array<DataActionRule>,
  ): Zen.Model<QueryResultSpec> {
    return this.updateVisualizationSettings(viewType, vizSettings =>
      vizSettings.seriesSettings(
        vizSettings.seriesSettings().dataActionRules(dataActionRules),
      ),
    );
  }

  addNewCustomField(customField: CustomField): Zen.Model<QueryResultSpec> {
    const { id, label } = customField.modelValues();
    const newCustomFields = this._.customFields().concat(customField);
    const newSpec = this._.customFields(newCustomFields);

    // add the new custom field to the Series Settings for all view types
    return this._.viewTypes().reduce(
      (spec, viewType) => spec.addNewSeries(viewType, id, label, false),
      newSpec,
    );
  }

  changeExistingCustomField(
    previousField: CustomField,
    editedField: CustomField,
  ): Zen.Model<QueryResultSpec> {
    const index = this._.customFields().findIndex(
      field => field === previousField,
    );

    const customFields = [...this._.customFields()];
    customFields.splice(index, 1, editedField);
    return this._.customFields(customFields);
  }

  removeExistingCustomField(
    customField: CustomField,
  ): Zen.Model<QueryResultSpec> {
    const id = customField.id();
    const customFields = this._.customFields().filter(f => f.id() !== id);
    let newSpec = this._.customFields(customFields);

    // remove any filters that apply to this custom field
    newSpec = newSpec.dataFilters(
      newSpec.dataFilters().removeFiltersForField(id),
    );

    // remove the custom field from the Series Settings for all view types
    return this._.viewTypes().reduce(
      (spec, viewType) => spec.removeSeries(viewType, id),
      newSpec,
    );
  }

  addNewSeries(
    viewType: ResultViewType,
    id: string,
    label: string,
    noDataValueToZero: boolean,
  ): Zen.Model<QueryResultSpec> {
    return this.updateVisualizationSettings(viewType, vizSettings => {
      // $FlowFixMe[incompatible-call] - fix when ViewSpecificSettingsUnion has better type support
      const viewSpecificSettings = vizSettings.viewSpecificSettings();
      const seriesSettings = vizSettings
        .seriesSettings()
        .addNewSeries(id, label, noDataValueToZero);

      return vizSettings
        .seriesSettings(seriesSettings)
        .viewSpecificSettings(
          viewSpecificSettings.updateFromNewSeriesSettings(seriesSettings),
        );
    });
  }

  removeSeries(
    viewType: ResultViewType,
    id: string,
  ): Zen.Model<QueryResultSpec> {
    return this.updateVisualizationSettings(viewType, vizSettings => {
      // $FlowFixMe[incompatible-call] - fix when ViewSpecificSettingsUnion has better type support
      const viewSpecificSettings = vizSettings.viewSpecificSettings();
      const seriesSettings = vizSettings.seriesSettings().removeSeries(id);
      return vizSettings
        .seriesSettings(seriesSettings)
        .viewSpecificSettings(
          viewSpecificSettings.updateFromNewSeriesSettings(seriesSettings),
        );
    });
  }

  serialize(): SerializedQueryResultSpec {
    return {
      customFields: Zen.serializeArray(this._.customFields()),
      dataFilters: this._.dataFilters().serialize(),
      groupBySettings: this._.groupBySettings().serialize(),
      titleSettings: this._.titleSettings().serialize(),
      viewTypes: this._.viewTypes(),
      visualizationSettings: Zen.serializeMap(this._.visualizationSettings()),
    };
  }

  getVisualizationControls<ViewType: ResultViewType>(
    viewType: ViewType,
  ): ViewSpecificSettings<ViewType> &
    IViewSpecificSettings<ViewSpecificSettings<ViewType>> {
    // $FlowFixMe[incompatible-call] - fix when ViewSpecificSettingsUnion has better type support
    return this._.visualizationSettings()[viewType].viewSpecificSettings();
  }

  /**
   * Each field has a configuration that determines what to display on a
   * visualization when encountering a null value. This function is responsible
   * for checking if the configuration has changed for any field between the
   * old version of the query result spec, and the current version.
   *
   * NOTE(nina): However, we only care about changing values if custom fields
   * have been created from the query. This is because custom fields need
   * to recalculate their formula if the display for null values have
   * changed. This allows them to properly convert null values to 0 (if
   * necessary) or just treat them as null values, when dealing with data
   * from non-custom fields. Thus, when the null value display has changed,
   * shouldRebuildQueryResult() will get triggered and the custom calculations
   * will update as well. In the future, we might reasonably extend this to
   * other cases.
   */
  nullValueDisplayHasChanged(
    prevSpec: Zen.Model<QueryResultSpec>,
    viewType: ResultViewType,
  ): boolean {
    const newCustomFields = this._.customFields();
    const prevCustomFields = prevSpec.customFields();
    const newSeriesSettings = this._.visualizationSettings()[
      viewType
    ].seriesSettings();
    const prevSeriesSettings = prevSpec
      .visualizationSettings()
      [viewType].seriesSettings();

    // If there are no custom fields, then the value shouldn't be tracked
    if (newCustomFields.length === 0) {
      return false;
    }

    // If there are new custom fields, then the value has inherently changed
    if (prevCustomFields.length === 0) {
      return true;
    }

    return Object.keys(newSeriesSettings.seriesObjects()).some(fieldId => {
      const newSeriesObject = newSeriesSettings.getSeriesObject(fieldId);
      const prevSeriesObject = prevSeriesSettings.getSeriesObject(fieldId);

      // True if we are encountering a new field, or the nullValueDisplay
      // properties are different. Otherwise false.
      return (
        newSeriesObject &&
        (!prevSeriesObject ||
          newSeriesObject.nullValueDisplay() !==
            prevSeriesObject.nullValueDisplay())
      );
    });
  }
}

export default ((QueryResultSpec: $Cast): Class<Zen.Model<QueryResultSpec>>);
