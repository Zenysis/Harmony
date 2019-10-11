// @flow
import invariant from 'invariant';
import update from 'immutability-helper';

import * as Zen from 'lib/Zen';
import CustomField from 'models/core/Field/CustomField';
import DashboardItemSettings from 'models/core/Dashboard/DashboardSpecification/DashboardItemSettings';
import Field from 'models/core/Field';
import GroupBySettings from 'models/core/QueryResultSpec/GroupBySettings';
import QuerySelections from 'models/core/wip/QuerySelections';
import SimpleQuerySelections from 'models/core/SimpleQuerySelections';
import TitleSettings from 'models/core/QueryResultSpec/TitleSettings';
import VisualizationSettings from 'models/core/QueryResultSpec/VisualizationSettings';
import VisualizationSettingsUtil from 'models/core/QueryResultSpec/VisualizationSettings/VisualizationSettingsUtil';
import ZenMap from 'util/ZenModel/ZenMap';
import { AQT_RESULT_VIEW_ORDER } from 'components/AdvancedQueryApp/registry/viewTypes';
import { RESULT_VIEW_ORDER as SQT_RESULT_VIEW_ORDER } from 'components/QueryResult/viewTypes';
import {
  computeColorFilters,
  computeDataFilters,
} from 'models/core/QueryResultSpec/derivedComputations';
import { difference } from 'util/util';
import { getDimensionsForQuery } from 'components/visualizations/common/Query/util';
import type AxesSettings from 'models/core/QueryResultSpec/VisualizationSettings/AxesSettings';
import type ColorFilter from 'models/core/QueryResultSpec/QueryResultFilter/ColorFilter';
import type DataFilter from 'models/core/QueryResultSpec/QueryResultFilter/DataFilter';
import type LegendSettings from 'models/core/QueryResultSpec/VisualizationSettings/LegendSettings';
import type SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';
import type { FieldFilterSelections } from 'components/QueryResult/QueryResultActionButtons/FilterColorModal/types';
import type { ResultViewType } from 'components/QueryResult/viewTypes';
import type { Serializable } from 'lib/Zen';
import type { SerializedCustomField } from 'models/core/Field/CustomField';
import type { SerializedDashboardItemSettings } from 'models/core/Dashboard/DashboardSpecification/DashboardItemSettings';
import type { SerializedDashboardQuery } from 'models/core/Dashboard/DashboardSpecification/RelationalDashboardQuery';

// TODO(pablo): move everything here to use ZenArray and ZenMap, that way we
// can remove the dependency of immutability-helper

type Values = {
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
   * An object mapping a viewType to a VisualizationSettings object.
   * The VisualizationSettings object contains the AxesSettings,
   * SeriesSettings, LegendSettings, and controls used for each visualization
   */
  visualizationSettings: { +[viewType: ResultViewType]: VisualizationSettings },

  /**
   * An array of view types that represent which visualizations this
   * QueryResultSpec can support. A view type is a key that represents
   * a visualization type: ANIMATED_MAP, CHART, etc.
   * All view types are defined in QueryResult/viewTypes.js
   * ... we probably should have named it visualizationType but that just
   * looks too long.
   */
  viewTypes: Zen.ReadOnly<$ReadOnlyArray<ResultViewType>>,
};

type DefaultValues = {
  /**
   * An array with all Custom Fields in this spec.
   */
  customFields: $ReadOnlyArray<CustomField>,

  /**
   * Object mapping fieldId to an object that represents a filter.
   * Filters are created through the Color/Filter modal.
   * TODO(pablo): create DataFilter model to represent frontend filters
   */
  filters: { [fieldId: string]: any },

  /**
   * Object mapping fieldId to an object that represents filter selections
   * from the Color/Filter modal.
   * TODO(pablo): filters code is terrifying and creates separate 'filters'
   * and 'modalFilters' objects that ultimately mean the same thing but
   * serve different purposes and omg this really needs to be refactored
   */
  modalFilters: { [fieldId: string]: FieldFilterSelections },
};

// TODO(pablo): we are currently deriving the `dataFilters` from the
// `modalFilters`. Eventually this should not be the case, and instead
// dataFilters should be stored directly as DataFilter models
// and persisted in that way. That will require a lot of changes to the
// Filter/Color modal to work with DataFilter models, and will involve
// changes to the backend to upgrade dashboard specs to store this data.
type DerivedValues = {
  colorFilters: Zen.Map<ColorFilter>,
  dataFilters: Zen.Map<DataFilter>,
};

export type SerializedLegacySettings = {
  seriesSettings?: Zen.Serialized<SeriesSettings>,
  titleSettings?: Zen.Serialized<TitleSettings>,
  [viewType: ResultViewType]: {
    axesSettings?: Zen.Serialized<AxesSettings>,
    legendSettings?: Zen.Serialized<LegendSettings>,
    viewSpecificSettings?: {},
  },
};
type SerializedVisualizationSettingsMap = {
  +[ResultViewType]: Zen.Serialized<VisualizationSettings>,
};

type SerializedQueryResultSpec = {
  groupBySettings: Zen.Serialized<GroupBySettings>,
  titleSettings: Zen.Serialized<TitleSettings>,
  visualizationSettings: SerializedVisualizationSettingsMap,
  viewTypes: $ReadOnlyArray<ResultViewType>,
  customFields: $ReadOnlyArray<SerializedCustomField>,
  filters: { [string]: any },
  modalFilters: { [fieldId: string]: FieldFilterSelections },
};

// TODO(pablo): there should not be different representations for a
// SerializedQueryResultSpec
export type SerializedQueryResultSpecForDashboard = {
  settings: SerializedDashboardItemSettings,
  filters: { [string]: any },
  modalFilters: { [string]: FieldFilterSelections },
  customFields: Array<SerializedCustomField>,
};

const RESULT_VIEW_ORDER_MAP = {
  AQT: AQT_RESULT_VIEW_ORDER,
  SQT: SQT_RESULT_VIEW_ORDER,
};

/**
 * Deserialize the visualization settings map and ensure the required viewTypes
 * have VisualizationSettings. If a viewType does not have serialized settings,
 * like if a new visualization is added, build the VisualizationSettings from
 * a different viewType's settings.
 */
function deserializeVisualizationSettingsMap(
  serializedObj: SerializedVisualizationSettingsMap,
  viewTypes: $ReadOnlyArray<ResultViewType>,
  groupBySettings: GroupBySettings,
  currentViewType: ResultViewType | void = undefined,
): { +[ResultViewType]: VisualizationSettings } {
  const vizSettings = {};
  const missingViewSettings = [];
  viewTypes.forEach((viewType: ResultViewType) => {
    const viewSettings = serializedObj[viewType];
    // It is possible for serialized settings to be missing because a new
    // ResultViewType was added.
    if (viewSettings === undefined) {
      missingViewSettings.push(viewType);
      return;
    }

    vizSettings[viewType] = VisualizationSettings.deserialize(
      {
        seriesSettings: viewSettings.seriesSettings,
        axesSettings: viewSettings.axesSettings,
        legendSettings: viewSettings.legendSettings,
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
 * It does NOT hold the selections that were sent to the backend in order
 * to produce this result (e.g. the queried fields, date selections,
 * grouping dimensions, etc.). That information is held in a
 * SimpleQuerySelections model.
 *
 * The QuerySelections model is intentionally kept separate from the
 * QueryResultSpec because there are many ways to select a query (e.g.
 * Simple query selections, Advanced query selections), but they all end
 * up producing a QueryResultSpec on the frontend.
 *
 * Note that a single QueryResultSpec can represent *multiple* visualizations.
 */
class QueryResultSpec
  extends Zen.BaseModel<QueryResultSpec, Values, DefaultValues, DerivedValues>
  implements Serializable<SerializedQueryResultSpec> {
  static defaultValues = {
    customFields: [],
    filters: {},
    modalFilters: {},
  };

  static derivedConfig = {
    colorFilters: [
      Zen.hasChanged<QueryResultSpec>('modalFilters'),
      computeColorFilters,
    ],
    dataFilters: [
      Zen.hasChanged<QueryResultSpec>('modalFilters'),
      computeDataFilters,
    ],
  };

  static fromQuerySelections(
    viewTypes: $ReadOnlyArray<ResultViewType>,
    querySelections: QuerySelections,
    smallMode: boolean = false,
  ): Zen.Model<QueryResultSpec> {
    const { fields, groups } = querySelections.modelValues();
    const legacyFields: Array<Field> = fields.mapValues(f => f.legacyField());
    const titleSettings = TitleSettings.fromFields(legacyFields);
    const groupBySettings = GroupBySettings.fromGroupingItems(groups);

    // set up visualization settings
    const groupings = groupBySettings.groupings().zenValues();
    const visualizationSettings = {};
    viewTypes.forEach(viewType => {
      visualizationSettings[viewType] = VisualizationSettingsUtil.fromViewType(
        viewType,
        legacyFields,
        groupings,
        smallMode,
      );
    });

    return QueryResultSpec.create({
      viewTypes,
      groupBySettings,
      titleSettings,
      visualizationSettings,
    });
  }

  static fromSimpleQuerySelections(
    viewTypes: $ReadOnlyArray<ResultViewType>,
    simpleQuerySelections: SimpleQuerySelections,
    smallMode: boolean = false,
  ): Zen.Model<QueryResultSpec> {
    const {
      denominator,
      fields,
      granularity,
    } = simpleQuerySelections.modelValues();
    const titleSettings = TitleSettings.fromFields(fields, denominator);

    // Use the same method SQT uses to build the dimensions being queried.
    const groupBySettings = GroupBySettings.fromSimpleQueryGroupings(
      getDimensionsForQuery(simpleQuerySelections),
    );

    // set up visualization settings
    const groupings = Zen.Array.create([
      groupBySettings.groupings().forceGet(granularity),
    ]);
    const visualizationSettings = {};
    viewTypes.forEach(viewType => {
      visualizationSettings[viewType] = VisualizationSettingsUtil.fromViewType(
        viewType,
        fields,
        groupings,
        smallMode,
      );
    });

    return QueryResultSpec.create({
      viewTypes,
      groupBySettings,
      titleSettings,
      visualizationSettings,
    });
  }

  static deserialize(
    serializedObj: SerializedQueryResultSpec,
  ): Zen.Model<QueryResultSpec> {
    const {
      customFields,
      filters,
      modalFilters,
      titleSettings,
      viewTypes,
      visualizationSettings,
    } = serializedObj;

    const groupBySettings = GroupBySettings.deserialize(
      serializedObj.groupBySettings,
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
      filters,
      groupBySettings,
      modalFilters,
      viewTypes,
      customFields: Zen.deserializeArray(CustomField, customFields, {
        seriesSettings: seriesSettingsSample,
      }),
      titleSettings: deserializedTitleSettings,
      visualizationSettings: vizSettings,
    });
  }

  // TODO(vedant) - This can be built directly from a DashboardItem. Refactor
  // this method.
  static deserializeFromDashboard(
    serializedObj: {
      query: SerializedDashboardQuery,
      settings: SerializedDashboardItemSettings,
    },
    extraConfig: { isAdvancedQueryItem: boolean },
  ): Zen.Model<QueryResultSpec> {
    const { isAdvancedQueryItem } = extraConfig;
    const viewTypes = isAdvancedQueryItem
      ? RESULT_VIEW_ORDER_MAP.AQT
      : RESULT_VIEW_ORDER_MAP.SQT;

    const { settings, query } = serializedObj;
    const customFields = query.customFields || [];
    const frontendSelectionsFilter = query.frontendSelectionsFilter || {};
    const filterModalSelections = query.filterModalSelections || {};

    // a query result in a dashboard spec has the series settings separated
    // from the viz settings. We need to structure the viz settings to mirror
    // the VisualizationSettings model before passing them to the create
    // function
    const { titleSettings } = settings;
    const groupBySettings = GroupBySettings.deserialize(
      settings.groupBySettings,
    );
    const visualizationSettings = deserializeVisualizationSettingsMap(
      settings.viewTypeSettings,
      viewTypes,
      groupBySettings,
      query.type,
    );

    // TODO(pablo): this deserialization only works for Custom Fields that do
    // not depend on other Custom Fields. For an array of Custom Fields,
    // there may be some dependencies, which means we need to deserialize the
    // entire array by first topological sorting in order to first deserialize
    // the fields that others depend on.
    // NOTE(stephen): Need to access the current visible series settings so that
    // we can semi-accurately instantiate the custom fields. This is necessary
    // since CustomField has a dependency on full Field models. When that
    // dependency is broken, we can remove this.
    const customFieldModels = Zen.deserializeArray(CustomField, customFields, {
      seriesSettings: visualizationSettings[query.type].seriesSettings(),
    });

    return QueryResultSpec.create({
      groupBySettings,
      viewTypes,
      visualizationSettings,
      customFields: customFieldModels,
      titleSettings: TitleSettings.deserialize(titleSettings),
      filters: frontendSelectionsFilter,
      modalFilters: filterModalSelections,
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

  // TODO(pablo): remove the usage of `any` from here
  getVisualizationControls(viewType: ResultViewType): any {
    return this._.visualizationSettings()[viewType].viewSpecificSettings();
  }

  updateSpecFromNewSimpleQuerySelections(
    newSelections: SimpleQuerySelections,
    oldSelections: SimpleQuerySelections,
  ): Zen.Model<QueryResultSpec> {
    const newGroupBySettings = GroupBySettings.fromSimpleQueryGroupings(
      getDimensionsForQuery(oldSelections),
    );
    const newFields = newSelections.fields();
    const prevFields = oldSelections.fields();
    return this.updateSeriesSettingsFromNewFields(
      newFields,
      prevFields,
    ).groupBySettings(newGroupBySettings);
  }

  updateSpecFromNewQuerySelections(
    newSelections: QuerySelections,
    oldSelections: QuerySelections,
  ): Zen.Model<QueryResultSpec> {
    const newGroupBySettings = GroupBySettings.fromGroupingItems(
      newSelections.groups(),
    );

    const newFields = newSelections.fields();
    const prevFields = oldSelections.fields();
    let newQueryResultSpec = this.updateSeriesSettingsFromNewFields(
      newFields.mapValues(f => f.legacyField()),
      prevFields.mapValues(f => f.legacyField()),
    ).groupBySettings(newGroupBySettings);

    // Try to determine if the user has customized the title by comparing the
    // previous first field's label to the current title stored in the spec.
    // If they are the same, assume the user has not customized the title and
    // update the title to match the new first field's label.
    // TODO(pablo, stephen): this is not the ideal way of checking and we
    // should figure out how to keep track of a dirty bit or some flag that
    // determines if the user has edited things.
    const titleSettings = newQueryResultSpec.titleSettings();
    const prevFirstFieldLabel = prevFields.get(0).label();
    const newFirstFieldLabel = newFields.get(0).label();
    if (
      titleSettings.title() === prevFirstFieldLabel &&
      newFirstFieldLabel !== prevFirstFieldLabel
    ) {
      newQueryResultSpec = newQueryResultSpec.titleSettings(
        titleSettings.title(newFirstFieldLabel),
      );
    }
    return newQueryResultSpec;
  }

  /**
   * Sometimes (e.g. when editing a query in a dashboard) the underlying
   * query selections will change, but we need to update the queryResultSpec
   * *without* recreating it from scratch (so that other settings don't get
   * reset).
   * This function handles finding which fields were added and removed, and
   * specifically updating the SeriesSettings to handle those fields.
   *
   * TODO(pablo): its possible that the query selection's granularities may
   * have updated too. Instead of just a function to update series settings,
   * we should have a more general function to update from a new QuerySelections
   * model: e.g. `updateFromNewQuerySelections`
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
    prevFields.forEach(field => {
      prevLabels[field.id()] = field.label();
    });
    newFields.forEach(field => {
      const fieldId = field.id();
      const fieldLabel = field.label();
      if (prevLabels[fieldId] && prevLabels[fieldId] !== fieldLabel) {
        changedLabels[fieldId] = fieldLabel;
      }
    });

    const customFieldIds = Field.pullIds(this._.customFields());
    const newFieldIds = Field.pullIds(newFields);
    const prevFieldIds = Field.pullIds(prevFields);
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
            const field = newFields.find(f => f.id() === id);
            if (field) {
              newSpec = newSpec.addNewSeries(viewType, id, field.label());
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
            newSpec = newSpec._updateVisualizationSettings(
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
        return newSpec;
      },
      this._,
    );
  }

  updateTitleSettingValue(
    settingKey: string,
    settingValue: any,
  ): Zen.Model<QueryResultSpec> {
    return this.deepUpdate()
      .titleSettings()
      [settingKey](settingValue);
  }

  _updateVisualizationSettings(
    viewType: ResultViewType,
    updaterFn: VisualizationSettings => VisualizationSettings,
  ): Zen.Model<QueryResultSpec> {
    const newVisualizationSettings = update(this._.visualizationSettings(), {
      [viewType]: { $apply: updaterFn },
    });
    return this._.visualizationSettings(newVisualizationSettings);
  }

  updateAxisValue(
    viewType: ResultViewType,
    axisType: string,
    settingKey: string,
    settingValue: any,
  ): Zen.Model<QueryResultSpec> {
    return this._updateVisualizationSettings(viewType, vizSettings =>
      vizSettings
        .deepUpdate()
        .axesSettings()
        [axisType]()
        [settingKey](settingValue),
    );
  }

  updateGlobalSeriesObjectValue(
    seriesId: string,
    settingType: string,
    settingValue: any,
  ): Zen.Model<QueryResultSpec> {
    return this._.viewTypes().reduce(
      (spec, viewType) =>
        spec.updateSeriesObjectValue(
          viewType,
          seriesId,
          settingType,
          settingValue,
        ),
      this._,
    );
  }

  updateSeriesObjectValue(
    viewType: ResultViewType,
    seriesId: string,
    settingType: string,
    settingValue: any,
  ): Zen.Model<QueryResultSpec> {
    return this._updateVisualizationSettings(viewType, vizSettings =>
      vizSettings.seriesSettings(
        vizSettings
          .seriesSettings()
          .updateSeries(seriesId, settingType, settingValue),
      ),
    );
  }

  updateLegendSettingValue(
    viewType: ResultViewType,
    settingKey: string,
    settingValue: any,
  ): Zen.Model<QueryResultSpec> {
    return this._updateVisualizationSettings(viewType, vizSettings =>
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
    return this._updateVisualizationSettings(viewType, vizSettings =>
      vizSettings.updateVisualizationControlValue(controlKey, value),
    );
  }

  moveSeriesToNewIndex(
    viewType: ResultViewType,
    seriesId: string,
    newIndex: number,
  ): Zen.Model<QueryResultSpec> {
    return this._updateVisualizationSettings(viewType, vizSettings =>
      vizSettings.seriesSettings(
        vizSettings.seriesSettings().moveSeriesToNewIndex(seriesId, newIndex),
      ),
    );
  }

  addNewCustomField(customField: CustomField): Zen.Model<QueryResultSpec> {
    const { id, label } = customField.modelValues();
    const newCustomFields = this._.customFields().concat(customField);
    const newSpec = this._.customFields(newCustomFields);

    // add the new custom field to the Series Settings for all view types
    return this._.viewTypes().reduce(
      (spec, viewType) => spec.addNewSeries(viewType, id, label),
      newSpec,
    );
  }

  changeExistingCustomField(
    previousField: CustomField,
    editedField: CustomField,
  ): Zen.Model<QueryResultSpec> {
    const { id } = previousField.modelValues();
    const { label } = editedField.modelValues();
    const index = this._.customFields().findIndex(
      field => field === previousField,
    );

    const customFields = [...this._.customFields()];
    customFields.splice(index, 1, editedField);
    const newSpec = this._.customFields(customFields);

    // update the edited custom field to the Series Settings for all view types
    return this._.viewTypes().reduce(
      (spec, viewType) => spec.updateSeries(viewType, id, label),
      newSpec,
    );
  }

  removeExistingCustomField(
    customField: CustomField,
  ): Zen.Model<QueryResultSpec> {
    const id = customField.id();
    const customFields = this._.customFields().filter(f => f.id() !== id);
    const newSpec = this._.customFields(customFields);

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
  ): Zen.Model<QueryResultSpec> {
    return this._updateVisualizationSettings(viewType, vizSettings =>
      vizSettings.seriesSettings(
        vizSettings.seriesSettings().addNewSeries(id, label),
      ),
    );
  }

  updateSeries(
    viewType: ResultViewType,
    id: string,
    label: string,
  ): Zen.Model<QueryResultSpec> {
    return this._updateVisualizationSettings(viewType, vizSettings =>
      vizSettings.seriesSettings(
        vizSettings.seriesSettings().updateSeriesFromEdit(id, label),
      ),
    );
  }

  removeSeries(
    viewType: ResultViewType,
    id: string,
  ): Zen.Model<QueryResultSpec> {
    return this._updateVisualizationSettings(viewType, vizSettings =>
      vizSettings.seriesSettings(vizSettings.seriesSettings().removeSeries(id)),
    );
  }

  /**
   * Converts the settings encompassed by this QueryResultSpec into an
   * instance of `DashboardItemSettings` such that they can be persisted to
   * a DashboardSpecification.
   *
   * @returns {DashboardItemSettings} The resulting settings object.
   */
  getSettingsForDashboard(): DashboardItemSettings {
    let viewTypeSettings: ZenMap<VisualizationSettings> = ZenMap.create();
    // add all the settings for each view type
    this._.viewTypes().forEach((viewType: ResultViewType) => {
      const setting: VisualizationSettings = this._.visualizationSettings()[
        viewType
      ];
      viewTypeSettings = viewTypeSettings.set(viewType, setting);
    });
    return DashboardItemSettings.create({
      id: '',
      viewTypeSettings,
      titleSettings: this._.titleSettings(),
      groupBySettings: this._.groupBySettings(),
    });
  }

  serializeForDashboard(): SerializedQueryResultSpecForDashboard {
    return {
      settings: this.getSettingsForDashboard().serialize(),
      filters: { ...this._.filters() },
      modalFilters: { ...this._.modalFilters() },
      customFields: this._.customFields().map(customField =>
        customField.serialize(),
      ),
    };
  }

  serialize(): SerializedQueryResultSpec {
    return {
      groupBySettings: this._.groupBySettings().serialize(),
      titleSettings: this._.titleSettings().serialize(),
      visualizationSettings: Zen.serializeMap(this._.visualizationSettings()),
      viewTypes: this._.viewTypes(),
      customFields: Zen.serializeArray(this._.customFields()),
      filters: this._.filters(),
      modalFilters: this._.modalFilters(),
    };
  }
}

export default ((QueryResultSpec: any): Class<Zen.Model<QueryResultSpec>>);
