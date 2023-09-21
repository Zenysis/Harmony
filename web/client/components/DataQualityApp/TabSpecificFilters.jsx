// @flow
import * as React from 'react';

import DimensionValueFilterSelector from 'components/DataQualityApp/DimensionValueFilterSelector';
import I18N from 'lib/I18N';
import LabelWrapper from 'components/ui/LabelWrapper';
import Moment from 'models/core/wip/DateTime/Moment';
import RangeSlider from 'components/ui/RangeSlider';
import TimeInterval from 'models/core/wip/DateTime/TimeInterval';
import type DimensionValueFilterItem from 'models/core/wip/QueryFilterItem/DimensionValueFilterItem';

type Props = {
  dateFilterOptions: $ReadOnlyArray<Moment>,
  dimensionValueFilter: DimensionValueFilterItem | void,
  onDimensionValueFilterSelected: (DimensionValueFilterItem | void) => void,
  onTimeIntervalSelected: TimeInterval => void,
  timeInterval: TimeInterval,
};

const DATE_FORMAT = 'MMM YYYY';

function formatDateValue(moment: Moment) {
  return moment.format(DATE_FORMAT);
}

function TabSpecificFilters({
  dateFilterOptions,
  dimensionValueFilter,
  onDimensionValueFilterSelected,
  onTimeIntervalSelected,
  timeInterval,
}: Props) {
  function onRangeChange(start: Moment, end: Moment) {
    onTimeIntervalSelected(TimeInterval.create({ end, start }));
  }

  function renderDateRangeSelector() {
    // Forces remount of the RangeSlider if the start or end date change
    const key = `${timeInterval.start().format()}
      ${timeInterval.end().format()}`;

    return (
      <LabelWrapper
        className="dq-tab-specific-filters-settings__right"
        inline
        label={I18N.textById('Date Range')}
      >
        <RangeSlider
          key={key}
          className="dq-tab-specific-filters-settings__time-slider"
          initialEnd={timeInterval.end()}
          initialStart={timeInterval.start()}
          onRangeChange={onRangeChange}
          valueFormatter={formatDateValue}
          values={dateFilterOptions}
        />
      </LabelWrapper>
    );
  }

  function renderDimensionValueFilterSelector() {
    return (
      <LabelWrapper
        className="dq-tab-specific-filters-settings__left"
        inline
        label={I18N.text('Categorical')}
      >
        <DimensionValueFilterSelector
          filter={dimensionValueFilter}
          onDimensionValueFilterSelected={onDimensionValueFilterSelected}
        />
      </LabelWrapper>
    );
  }

  return (
    <LabelWrapper
      className="dq-tab-specific-filters-settings"
      contentClassName="dq-tab-specific-filters-settings__content"
      inline
      label={I18N.textById('Filters')}
      labelClassName="dq-tab-specific-filters-settings__label"
    >
      {renderDimensionValueFilterSelector()}
      {renderDateRangeSelector()}
    </LabelWrapper>
  );
}

export default (React.memo(TabSpecificFilters): React.AbstractComponent<Props>);
