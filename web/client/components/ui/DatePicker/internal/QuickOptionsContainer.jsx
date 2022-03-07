// @flow
import * as React from 'react';
import moment from 'moment';

import DatePickerContext from 'components/ui/DatePicker/DatePickerContext';
import DatePickerDispatch from 'components/ui/DatePicker/DatePickerDispatch';
import QuickOption from 'components/ui/DatePicker/internal/QuickOption';
import {
  areSinceDateConfigurationsEqual,
  areBetweenDateConfigurationsEqual,
  areYearToDateConfigurationsEqual,
} from 'components/ui/DatePicker/types';
import { objShallowEq } from 'util/objUtil';
import type {
  DateConfiguration,
  QuickOptionChoice,
} from 'components/ui/DatePicker/types';

const TEXT = t('ui.DatePicker.QuickOptionsContainer');

type Props = {
  currentDateConfig: DateConfiguration,
  quickOptions: $ReadOnlyArray<DateConfiguration>,
};

function uniqueKeyFromDateConfiguration(config: DateConfiguration) {
  switch (config.modifier) {
    case 'THIS':
      return `${config.dateUnit}-${config.modifier}`;
    case 'LAST':
      return `${config.dateUnit}-${config.modifier}-${
        config.numIntervals
      }-${String(config.includeCurrentInterval)}`;
    case 'BETWEEN':
      return `BETWEEN-${moment(config.range.from).format(
        'YYYY-MM-DD',
      )}-${moment(config.range.to).format('YYYY-MM-DD')}`;
    case 'SINCE':
      return `SINCE-${moment(config.date).format('YYYY-MM-DD')}`;
    case 'ALL_TIME':
      return 'ALL_TIME';
    case 'YEAR_TO_DATE':
      return 'YEAR_TO_DATE';
    default:
      (config.modifier: empty);
      throw new Error(`Unexpected date configuration: '${config.modifier}'`);
  }
}

function QuickOptionsContainer({
  currentDateConfig,
  quickOptions,
}: Props): React.Element<'div'> {
  const datePickerContext = React.useContext(DatePickerContext);
  const dispatch = React.useContext(DatePickerDispatch);
  const { defaultCalendarType } = datePickerContext;

  // check if the currentDateConfig matches any quick option, otherwise set it
  // to 'CUSTOM'
  const currentQuickOption = React.useMemo<QuickOptionChoice>(
    () =>
      quickOptions.find(opt => {
        if (currentDateConfig.modifier === opt.modifier) {
          if (currentDateConfig.modifier === 'SINCE') {
            return areSinceDateConfigurationsEqual(
              currentDateConfig,
              opt,
              defaultCalendarType,
            );
          }

          if (currentDateConfig.modifier === 'BETWEEN') {
            return areBetweenDateConfigurationsEqual(
              currentDateConfig,
              opt,
              defaultCalendarType,
            );
          }

          if (currentDateConfig.modifier === 'YEAR_TO_DATE') {
            return areYearToDateConfigurationsEqual(
              currentDateConfig,
              opt,
              defaultCalendarType,
            );
          }

          // do a shallow obj comparison to check if date configs are equal
          const { displayName: n1, ...currentConfig } = currentDateConfig;
          const { displayName: n2, ...otherConfig } = opt;
          return objShallowEq(currentConfig, otherConfig);
        }
        return false;
      }) || 'CUSTOM',
    [currentDateConfig, quickOptions, defaultCalendarType],
  );

  const quickOptionRows = quickOptions.concat('CUSTOM').map(option => {
    const key =
      option === 'CUSTOM' ? 'CUSTOM' : uniqueKeyFromDateConfiguration(option);
    return (
      <QuickOption
        key={key}
        optionConfig={option}
        isActive={currentQuickOption === option}
        onClick={() =>
          dispatch({
            currentQuickOption,
            datePickerContext,
            type: 'QUICK_OPTION_CHANGE',
            newQuickOption: option,
          })
        }
      />
    );
  });

  return (
    <div className="zen-date-picker__quick-options" role="tablist">
      <div className="zen-date-picker__quick-options-title u-info-text">
        {TEXT.quickOptions}
      </div>
      {quickOptionRows}
    </div>
  );
}

export default (React.memo(
  QuickOptionsContainer,
): React.AbstractComponent<Props>);
