import PropTypes from 'prop-types';

import ZenModel, { def, derived, hasChanged } from 'util/ZenModel';
import ZenPropTypes from 'util/ZenPropTypes';
import { fieldIdsToName, IndicatorLookup } from 'indicator_fields';

const TYPES = {
  CUSTOM: 'custom',
  METRIC: 'metric',
  ELMIS: 'elmisIndicators',
  PROPERTY: 'property',
  PARTNER: 'partners',
  HEALTH_INDICATOR: 'healthIndicators',
  TARGETS: 'targets',
  HMIS_DHIS2: 'hmisAnddhis2s',
  DHIS_INDICATOR: 'dhis2Indicators',
  SURVEY: 'surveys',
  SURVEY_DATA: 'surveyData',
  SUPPLY_CHAIN_DATA: 'supplyChainElements',
  EKN_METRIC: 'eknMetrics',
  DHIS2_DATA_ELEMENT: 'dhis2DataElements',
  DHIS2_HMIS_DATA_ELEMENT: 'dhisHmis2DataElements',
  DHIS2_HMIS_DATA_ELEMENT: 'dhisHmisNew2DataElements',
  DHIS2_MRRS_DATA_ELEMENT: 'dhisMrss2DataElements',
  DHIS2_SISCOM_DATA_ELEMENT: 'dhis2SiscomDataElements',
  HMIS_INDICATOR: 'hmisCalculatedIndicators',
  SISCOM_INDICATOR: 'siscomCalculatedIndicators',
  YWG: 'ywgs',
  SEX_WORK: 'sexWorks',
  WCDOH: 'wcdoh',
  FINANCE: 'finances',
  FIELD: 'fields',
  FORECAST_DEPENDENCY: 'forecastDependency',
  CUSTOM_INDICATORS: 'customIndicators',
  VIHAAN: 'vihaanIndicators',
  NACO: 'nacoIndicators',
  CORE: 'coreIndicators',
  CAMPAIGN: 'campaignIndicators',
  MACS: 'macsIndicators',
  MALARIA_SCORECARD: 'malariaScorecardIndicators',
};

/**
 * A Field is our generic way of referring to literally anything that is
 * queryable/representable in a visualization. A Field is the unit of
 * information that our users actually want to ask about.
 * “Total Malaria” is a Field, “Population” is a Field,
 * “HIV incidence” is a field, any custom calculations are fields, etc.
 */
export default class Field extends ZenModel.withTypes({
  id: def(PropTypes.string.isRequired, undefined, ZenModel.PRIVATE),

  canonicalNameMap: def(PropTypes.object, fieldIdsToName, ZenModel.PRIVATE),
  label: def(PropTypes.string, undefined),

  // optional field type if you want to categorize this field
  type: def(PropTypes.oneOf(Object.values(TYPES)), TYPES.FIELD),
}).withDerivedValues({
  /**
   * Return a list of the constituent indicators for this field.
   */
  constituents: derived(
    ZenPropTypes.eval(() => ZenPropTypes.arrayOfType(Field)),
    () => false, // Never update since constituents are static.
    field => {
      const indDef = IndicatorLookup[field.id()] || {};
      const constituentIds = indDef.children || indDef.constituents || [];
      return Field.fromIds(constituentIds);
    },
  ),

  /**
   * Some ids are not valid JS identifiers that can be used by a JS
   * interpreter (e.g. for use in CustomCalculations) due to having spaces.
   * This derived value provides a valid JS identifier.
   */
  jsIdentifier: derived(PropTypes.string.isRequired, hasChanged('id'), field =>
    Field.strToValidIdentifier(field.id()),
  ),
}) {
  // Creates a field from a single id or object
  static create(idOrObj) {
    const obj = typeof idOrObj === 'string' ? { id: idOrObj } : idOrObj;
    return new this(obj);
  }

  // Creates an array of fields from an array of ids
  // Type is optional, but if provided then all fields receive the same type
  static fromIds(fieldIds) {
    return fieldIds.map(fieldId => this.create(fieldId));
  }

  static fromIdsType(fieldIds, fieldType) {
    return fieldIds.map(fieldId =>
      this.create({
        id: fieldId,
        type: fieldType,
      }),
    );
  }

  static pullIds(fields) {
    return fields.map(field => field.id());
  }

  static isForecastId(id) {
    return id.startsWith('forecast_') && !id.startsWith('forecast_error_');
  }

  static strToValidIdentifier(str) {
    // Convert a string to a valid JS identifiers that can be plugged into a
    // formula. Replace all invalid characters with underscores.
    return str.replace(/\W/g, '_');
  }

  // Return this indicator's canonical name from the canonical name map
  // E.g. hmis_indicator_3199 =
  //   'Number of slides or RDT positive for malaria < 5 years: Males (HMIS)'
  // Even if an indicator's label changes, its canonical name will not
  getCanonicalName() {
    const { canonicalNameMap, id } = this._modelValues;
    return canonicalNameMap[id] || id;
  }

  getJSIdentifier() {
    return Field.strToValidIdentifier(this.id());
  }

  // Override default _getLabel() operation.
  // If no label is set then default to the canonical name
  _getLabel() {
    const { label } = this._modelValues;
    // if label is not set, default it to the canonical name
    if (label === null || label === undefined) {
      return this.getCanonicalName();
    }
    return this._get('label');
  }

  serialize() {
    const { id, label } = this.modelValues();
    return { id, label };
  }
}

Field.Types = TYPES;
