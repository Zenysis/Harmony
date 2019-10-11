// @flow
import GroupingDimension from 'models/core/wip/GroupingItem/GroupingDimension';
import SimpleQuerySelections from 'models/core/SimpleQuerySelections';
import type QuerySelections from 'models/core/wip/QuerySelections';

// The SimpleQuerySelections type only allows a single grouping field. For now,
// choose the last group selected as the grouping field so that we can see
// results.
function _getLegacyGroupingField(querySelections: QuerySelections): string {
  const dimensions = querySelections.groups().filterInstance(GroupingDimension);
  const numDimensions = dimensions.size();
  if (numDimensions === 0) {
    return 'nation';
  }

  return dimensions
    .get(numDimensions - 1)
    .dimension()
    .id();
}

export function shouldRecomputeSimpleQuerySelections(
  prevQuerySelections: QuerySelections,
  curQuerySelections: QuerySelections,
): boolean {
  const prevFields = prevQuerySelections.fields();
  const curFields = curQuerySelections.fields();
  const fieldsDifferent =
    prevFields.size() !== curFields.size() ||
    prevFields.some(
      (field, idx) => curFields.get(idx).legacyField() !== field.legacyField(),
    );

  return (
    fieldsDifferent ||
    _getLegacyGroupingField(prevQuerySelections) !==
      _getLegacyGroupingField(curQuerySelections)
  );
}

export function computeSimpleQuerySelections(
  curQuerySelections: QuerySelections,
): SimpleQuerySelections {
  const fields = curQuerySelections
    .fields()
    .mapValues(field => field.legacyField());
  return SimpleQuerySelections.create({
    dateType: 'ET_CHOOSE_MONTHS',
    endDate: '2017-07-08',
    fields,
    granularity: _getLegacyGroupingField(curQuerySelections),
    startDate: '2016-07-08',
  });
}
