// @flow
import * as React from 'react';
import classNames from 'classnames';
import moment from 'moment';

import I18N from 'lib/I18N';
import { DATE_UNITS } from 'util/dateUtil';
import type { QuickOptionChoice } from 'components/ui/DatePicker/types';

type Props = {
  isActive: boolean,
  onClick: QuickOptionChoice => void,
  optionConfig: QuickOptionChoice,
};

function quickOptionToString(optionConfig: QuickOptionChoice) {
  if (optionConfig === 'CUSTOM') {
    return I18N.text('Custom date range');
  }
  if (optionConfig.displayName) {
    return optionConfig.displayName;
  }

  switch (optionConfig.modifier) {
    case 'THIS':
      return DATE_UNITS[optionConfig.dateUnit].THIS;
    case 'LAST':
      return DATE_UNITS[optionConfig.dateUnit].LAST(optionConfig.numIntervals);
    case 'BETWEEN':
      return `${moment(optionConfig.range.from).format(
        'YYYY-MM-DD',
      )} - ${moment(optionConfig.range.to).format('YYYY-MM-DD')}`;
    case 'SINCE':
      return I18N.text('Since %(date)s', {
        date: `${moment(optionConfig.date).format('YYYY-MM-DD')}`,
      });
    case 'ALL_TIME':
      return I18N.text('All time');
    case 'YEAR_TO_DATE':
      return I18N.text('Year to date');
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
  isActive,
  onClick,
  optionConfig,
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
      aria-selected={isActive}
      className={className}
      onClick={onOptionClick}
      role="tab"
    >
      {content}
    </div>
  );
}
