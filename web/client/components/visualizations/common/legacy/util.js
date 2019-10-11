import { passesFilter } from 'components/QueryResult/resultUtil';

// Filter the series data by the user's requested filters. Use the
// total value, not the monthly value, when making that decision.
// eslint-disable-next-line import/prefer-default-export
export function applyFilters(series, filters) {
  const data = series.slice();
  const fieldFilters = Object.keys(filters);
  if (data.length === 0 || fieldFilters.length === 0) {
    return data;
  }

  return data.filter(item =>
    fieldFilters.every(field =>
      passesFilter(filters, field, item[`yValue_${field}`]),
    ),
  );
}

export function selectionsChanged(selections, newSelections) {
  if (
    newSelections !== selections &&
    newSelections.settings === selections.settings
  ) {
    return true;
  }
  return false;
}
