// @flow
import * as React from 'react';
import moment from 'moment';

import DatePickerSettings from 'models/config/CalendarSettings/DatePickerSettings';
import Group from 'components/ui/Group';
import { dateToEthiopianDateString } from 'components/ui/DatePicker/internal/ethiopianDateUtil';
import { getFullDimensionName } from 'models/core/wip/Dimension';
import type { DateConfiguration } from 'components/ui/DatePicker/types';
import type { QueryFilterItem } from 'models/core/wip/QueryFilterItem/types';

/**
 * A function that takes in a value of type DateConfiguration, and converts
 * it to a readable string format
 */
function _dateConfigurationToDisplayName(
  dateConfiguration: DateConfiguration,
): string {
  if (dateConfiguration.displayName) {
    return dateConfiguration.displayName;
  }

  const enabledGranularities = DatePickerSettings.current().enabledGranularities();
  switch (dateConfiguration.modifier) {
    case 'THIS': {
      const granularity = enabledGranularities.find(
        g => g.dateUnit === dateConfiguration.dateUnit,
      );

      if (granularity && typeof granularity.displayName === 'string') {
        return t('common.QueryBuilder.CustomizableFilterTag.thisGranularity', {
          granularity: granularity.displayName,
        });
      }

      // if there's no custom display name, use the date picker's default
      // granularity label
      return t('ui.DatePicker.dateUnits')[dateConfiguration.dateUnit].THIS;
    }
    case 'LAST': {
      const granularity = enabledGranularities.find(
        g => g.dateUnit === dateConfiguration.dateUnit,
      );
      if (granularity && typeof granularity.displayName === 'string') {
        return t('common.QueryBuilder.CustomizableFilterTag.lastGranularity', {
          granularity: granularity.displayName,
          count: dateConfiguration.numIntervals,
        });
      }

      // if there's no custom display name, use the date picker's default
      // granularity label
      return t(`${dateConfiguration.dateUnit}.LAST`, {
        scope: 'ui.DatePicker.dateUnits',
        count: dateConfiguration.numIntervals,
      });
    }
    case 'BETWEEN':
      return t('ui.DatePicker.modifiers.BETWEEN');
    case 'SINCE':
      return t('ui.DatePicker.QuickOption.since', {
        date:
          dateConfiguration.calendarType === 'ETHIOPIAN'
            ? dateToEthiopianDateString(moment(dateConfiguration.date))
            : moment(dateConfiguration.date).format('ll'),
      });
    case 'ALL_TIME':
      return t('ui.DatePicker.QuickOption.allTime');
    case 'YEAR_TO_DATE':
      return t('ui.DatePicker.QuickOption.yearToDate');
    default:
      (dateConfiguration.modifier: empty);
      throw new Error(`Invalid date modifier: '${dateConfiguration.modifier}'`);
  }
}

/**
 * A function that takes in a value of type QueryFilterItem, and
 * builds a React element representing the name of the item's tag
 */
export default function buildTagName(
  item: QueryFilterItem,
  keepDateTagInSingleLine?: boolean = false,
): React.Node {
  if (item.tag === 'UNAPPLIED_QUERY_FILTER_ITEM') {
    return buildTagName(item.item());
  }

  if (item.tag === 'DIMENSION_VALUE_FILTER_ITEM') {
    const dimensionName = getFullDimensionName(item.dimension());
    return `${dimensionName} | ${item.displayValue()}`;
  }

  if (item.tag === 'CUSTOMIZABLE_TIME_INTERVAL') {
    const dateConfig = item.dateConfiguration();
    const { start, end } = item
      .filter()
      .interval()
      .modelValues();
    const dateModifierDisplayName = _dateConfigurationToDisplayName(dateConfig);

    let dateRange = `${start.format('ll')} - ${end
      .subtract(1, 'day')
      .format('ll')}`;

    if (dateConfig.calendarType && dateConfig.calendarType === 'ETHIOPIAN') {
      const etStart = dateToEthiopianDateString(start.momentView());
      const etEnd = dateToEthiopianDateString(
        end.subtract(1, 'day').momentView(),
      );
      dateRange = `${etStart} - ${etEnd}`;
    }

    if (keepDateTagInSingleLine) {
      return `${dateModifierDisplayName} | ${dateRange}`;
    }

    return (
      <Group.Vertical spacing="xxs">
        <>{dateModifierDisplayName}</>
        <>{dateRange}</>
      </Group.Vertical>
    );
  }

  // TODO(stephen): Figure out error handling.
  throw new Error('Illegal customization item type.');
}
