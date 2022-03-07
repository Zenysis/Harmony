// @flow
import * as React from 'react';
import classNames from 'classnames';

import DatePickerContext from 'components/ui/DatePicker/DatePickerContext';
import DatePickerDispatch, {
  datePickerReducer,
} from 'components/ui/DatePicker/DatePickerDispatch';
import FullButton from 'components/ui/DatePicker/internal/FullButton';
import Heading from 'components/ui/Heading';
import MainContainer from 'components/ui/DatePicker/internal/MainContainer';
import QuickOptionsContainer from 'components/ui/DatePicker/internal/QuickOptionsContainer';
import isDateConfigurationValid from 'components/ui/DatePicker/isDateConfigurationValid';
import usePrevious from 'lib/hooks/usePrevious';
import { DEFAULT_CALENDAR_TYPES } from 'components/ui/DatePicker/types';
import { noop } from 'util/util';
import type {
  CalendarType,
  CalendarTypeConfig,
  DateConfiguration,
  DateGranularityConfig,
} from 'components/ui/DatePicker/types';

type Props = {
  /** An array of the date granularities to enable */
  enabledDateGranularities: $ReadOnlyArray<DateGranularityConfig>,

  /**
   * An array of the quick options to show in the left sidebar that represent
   * some preset DateConfiguration objects.
   */
  quickOptions: $ReadOnlyArray<DateConfiguration>,

  /** The text to use for the Apply button */
  applyButtonText?: string,

  /** The class name to apply to the top-level date picker container */
  className?: string,

  /**
   * The default calendar type to select when choosing a view that requires an
   * exact date (e.g. 'Between' or 'Since').
   */
  defaultCalendarType?: CalendarType,

  /**
   * An array of the enabled calendar types for when the user selects a modifier
   * (e.g. 'Since' or 'Between') that requires an exact date selection.
   */
  enabledCalendarTypes?: $ReadOnlyArray<CalendarTypeConfig>,

  /**
   * If you want to enable fiscal dates (e.g. Fiscal Quarter), you should
   * pass the starting month of the fiscal year, otherwise fiscal dates will be
   * calculated starting from January.
   */
  fiscalStartMonth?: number,

  /**
   * The initial date configuration with which to render the Date Picker.
   * Note that this component is an **uncontrolled** component, so after you've
   * passed an initial date configuration, its state is managed internally.
   * To reset the date configuration you'd have to remount the component.
   */
  initialDateConfiguration?: DateConfiguration | void,

  /** The maximum date used for the ALL_TIME relative date. */
  maxAllTimeDate?: moment$Moment,

  /** The minimum date used for the ALL_TIME relative date. */
  minAllTimeDate?: moment$Moment,

  /**
   * Callback for when the "Apply" button is clicked. This is only possible
   * when the current date configuration is valid.
   * */
  onApplyClick?: DateConfiguration => void,

  /**
   * Callback for whenever the date configuration changes. This is called on
   * any change, so there is no guarantee that the date configuration will be
   * valid (for example, a BETWEEN configuration may still be missing its
   * from/to date).
   */
  onDateConfigurationChange?: DateConfiguration => void,

  /**
   * Use this function to render some UI after the default editor UI
   * This is useful in case there is any context-specific UI you want to add to
   * the date picker that only the parent knows about.
   */
  renderAdditionalEditorUI?: () => React.Node,
};

const TEXT = t('ui.DatePicker');

/**
 * A date picker for custom and relative date selection.
 *
 * Notes on relative date definitions:
 * - A week starts on a Sunday
 *
 * **Working with a DateConfiguration object:**
 *
 * When you click the Apply button it returns a `DateConfiguration` object
 * that represents the selections that were made. To convert this to a
 * standard date range you can use the `computeDateRange` utility function
 * provided in `DatePicker/computeDateRange.js`.
 */
export default function DatePicker({
  enabledDateGranularities,
  quickOptions,
  applyButtonText = TEXT.applyButtonText,
  className = '',
  defaultCalendarType = 'GREGORIAN',
  enabledCalendarTypes = DEFAULT_CALENDAR_TYPES,
  fiscalStartMonth = 1,
  initialDateConfiguration = undefined,
  maxAllTimeDate = undefined,
  minAllTimeDate = undefined,
  onApplyClick = noop,
  onDateConfigurationChange = undefined,
  renderAdditionalEditorUI = undefined,
}: Props): React.Element<'div'> {
  const [state, dispatch] = React.useReducer(datePickerReducer, {
    currentDateConfig: initialDateConfiguration || quickOptions[0],
  });

  const { currentDateConfig } = state;
  const prevDateConfig = usePrevious(currentDateConfig);

  const datePickerContext = React.useMemo<
    $ContextType<typeof DatePickerContext>,
  >(
    () => ({
      enabledDateGranularities,
      fiscalStartMonth,
      defaultCalendarType,
      maxAllTimeDate,
      minAllTimeDate,
      quickOptions,
    }),
    [
      enabledDateGranularities,
      fiscalStartMonth,
      defaultCalendarType,
      maxAllTimeDate,
      minAllTimeDate,
      quickOptions,
    ],
  );

  // if the date configuration has changed then we should trigger
  // `onDateConfigurationChange`
  React.useEffect(() => {
    if (
      prevDateConfig !== undefined &&
      currentDateConfig !== prevDateConfig &&
      onDateConfigurationChange
    ) {
      onDateConfigurationChange(currentDateConfig);
    }
  }, [currentDateConfig, prevDateConfig, onDateConfigurationChange]);

  const onApplyButtonClick = () => onApplyClick(currentDateConfig);

  const mainClassName = classNames('zen-date-picker', className, {
    'zen-date-picker--calendar-view':
      currentDateConfig.modifier === 'BETWEEN' ||
      currentDateConfig.modifier === 'ALL_TIME' ||
      currentDateConfig.modifier === 'YEAR_TO_DATE',
  });

  return (
    <div className={mainClassName}>
      <div className="zen-date-picker__top-container">
        <DatePickerDispatch.Provider value={dispatch}>
          <DatePickerContext.Provider value={datePickerContext}>
            <QuickOptionsContainer
              quickOptions={quickOptions}
              currentDateConfig={currentDateConfig}
            />
            <MainContainer
              currentDateConfig={currentDateConfig}
              enabledDateGranularities={enabledDateGranularities}
              enabledCalendarTypes={enabledCalendarTypes}
              defaultCalendarType={defaultCalendarType}
              maxAllTimeDate={maxAllTimeDate}
              minAllTimeDate={minAllTimeDate}
              renderAdditionalEditorUI={renderAdditionalEditorUI}
            />
          </DatePickerContext.Provider>
        </DatePickerDispatch.Provider>
      </div>
      <FullButton
        ariaName={applyButtonText}
        disabled={!isDateConfigurationValid(currentDateConfig)}
        onClick={onApplyButtonClick}
      >
        <Heading.Small whiteText>{applyButtonText}</Heading.Small>
      </FullButton>
    </div>
  );
}
