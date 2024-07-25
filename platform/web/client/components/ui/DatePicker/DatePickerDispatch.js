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
      currentQuickOption: QuickOptionChoice,
      datePickerContext: $ContextType<typeof DatePickerContext>,
      newQuickOption: DateConfiguration | 'CUSTOM',
      type: 'QUICK_OPTION_CHANGE',
    }
  | {
      datePickerContext: $ContextType<typeof DatePickerContext>,
      newDateTypeModifier: DateModifier,
      type: 'DATE_TYPE_MODIFIER_CHANGE',
    }
  | {
      /** Change in granularity for a 'THIS' or 'LAST' date type */
      newDateUnit: DateUnit,
      type: 'DATE_UNIT_CHANGE',
    }
  | {
      /** Change in intervals in a 'LAST' date type. E.g. Last 6 Months */
      numIntervals: number,
      type: 'DATE_NUM_INTERVALS_CHANGE',
    }
  | {
      /**
       * When the 'Should include current interval' checkbox is changed in a LAST date type
       */
      shouldInclude: boolean,
      type: 'INCLUDE_CURRENT_INTERVAL_CHANGE',
    }
  | {
      /** Triggered for a 'BETWEEN' date type */
      dateRange: { +from: moment$Moment | void, +to: moment$Moment | void },
      type: 'DATE_RANGE_CHANGE',
    }
  | {
      /** Triggered for a 'SINCE' date type */
      date: moment$Moment | void,
      type: 'SINCE_DATE_CHANGE',
    }
  | {
      /**
       * Used for any date types that use a calendar. E.g. 'BETWEEN', 'SINCE',
       * and 'ALL_TIME'
       */
      newCalendarType: CalendarType,
      type: 'CALENDAR_TYPE_CHANGE',
    }
  | {
      type: 'YEAR_TO_DATE_USE_PREVIOUS_YEAR_CHANGE',
      usePreviousYear: boolean,
    }
  | {
      numYearsLookback: number,
      type: 'YEAR_TO_DATE_YEARS_LOOKBACK_CHANGE',
    };

export function datePickerReducer(
  state: DatePickerState,
  action: DatePickerAction,
): DatePickerState {
  const { currentDateConfig } = state;

  switch (action.type) {
    case 'QUICK_OPTION_CHANGE': {
      const { currentQuickOption, datePickerContext, newQuickOption } = action;
      const {
        defaultCalendarType,
        fiscalStartMonth,
        maxAllTimeDate,
        minAllTimeDate,
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
              maxAllTimeDate,
              minAllTimeDate,
            })
          : undefined;

        return {
          ...state,
          currentDateConfig: {
            calendarType: defaultCalendarType,
            modifier: 'BETWEEN',
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
      const { datePickerContext, newDateTypeModifier } = action;
      const {
        defaultCalendarType,
        enabledDateGranularities,
        fiscalStartMonth,
        maxAllTimeDate,
        minAllTimeDate,
        quickOptions,
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
            maxAllTimeDate,
            minAllTimeDate,
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
              dateUnit: hasDateUnitSelections(currentDateConfig)
                ? currentDateConfig.dateUnit
                : firstAvailableDateUnit,
              modifier: 'THIS',
            },
          };

        case 'LAST':
          return {
            ...state,
            currentDateConfig: {
              dateUnit: hasDateUnitSelections(currentDateConfig)
                ? currentDateConfig.dateUnit
                : firstAvailableDateUnit,
              includeCurrentInterval: false,
              modifier: 'LAST',
              numIntervals: 1,
            },
          };

        case 'BETWEEN':
          return {
            ...state,
            currentDateConfig: {
              calendarType: currentCalendarType,
              modifier: 'BETWEEN',
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
              calendarType: currentCalendarType,
              date: sinceDate,
              modifier: 'SINCE',
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
            dateUnit: newDateUnit,
            modifier: 'THIS',
          },
        };
      }

      if (currentDateConfig.modifier === 'LAST') {
        return {
          ...state,
          currentDateConfig: {
            dateUnit: newDateUnit,
            includeCurrentInterval: currentDateConfig.includeCurrentInterval,
            modifier: 'LAST',
            numIntervals: currentDateConfig.numIntervals,
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
            calendarType: currentDateConfig.calendarType,
            modifier: 'BETWEEN',
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
