// @flow
import * as React from 'react';
import classNames from 'classnames';
import moment from 'moment';

import type { QuickOptionChoice } from 'components/ui/DatePicker/types';

type Props = {
  optionConfig: QuickOptionChoice,
  isActive: boolean,
  onClick: QuickOptionChoice => void,
};

const TEXT_PATH = 'ui.DatePicker.QuickOption';
const TEXT = t(TEXT_PATH);
const DATE_UNITS_TEXT_PATH = 'ui.DatePicker.dateUnits';
const DATE_UNITS_TEXT = t(DATE_UNITS_TEXT_PATH);

function quickOptionToString(optionConfig: QuickOptionChoice) {
  if (optionConfig === 'CUSTOM') {
    return TEXT.custom;
  }
  if (optionConfig.displayName) {
    return optionConfig.displayName;
  }

  switch (optionConfig.modifier) {
    case 'THIS':
      return DATE_UNITS_TEXT[optionConfig.dateUnit].THIS;
    case 'LAST':
      return t(`${optionConfig.dateUnit}.LAST`, {
        scope: DATE_UNITS_TEXT_PATH,
        count: optionConfig.numIntervals,
      });
    case 'BETWEEN':
      return `${moment(optionConfig.range.from).format(
        'YYYY-MM-DD',
      )} - ${moment(optionConfig.range.to).format('YYYY-MM-DD')}`;
    case 'SINCE':
      return t(TEXT_PATH, {
        scope: 'since',
        date: `${moment(optionConfig.date).format('YYYY-MM-DD')}`,
      });
    case 'ALL_TIME':
      return TEXT.allTime;
    case 'YEAR_TO_DATE':
      return TEXT.yearToDate;
    default:
      (optionConfig.modifier: empty);
      throw new Error(
        `You cannot set a DatePicker Quick Option with modifier: '${optionConfig.modifier}'`,
      );
  }
}

/**
 * This is one of the quick options that show up on the left column of the
 * date picker.
 */
export default function QuickOption({
  optionConfig,
  isActive,
  onClick,
}: Props): React.Element<'div'> {
  const onOptionClick = () => onClick(optionConfig);
  const content = quickOptionToString(optionConfig);
  const className = classNames(
    'zen-date-picker__quick-options-row u-info-text',
    {
      'zen-date-picker__quick-options-row--active': isActive,
    },
  );

  return (
    <div
      role="tab"
      aria-selected={isActive}
      className={className}
      onClick={onOptionClick}
    >
      {content}
    </div>
  );
}
