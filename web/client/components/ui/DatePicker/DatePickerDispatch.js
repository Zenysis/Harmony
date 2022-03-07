// @flow
import * as React from 'react';

import DatePickerContext from 'components/ui/DatePicker/DatePickerContext';
import computeDateRange from 'components/ui/DatePicker/computeDateRange';
import isDateConfigurationValid from 'components/ui/DatePicker/isDateConfigurationValid';
import { hasDateUnitSelections } from 'components/ui/DatePicker/types';
import type {
  CalendarType,
  DateConfiguration,
  DateModifier,
  DateUnit,
  LastDateConfig,
  QuickOptionChoice,
  ThisDateConfig,
} from 'components/ui/DatePicker/types';

type DatePickerState = {
  /** The current DateConfiguration being held by the DatePicker */
  currentDateConfig: DateConfiguration,
};

type DatePickerAction =
  | {
      /** When a quick option is selected from the side menu */
      type: 'QUICK_OPTION_CHANGE',
      currentQuickOption: QuickOptionChoice,
      newQuickOption: DateConfiguration | 'CUSTOM',
      datePickerContext: $ContextType<typeof DatePickerContext>,
    }
  | {
      type: 'DATE_TYPE_MODIFIER_CHANGE',
      newDateTypeModifier: DateModifier,
      datePickerContext: $ContextType<typeof DatePickerContext>,
    }
  | {
      /** Change in granularity for a 'THIS' or 'LAST' date type */
      type: 'DATE_UNIT_CHANGE',
      newDateUnit: DateUnit,
    }
  | {
      /** Change in intervals in a 'LAST' date type. E.g. Last 6 Months */
      type: 'DATE_NUM_INTERVALS_CHANGE',
      numIntervals: number,
    }
  | {
      /**
       * When the 'Should include current interval' checkbox is changed in a LAST date type
       */
      type: 'INCLUDE_CURRENT_INTERVAL_CHANGE',
      shouldInclude: boolean,
    }
  | {
      /** Triggered for a 'BETWEEN' date type */
      type: 'DATE_RANGE_CHANGE',
      dateRange: { +from: moment$Moment | void, +to: moment$Moment | void },
    }
  | {
      /** Triggered for a 'SINCE' date type */
      type: 'SINCE_DATE_CHANGE',
      date: moment$Moment | void,
    }
  | {
      /**
       * Used for any date types that use a calendar. E.g. 'BETWEEN', 'SINCE',
       * and 'ALL_TIME'
       */
      type: 'CALENDAR_TYPE_CHANGE',
      newCalendarType: CalendarType,
    }
  | {
      type: 'YEAR_TO_DATE_USE_PREVIOUS_YEAR_CHANGE',
      usePreviousYear: boolean,
    }
  | {
      type: 'YEAR_TO_DATE_YEARS_LOOKBACK_CHANGE',
      numYearsLookback: number,
    };

export function datePickerReducer(
  state: DatePickerState,
  action: DatePickerAction,
): DatePickerState {
  const { currentDateConfig } = state;

  switch (action.type) {
    case 'QUICK_OPTION_CHANGE': {
      const { newQuickOption, currentQuickOption, datePickerContext } = action;
      const {
        minAllTimeDate,
        maxAllTimeDate,
        fiscalStartMonth,
        defaultCalendarType,
      } = datePickerContext;
      if (newQuickOption !== 'CUSTOM') {
        return {
          ...state,
          currentDateConfig: newQuickOption,
        };
      }

      if (newQuickOption === 'CUSTOM' && currentQuickOption !== 'CUSTOM') {
        // convert the prev date configuration to a date range, if possible.
        // This is useful for preserving as much state as possible when
        // switching to 'CUSTOM'
        const prevDateRange = isDateConfigurationValid(currentDateConfig)
          ? computeDateRange(currentDateConfig, {
              fiscalStartMonth,
              minAllTimeDate,
              maxAllTimeDate,
            })
          : undefined;

        return {
          ...state,
          currentDateConfig: {
            modifier: 'BETWEEN',
            calendarType: defaultCalendarType,
            range: {
              from:
                prevDateRange === undefined ? undefined : prevDateRange.from,
              to: prevDateRange === undefined ? undefined : prevDateRange.to,
            },
          },
        };
      }

      return state;
    }

    // when the user switches from one modifier to another, we try to do this
    // seamlessly by keeping as many of the selections from the previous modifier
    // as possible
    case 'DATE_TYPE_MODIFIER_CHANGE': {
      const { newDateTypeModifier, datePickerContext } = action;
      const {
        fiscalStartMonth,
        minAllTimeDate,
        maxAllTimeDate,
        quickOptions,
        defaultCalendarType,
        enabledDateGranularities,
      } = datePickerContext;

      if (newDateTypeModifier === currentDateConfig.modifier) {
        // no change if we selected the same modifier
        return state;
      }

      // convert the prev date configuration to a date range, if possible.
      // This is useful for preserving as much state as possible between date
      // modifiers
      const prevDateRange = isDateConfigurationValid(currentDateConfig)
        ? computeDateRange(currentDateConfig, {
            fiscalStartMonth,
            minAllTimeDate,
            maxAllTimeDate,
          })
        : undefined;

      const firstAvailableRelativeOption:
        | ThisDateConfig
        | LastDateConfig
        | void = (quickOptions.find(
        opt => opt.modifier === 'THIS' || opt.modifier === 'LAST',
      ): $Cast);

      const firstAvailableDateUnit = firstAvailableRelativeOption
        ? firstAvailableRelativeOption.dateUnit
        : enabledDateGranularities[0].dateUnit;

      const currentCalendarType =
        currentDateConfig.calendarType || defaultCalendarType;

      switch (newDateTypeModifier) {
        case 'THIS':
          return {
            ...state,
            currentDateConfig: {
              modifier: 'THIS',
              dateUnit: hasDateUnitSelections(currentDateConfig)
                ? currentDateConfig.dateUnit
                : firstAvailableDateUnit,
            },
          };

        case 'LAST':
          return {
            ...state,
            currentDateConfig: {
              modifier: 'LAST',
              dateUnit: hasDateUnitSelections(currentDateConfig)
                ? currentDateConfig.dateUnit
                : firstAvailableDateUnit,
              numIntervals: 1,
              includeCurrentInterval: false,
            },
          };

        case 'BETWEEN':
          return {
            ...state,
            currentDateConfig: {
              modifier: 'BETWEEN',
              calendarType: currentCalendarType,
              range: {
                from:
                  prevDateRange === undefined ? undefined : prevDateRange.from,
                to: prevDateRange === undefined ? undefined : prevDateRange.to,
              },
            },
          };
        case 'SINCE': {
          let sinceDate;
          if (prevDateRange !== undefined) {
            sinceDate = prevDateRange.from;
          } else if (currentDateConfig.modifier === 'BETWEEN') {
            sinceDate = currentDateConfig.range.from || undefined;
          }
          return {
            ...state,
            currentDateConfig: {
              modifier: 'SINCE',
              calendarType: currentCalendarType,
              date: sinceDate,
            },
          };
        }
        case 'ALL_TIME':
        case 'YEAR_TO_DATE':
          throw new Error(
            `${newDateTypeModifier} is not a selectable modifier, it should only be selectable through the quick options list.`,
          );
        default:
          (newDateTypeModifier: empty);
          throw new Error(
            `Changing to an invalid date modifier: '${newDateTypeModifier}'`,
          );
      }
    }

    case 'DATE_UNIT_CHANGE': {
      const { newDateUnit } = action;
      if (newDateUnit === currentDateConfig.dateUnit) {
        // no change if we selected the same date unit
        return state;
      }

      if (currentDateConfig.modifier === 'THIS') {
        return {
          ...state,
          currentDateConfig: {
            modifier: 'THIS',
            dateUnit: newDateUnit,
          },
        };
      }

      if (currentDateConfig.modifier === 'LAST') {
        return {
          ...state,
          currentDateConfig: {
            modifier: 'LAST',
            dateUnit: newDateUnit,
            numIntervals: currentDateConfig.numIntervals,
            includeCurrentInterval: currentDateConfig.includeCurrentInterval,
          },
        };
      }

      throw new Error(
        `Changing date units should not be possible if the current date modifier is '${currentDateConfig.modifier}'`,
      );
    }

    case 'DATE_NUM_INTERVALS_CHANGE': {
      const { numIntervals } = action;
      if (currentDateConfig.modifier === 'LAST') {
        return {
          ...state,
          currentDateConfig: {
            ...currentDateConfig,
            numIntervals,
            modifier: 'LAST',
          },
        };
      }

      throw new Error(
        `Number of intervals should not be changeable for date modifier: '${currentDateConfig.modifier}'`,
      );
    }

    case 'INCLUDE_CURRENT_INTERVAL_CHANGE': {
      const { shouldInclude } = action;
      if (currentDateConfig.modifier === 'LAST') {
        return {
          ...state,
          currentDateConfig: {
            ...currentDateConfig,
            includeCurrentInterval: shouldInclude,
            modifier: 'LAST',
          },
        };
      }

      throw new Error(
        `includeCurrentInterval should not be changeable for date modifier: '${currentDateConfig.modifier}'`,
      );
    }

    case 'DATE_RANGE_CHANGE': {
      const { dateRange } = action;
      if (
        currentDateConfig.modifier === 'BETWEEN' ||
        currentDateConfig.modifier === 'ALL_TIME' ||
        currentDateConfig.modifier === 'YEAR_TO_DATE'
      ) {
        return {
          ...state,
          currentDateConfig: {
            modifier: 'BETWEEN',
            calendarType: currentDateConfig.calendarType,
            range: dateRange,
          },
        };
      }

      throw new Error(
        `Date range changes should not be possible for date modifier: '${currentDateConfig.modifier}' dates.`,
      );
    }

    case 'SINCE_DATE_CHANGE': {
      const { date } = action;
      if (currentDateConfig.modifier === 'SINCE') {
        return {
          ...state,
          currentDateConfig: {
            date,
            calendarType: currentDateConfig.calendarType,
            modifier: 'SINCE',
          },
        };
      }
      throw new Error(
        `SINCE date changes should not be possible for date modifier: '${currentDateConfig.modifier}'.`,
      );
    }

    // if the calendar type is changed when using the calendar picker, then we
    // should keep all the existing information and just change the calendarType
    case 'CALENDAR_TYPE_CHANGE': {
      const { newCalendarType } = action;
      switch (currentDateConfig.modifier) {
        case 'SINCE':
          return {
            ...state,
            currentDateConfig: {
              ...currentDateConfig,
              calendarType: newCalendarType,
            },
          };
        case 'BETWEEN':
          return {
            ...state,
            currentDateConfig: {
              ...currentDateConfig,
              calendarType: newCalendarType,
            },
          };
        case 'ALL_TIME':
          return {
            ...state,
            currentDateConfig: {
              ...currentDateConfig,
              calendarType: newCalendarType,
            },
          };

        case 'YEAR_TO_DATE':
          return {
            ...state,
            currentDateConfig: {
              ...currentDateConfig,
              calendarType: newCalendarType,
            },
          };
        default:
          throw new Error(
            `Changing calendar type should not be possible for date modifier: '${currentDateConfig.modifier}'.`,
          );
      }
    }

    case 'YEAR_TO_DATE_USE_PREVIOUS_YEAR_CHANGE': {
      const { usePreviousYear } = action;
      if (currentDateConfig.modifier === 'YEAR_TO_DATE') {
        return {
          ...state,
          currentDateConfig: {
            ...currentDateConfig,
            usePreviousYear,
          },
        };
      }
      throw new Error(
        `YEAR_TO_DATE changes should not be possible for date modifier: '${currentDateConfig.modifier}'.`,
      );
    }

    case 'YEAR_TO_DATE_YEARS_LOOKBACK_CHANGE': {
      const { numYearsLookback } = action;
      if (currentDateConfig.modifier === 'YEAR_TO_DATE') {
        return {
          ...state,
          currentDateConfig: {
            ...currentDateConfig,
            numYearsLookback,
          },
        };
      }
      throw new Error(
        `YEAR_TO_DATE changes should not be possible for date modifier: '${currentDateConfig.modifier}'.`,
      );
    }
    default: {
      (action.type: empty);
      throw new Error(`Invalid DatePickerAction received: '${action.type}'`);
    }
  }
}

export default (React.createContext(() => {
  throw new Error('Could not find DatePickerDispatch');
}): React.Context<$Dispatch<DatePickerAction>>);
