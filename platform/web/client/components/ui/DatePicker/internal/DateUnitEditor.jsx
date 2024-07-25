// @flow
import * as React from 'react';

import Checkbox from 'components/ui/Checkbox';
import DatePickerDispatch from 'components/ui/DatePicker/DatePickerDispatch';
import I18N from 'lib/I18N';
import InputText from 'components/ui/InputText';
import SelectableButtonGroup from 'components/ui/DatePicker/internal/SelectableButtonGroup';
import { DATE_UNITS } from 'util/dateUtil';
import type {
  DateUnit,
  DateGranularityConfig,
  LastDateConfig,
  ThisDateConfig,
} from 'components/ui/DatePicker/types';

type Props = {
  dateConfig: LastDateConfig | ThisDateConfig,
  enabledDateGranularities: $ReadOnlyArray<DateGranularityConfig>,
};

function getGranularityDisplayName(
  granularity: DateGranularityConfig | void,
): string {
  if (granularity === undefined) {
    return '';
  }
  const { dateUnit } = granularity;
  return granularity.displayName || DATE_UNITS[dateUnit].label;
}

/**
 * This is the editor UI where the user can select the DateUnit (e.g. day, week
 * month, etc.). The exact UI configuration depends on the DateModifier (e.g.
 * 'THIS', 'LAST', 'BETWEEN'). For example, if they select 'BETWEEN' then
 * we will get a calendar view. If they select 'LAST', then we will get an
 * input box where they can enter the number of intervals.
 */
export default function DateUnitEditor({
  dateConfig,
  enabledDateGranularities,
}: Props): React.Element<'div'> {
  const dispatch = React.useContext(DatePickerDispatch);
  const onDateUnitChange = React.useCallback(
    (newDateUnit: DateUnit) => {
      dispatch({ newDateUnit, type: 'DATE_UNIT_CHANGE' });
    },
    [dispatch],
  );

  const onDateNumIntervalsChange = React.useCallback(
    (numIntervals: number) => {
      dispatch({ numIntervals, type: 'DATE_NUM_INTERVALS_CHANGE' });
    },
    [dispatch],
  );

  const onIncludeCurrentIntervalChange = React.useCallback(
    (shouldInclude: boolean) => {
      dispatch({ shouldInclude, type: 'INCLUDE_CURRENT_INTERVAL_CHANGE' });
    },
    [dispatch],
  );

  const granularitiesMap: Map<
    string,
    DateGranularityConfig,
  > = React.useMemo(
    () =>
      enabledDateGranularities.reduce(
        (map, g) => map.set(g.dateUnit, g),
        new Map(),
      ),
    [enabledDateGranularities],
  );

  // get all date units from the granularity configs
  const enabledDateUnits = React.useMemo(
    () => enabledDateGranularities.map(granularity => granularity.dateUnit),
    [enabledDateGranularities],
  );

  const getDateUnitButtonContents = React.useCallback(
    (dateUnit: DateUnit) => (
      <span className="zen-date-picker__date-unit-btn">
        {getGranularityDisplayName(granularitiesMap.get(dateUnit))}
      </span>
    ),
    [granularitiesMap],
  );

  // when we leave the input text, reset the text to be an integer in case they
  // had typed a decimal value
  const onLastNumIntervalBlur = () => {
    if (dateConfig.modifier === 'LAST') {
      onDateNumIntervalsChange(Math.floor(dateConfig.numIntervals));
    }
  };

  const numInputText = dateConfig.modifier === 'LAST' && (
    <InputText
      ariaName={I18N.text('Number of units')}
      onBlur={onLastNumIntervalBlur}
      onChange={numStr => onDateNumIntervalsChange(Number(numStr))}
      step={1}
      type="number"
      value={String(dateConfig.numIntervals)}
    />
  );

  return (
    <div className="zen-date-type-editor">
      {numInputText}
      <div className="zen-date-type-editor__btn-group-container">
        <SelectableButtonGroup
          onSelectionChange={onDateUnitChange}
          renderButtonContents={getDateUnitButtonContents}
          selectedValue={dateConfig.dateUnit}
          values={enabledDateUnits}
        />
      </div>
      {dateConfig.modifier === 'LAST' && (
        <Checkbox
          label={I18N.text('Include current %(dateUnit)s as well', {
            dateUnit: getGranularityDisplayName(
              granularitiesMap.get(dateConfig.dateUnit),
            ),
          })}
          onChange={onIncludeCurrentIntervalChange}
          value={dateConfig.includeCurrentInterval}
        />
      )}
    </div>
  );
}
