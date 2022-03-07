// @flow
import * as React from 'react';

import BetweenDateEditor from 'components/ui/DatePicker/internal/BetweenDateEditor';
import DatePickerContext from 'components/ui/DatePicker/DatePickerContext';
import DatePickerDispatch from 'components/ui/DatePicker/DatePickerDispatch';
import DateUnitEditor from 'components/ui/DatePicker/internal/DateUnitEditor';
import Dropdown from 'components/ui/Dropdown';
import Heading from 'components/ui/Heading';
import I18N from 'lib/I18N';
import SinceDateEditor from 'components/ui/DatePicker/internal/SinceDateEditor';
import YearToDateEditor from 'components/ui/DatePicker/internal/YearToDateEditor';
import {
  MODIFIERS,
  hasDateUnitSelections,
} from 'components/ui/DatePicker/types';
import type {
  CalendarType,
  CalendarTypeConfig,
  DateConfiguration,
  DateGranularityConfig,
} from 'components/ui/DatePicker/types';

type Props = {
  currentDateConfig: DateConfiguration,
  defaultCalendarType: CalendarType,
  enabledCalendarTypes: $ReadOnlyArray<CalendarTypeConfig>,
  enabledDateGranularities: $ReadOnlyArray<DateGranularityConfig>,
  maxAllTimeDate: moment$Moment | void,
  minAllTimeDate: moment$Moment | void,
  renderAdditionalEditorUI: () => React.Node,
};

const MODIFIERS_TEXT = t('ui.DatePicker.modifiers');
const TEXT = t('ui.DatePicker.MainContainer');

const MODIFIER_OPTIONS = MODIFIERS.map(m => (
  <Dropdown.Option key={m} value={m}>
    {MODIFIERS_TEXT[m]}
  </Dropdown.Option>
));

function getDropdownModifierFromDateConfig(
  dateConfig: DateConfiguration,
): 'THIS' | 'LAST' | 'BETWEEN' | 'SINCE' {
  switch (dateConfig.modifier) {
    case 'THIS':
      return 'THIS';
    case 'LAST':
      return 'LAST';
    case 'SINCE':
      return 'SINCE';
    case 'BETWEEN':
      return 'BETWEEN';
    case 'ALL_TIME':
      return 'BETWEEN';
    case 'YEAR_TO_DATE':
      return 'BETWEEN';
    default: {
      (dateConfig.modifier: empty);
      throw new Error(`Invalid modifier received: '${dateConfig.modifier}'`);
    }
  }
}

export default function MainContainer({
  currentDateConfig,
  defaultCalendarType,
  enabledCalendarTypes,
  enabledDateGranularities,
  maxAllTimeDate,
  minAllTimeDate,
  renderAdditionalEditorUI,
}: Props): React.Element<'div'> {
  const datePickerContext = React.useContext(DatePickerContext);
  const dispatch = React.useContext(DatePickerDispatch);

  const onDateTypeModifierChange = React.useCallback(
    newDateTypeModifier => {
      dispatch({
        datePickerContext,
        newDateTypeModifier,
        type: 'DATE_TYPE_MODIFIER_CHANGE',
      });
    },
    [dispatch, datePickerContext],
  );

  const selectedModifier = getDropdownModifierFromDateConfig(currentDateConfig);

  return (
    <div className="zen-date-picker__main-container">
      <Heading.Small>{TEXT.makeDateSelection}</Heading.Small>
      <Dropdown
        ariaName={I18N.text('Select date modifier')}
        buttonWidth="100%"
        menuWidth="100%"
        value={selectedModifier}
        onSelectionChange={onDateTypeModifierChange}
      >
        {MODIFIER_OPTIONS}
      </Dropdown>
      {hasDateUnitSelections(currentDateConfig) && (
        <DateUnitEditor
          dateConfig={currentDateConfig}
          enabledDateGranularities={enabledDateGranularities}
        />
      )}
      {currentDateConfig.modifier === 'BETWEEN' && (
        <BetweenDateEditor
          calendarType={currentDateConfig.calendarType || defaultCalendarType}
          enabledCalendarTypes={enabledCalendarTypes}
          initialDateRange={currentDateConfig.range}
        />
      )}
      {currentDateConfig.modifier === 'ALL_TIME' && (
        <BetweenDateEditor
          calendarType={currentDateConfig.calendarType || defaultCalendarType}
          enabledCalendarTypes={enabledCalendarTypes}
          initialDateRange={{
            from: minAllTimeDate,
            to: maxAllTimeDate,
          }}
        />
      )}
      {currentDateConfig.modifier === 'SINCE' && (
        <SinceDateEditor
          calendarType={currentDateConfig.calendarType || defaultCalendarType}
          enabledCalendarTypes={enabledCalendarTypes}
          initialDate={currentDateConfig.date}
        />
      )}
      {currentDateConfig.modifier === 'YEAR_TO_DATE' && (
        <YearToDateEditor
          calendarType={currentDateConfig.calendarType || defaultCalendarType}
          enabledCalendarTypes={enabledCalendarTypes}
          numYearsLookback={currentDateConfig.numYearsLookback}
          usePreviousYear={currentDateConfig.usePreviousYear}
        />
      )}
      {renderAdditionalEditorUI && <div>{renderAdditionalEditorUI()}</div>}
    </div>
  );
}
