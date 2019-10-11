// @flow
import * as Zen from 'lib/Zen';
import Field from 'models/core/Field';
import { getEnabledDimensions } from 'components/QueryApp/QueryForm/queryUtil';
import type QuerySelectionFilter from 'models/core/SimpleQuerySelections/QuerySelectionFilter';
import type SimpleQuerySelections from 'models/core/SimpleQuerySelections';

const DROPDOWN_COMPONENTS =
  window.__JSON_FROM_BACKEND.indicatorSelectionDropdowns || [];

export function computeLegacyFilterObject(
  selections: SimpleQuerySelections,
): { [filterType: string]: Zen.Serialized<QuerySelectionFilter> } {
  const filterMapping = selections.filters();
  const filters = {};
  Object.keys(filterMapping).forEach(filterType => {
    const filter = filterMapping[filterType];
    if (filter) {
      filters[filterType] = filter.serialize();
    }
  });
  return filters;
}

export function computeLegacySelectionsObject(
  selections: SimpleQuerySelections,
): Zen.Serialized<SimpleQuerySelections> {
  const denominatorField = selections.denominator();
  const denominator = denominatorField ? denominatorField.id() : null;

  const output = {
    dateType: selections.dateType(),
    denominator,
    endDate: selections.endDate(),
    fields: Field.pullIds(selections.fields()),
    filters: selections.legacyFilters(),
    granularity: selections.granularity(),
    startDate: selections.startDate(),
  };

  DROPDOWN_COMPONENTS.forEach(component => {
    const { selectionType } = component;
    output[selectionType] = Field.pullIds(
      selections.getFieldsByType(selectionType),
    );
  });
  return output;
}

// Compute the dimensions that we can filter/display by for the user's given
// set of indicators.
export function computeEnabledDimensions(
  selections: SimpleQuerySelections,
): $ReadOnlySet<string> {
  const indicatorIds = [];
  DROPDOWN_COMPONENTS.forEach(component => {
    indicatorIds.push(
      ...Field.pullIds(selections.getFieldsByType(component.selectionType)),
    );
  });
  return getEnabledDimensions(indicatorIds);
}

export function computeFieldsByType(
  selections: SimpleQuerySelections,
): { [string]: Array<Field> } {
  const result = {};
  selections.fields().forEach(field => {
    const type = field.type();
    if (type in result) {
      result[type].push(field);
    } else {
      result[type] = [field];
    }
  });
  return result;
}
