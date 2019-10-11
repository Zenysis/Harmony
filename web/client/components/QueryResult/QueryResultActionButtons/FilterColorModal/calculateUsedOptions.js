// @flow
import { EXCLUSIVE_OPTIONS } from 'components/QueryResult/QueryResultActionButtons/FilterColorModal/constants';
import { range } from 'util/util';
import type {
  ActionOption,
  FieldFilterSelections,
} from 'components/QueryResult/QueryResultActionButtons/FilterColorModal/types';

/**
 * Given a FieldFilterSelections object, calculate the array of all selected
 * options, including the options that should also be excluded as a result of
 * the current selections. For example, if we select 'preset ranges', then
 * 'custom ranges' should also be considered as used.
 * This function is used whenever the user changes action type, action option,
 * or removes an existing rule.
 */
export default function calculateUsedOptions(
  fieldFilterSelections: FieldFilterSelections,
): Array<ActionOption> {
  const { numRangeOptionsInputs } = fieldFilterSelections;

  const usedOptions = [];
  range(numRangeOptionsInputs).forEach((idx: number) => {
    const rule = fieldFilterSelections[idx];
    if (rule) {
      const { actionOption } = fieldFilterSelections[idx];
      if (actionOption) {
        usedOptions.push(actionOption);
        const optionsToExclude = EXCLUSIVE_OPTIONS[actionOption];
        if (optionsToExclude) {
          optionsToExclude.forEach(opt => usedOptions.push(opt));
        }
      }
    }
  });

  return usedOptions;
}
