import PropTypes from 'prop-types';
import moment from 'moment';

import Field from 'models/core/Field';
import MetricField from 'models/core/Field/MetricField';
import PropertyField from 'models/core/Field/PropertyField';
import SimpleQuerySelections from 'models/core/SimpleQuerySelections';
import { DATE_FORMAT } from 'util/dateUtil';
import { def, derived } from 'util/ZenModel';
import { computeLegacySelectionsObject } from 'models/core/SimpleQuerySelections/derivedComputations';

function computeLegacy(selections) {
  return {
    metrics: Field.pullIds(this.getFieldsByType(Field.Types.METRIC)),
    properties: Field.pullIds(this.getFieldsByType(Field.Types.PROPERTY)),
    ...computeLegacySelectionsObject(selections),
  };
}

// TODO(pablo, moriah): these default selections are just being pulled
// from GeoExplorerApp/index.js. They need to be cleaned up to remove
// the 'FacilityName' hardcode, and then all of GeoExplorerApp should
// be using this selections model.
export default class GeoExplorerSelections extends SimpleQuerySelections.withTypes(
  {
    dateType: def(PropTypes.string, 'CUSTOM'),
    endDate: def(PropTypes.string, moment().format(DATE_FORMAT)),
    granularity: def(PropTypes.string, 'FacilityName'),
    startDate: def(
      PropTypes.string,
      moment()
        .subtract(2, 'year')
        .format(DATE_FORMAT),
    ),
  },
).withDerivedValues({
  // HACK(pablo, stephen): Certain visualizations and settings require the
  // pre-ZenModel SimpleQuerySelections object to operate. Use a derived value
  // to avoid recreating the legacy object each time.
  legacySelections: derived(
    PropTypes.object,
    // NOTE(stephen): The legacy version will need to be recomputed any time
    // the SimpleQuerySelections change. Luckily, this does not happen often.
    () => true,
    computeLegacy,
  ),
}) {
  static fromLegacyObject({ fields = [], metrics = [], properties = [] } = {}) {
    const metricFields = new Set(metrics);
    const propertyFields = new Set(properties);
    const allFields = fields.map(id => {
      let FieldModel = Field;
      if (metricFields.has(id)) {
        FieldModel = MetricField;
      } else if (propertyFields.has(id)) {
        FieldModel = PropertyField;
      }
      return FieldModel.create(id);
    });

    return new GeoExplorerSelections({ fields: allFields });
  }
}
