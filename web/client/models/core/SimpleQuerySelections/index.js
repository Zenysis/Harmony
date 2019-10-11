// @flow
import update from 'immutability-helper';

import * as Zen from 'lib/Zen';
import Field from 'models/core/Field';
import QuerySelectionFilter from 'models/core/SimpleQuerySelections/QuerySelectionFilter';
import ZenModelUtil from 'util/ZenModel/ZenModelUtil';
// eslint-disable-next-line import/extensions
import { SELECT_GRANULARITY_DEFAULT_LEVEL } from 'backend_config.js';
import {
  computeEnabledDimensions,
  computeFieldsByType,
  computeLegacyFilterObject,
  computeLegacySelectionsObject,
} from 'models/core/SimpleQuerySelections/derivedComputations';
import { computeRelativeDate } from 'components/QueryApp/QueryForm/SelectRelativeDate';
import { getDefaultDateRange } from 'util/dateUtil';
import { pick } from 'util/util';
// TODO(stephen, pablo): Relocate this import to a better place.
import type { DateType } from 'components/QueryApp/QueryForm/SelectDatesContainer';
import type { Serializable } from 'lib/Zen';

const DEFAULT_DATE_RANGE = getDefaultDateRange();
const DEFAULT_DATE_TYPE = window.__JSON_FROM_BACKEND.ui.defaultDatePickerType;
const FORECAST_DATE_TYPE = 'FORECAST';
const DROPDOWN_COMPONENTS =
  window.__JSON_FROM_BACKEND.indicatorSelectionDropdowns || [];

type SerializedLegacyQuerySelections = {
  dateType: DateType,
  denominator: string | null,
  endDate: string,
  fields: Array<string>,
  filters: {
    [filterType: string]: Zen.Serialized<QuerySelectionFilter>,
  },
  granularity: string,
  startDate: string,
};

type Values = {
  /**
   * The date range type selected. E.g. "Custom", "Forecast", etc.
   */
  dateType: DateType,

  /**
   * The denominator field that will be used to divide all other queried
   * fields. This is useful, for example, if we ever wanted to divide health
   * indicators by population sizes in order to query for incidence rates
   * instead of absolute numbers.
   */
  denominator: Field | void,

  /**
   * The end date for our query. All results will be within the
   * [startDate, endDate] range.
   */
  endDate: string,

  /**
   * All fields that we will be requested for in the backend. This is the
   * union of all indicators: health indicators, targets, partners, etc.
   */
  fields: Array<Field>,

  /**
   * Any filters we want to apply to the data. Note that these are *backend*
   * filters and its executed when the query is processed. This is different
   * to filters we apply on the frontend *after* query data has returned.
   * Those filters are held in QueryResultSpec, not in QuerySelections.
   */
  // TODO(pablo): this should never store undefineds. The only
  // reason this happens is because SelectFilter sets values to
  // `undefined` when a filter is cleared, instead of removing it from
  // the map altogether. This needs to be refactored.
  filters: { +[filterType: string]: QuerySelectionFilter | void },

  /**
   * The level of aggregation we want to apply to the data. E.g. aggregate
   * all data by "Region"
   */
  granularity: string,

  /**
   * The end date for our query. All results will be within the
   * [startDate, endDate] range.
   */
  startDate: string,
};

type DerivedValues = {
  /**
   * Dimensions that we can filter/display by for the user's given set of
   * indicators.
   */
  enabledDimensions: $ReadOnlySet<string>,

  /**
   * A convenience transformation of our `fields` array to a
   * mapping of fieldType => Array<Field>
   */
  fieldsByType: { [fieldType: string]: Array<Field> },

  /**
   * HACK(pablo, stephen): Certain visualizations and settings require the
   * pre-ZenModel QuerySelections object to operate. Use a derived value to
   * avoid recreating the legacy object each time.
   */
  // TODO(pablo, stephen): remove this once all visualizations & settings are
  // updated to never need the legacy objects to operate
  // TODO(pablo): also this is no different than just calling .serialize(), so
  // we can remove this already
  legacySelections: SerializedLegacyQuerySelections,

  /**
   * HACK(pablo, stephen): Certain visualizations and settings require the
   * pre-ZenModel QuerySelectionFilter object to operate. Use a derived value to
   * avoid recreating the legacy object each time.
   */
  // TODO(pablo, stephen): remove this once all visualizations & settings are
  // updated to never need the legacy objects to operate
  legacyFilters: {
    [filterType: string]: Zen.Serialized<QuerySelectionFilter>,
  },
};

/**
 * QuerySelections is a representation of a query request that is made to the
 * backend.
 * For example, any selections that are made in our main Query Form
 * will be stored in a QuerySelections model. These selections are what
 * is requested from the backend.
 */
class SimpleQuerySelections
  extends Zen.BaseModel<SimpleQuerySelections, {}, Values, DerivedValues>
  implements Serializable<SerializedLegacyQuerySelections> {
  static defaultValues = {
    dateType: DEFAULT_DATE_TYPE,
    denominator: undefined,
    endDate: DEFAULT_DATE_RANGE.endDate,
    fields: [],
    filters: {},
    granularity: SELECT_GRANULARITY_DEFAULT_LEVEL,
    startDate: DEFAULT_DATE_RANGE.startDate,
  };

  static derivedConfig = {
    enabledDimensions: [
      Zen.hasChanged<SimpleQuerySelections>('fields'),
      computeEnabledDimensions,
    ],
    fieldsByType: [
      Zen.hasChanged<SimpleQuerySelections>('fields'),
      computeFieldsByType,
    ],
    legacySelections: [
      (prev, curr) => prev !== curr,
      computeLegacySelectionsObject,
    ],
    legacyFilters: [(prev, curr) => prev !== curr, computeLegacyFilterObject],
  };

  static fromLegacyObject(
    legacyObject: SerializedLegacyQuerySelections,
  ): Zen.Model<SimpleQuerySelections> {
    const {
      dateType,
      startDate,
      endDate,
      filters,
      granularity,
      denominator,
      fields,
    } = legacyObject;
    const filtersArray = Object.keys(filters).map(filterType =>
      QuerySelectionFilter.deserialize(filters[filterType], {
        filterType,
      }),
    );

    const fieldTypes = Object.values(Field.Types);
    fieldTypes.splice(fieldTypes.indexOf(Field.Types.FIELD), 1);
    const fieldArrayObject = pick(legacyObject, fieldTypes);
    const idToTypeLookup = {};
    Object.keys(fieldArrayObject).forEach(type => {
      fieldArrayObject[type].forEach(id => {
        idToTypeLookup[id] = type;
      });
    });
    const allFields = fields.map(id => {
      const type = idToTypeLookup[id] || Field.Types.FIELD;
      return Field.create({ id, type });
    });

    return SimpleQuerySelections.create({
      dateType,
      endDate,
      granularity,
      startDate,
      denominator: denominator ? Field.create(denominator) : undefined,
      fields: allFields,
      filters: ZenModelUtil.modelArrayToObject(filtersArray, 'type'),
    });
  }

  /**
   * This function updates a SimpleQuerySelections' fields AND a bunch of
   * other information that might change as a result of it (e.g. dateType,
   * startDate, adding a few extra hidden fields, etc.). Use this function
   * to update fields, instead of calling `.fields()` directly.
   */
  updateFields(
    fields: $ReadOnlyArray<Field>,
  ): Zen.Model<SimpleQuerySelections> {
    const selectedFields = fields.filter(field => !!field.type());
    const fieldsMap = ZenModelUtil.modelArrayToObject(selectedFields, 'id');
    let newModel = this;

    // if a user has selected any forecast fields, we need to make
    // some more changes, such as getting the hidden fields based
    // off of the selected forecast fields
    const forecastFields = selectedFields.filter(f =>
      Field.isForecastId(f.id()),
    );

    if (forecastFields.length > 0) {
      // Automatically choose the forecast date range
      const { startDate, endDate } = computeRelativeDate('FORECAST');

      // For all forecast fields: add the corresponding parent indicator value.
      // NOTE: We could also handle this trivially in geo_time_aggregator
      // by checking if the indicator is in FORECAST_GROUP.
      // Also add the forecast error
      forecastFields.forEach(field => {
        const fieldId = field.id();
        const parentFieldId = fieldId.replace('forecast_', '');
        const forecastErrorId = fieldId.replace('forecast_', 'forecast_error_');
        if (!(parentFieldId in fieldsMap)) {
          fieldsMap[parentFieldId] = Field.create({
            id: parentFieldId,
            type: Field.Types.FORECAST_DEPENDENCY,
          });
        }
        if (!(forecastErrorId in fieldsMap)) {
          fieldsMap[forecastErrorId] = Field.create({
            id: forecastErrorId,
            type: Field.Types.FORECAST_DEPENDENCY,
          });
        }
      });

      newModel = newModel.modelValues({
        startDate,
        endDate,
        dateType: FORECAST_DATE_TYPE,
      });
    } else {
      // No forecast fields are set. Remove any additional fields added to
      // support a previously added forecast field.
      const forecastDependentFields = this.getFieldsByType(
        Field.Types.FORECAST_DEPENDENCY,
      );

      if (forecastDependentFields) {
        forecastDependentFields.forEach(field => {
          delete fieldsMap[field.id()];
        });
      }

      // If no forecast fields are set but the date type is still set to
      // "forecast", reset it to the default date to avoid confusing the user.
      if (this._.dateType() === FORECAST_DATE_TYPE) {
        newModel = newModel.modelValues({
          startDate: DEFAULT_DATE_RANGE.startDate,
          endDate: DEFAULT_DATE_RANGE.endDate,
          dateType: DEFAULT_DATE_TYPE,
        });
      }
    }

    const fieldsArray = Object.keys(fieldsMap).map(
      fieldId => fieldsMap[fieldId],
    );
    newModel = newModel._.fields(fieldsArray);

    const enabledDimensions = newModel.enabledDimensions();

    // If the set is not full (5) then use the granularity of the
    // first element as default, to avoid selecting the facility
    // when it becomes available. If nothing is selected
    // (enabledDimensions.size = 0) then don't change anything.
    if (enabledDimensions.size > 0 && enabledDimensions.size < 5) {
      const granularity = enabledDimensions.values().next().value;
      newModel = newModel._.granularity(granularity);
    }

    return newModel;
  }

  getFieldsByType(fieldType: string): Array<Field> {
    const fields = this._.fieldsByType()[fieldType];
    return fields || [];
  }

  getFilter(filterType: string): QuerySelectionFilter | void {
    return this._.filters()[filterType];
  }

  validFieldsSelected(): boolean {
    // Check to see if one or more indicators have been selected.
    return DROPDOWN_COMPONENTS.some(component => {
      const selectedFields = this.getFieldsByType(component.selectionType);
      return selectedFields ? selectedFields.length > 0 : false;
    });
  }

  startDateBeforeEndDate(): boolean {
    return this._.startDate() < this._.endDate();
  }

  setFilter(
    filterType: string,
    filter: QuerySelectionFilter,
  ): Zen.Model<SimpleQuerySelections> {
    const newFilters = update(this._.filters(), {
      [filterType]: { $set: filter },
    });
    return this._.filters(newFilters);
  }

  serialize(): SerializedLegacyQuerySelections {
    return this._.legacySelections();
  }
}

export default ((SimpleQuerySelections: any): Class<
  Zen.Model<SimpleQuerySelections>,
>);
