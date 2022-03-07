// @flow
import * as React from 'react';
import moment from 'moment';

import CalendarSettings from 'models/config/CalendarSettings';
import CustomizableTimeInterval from 'models/core/wip/QueryFilterItem/CustomizableTimeInterval';
import DatePicker from 'components/ui/DatePicker';
import DatePickerSettings from 'models/config/CalendarSettings/DatePickerSettings';
import I18N from 'lib/I18N';
import NegateFilterCheckbox from 'components/common/QueryBuilder/CustomizableFilterTag/NegateFilterCheckbox';
import autobind from 'decorators/autobind';
import isDateConfigurationValid from 'components/ui/DatePicker/isDateConfigurationValid';
import type { DateConfiguration } from 'components/ui/DatePicker/types';

const MIN_DATA_DATE: moment$Moment = moment(
  window.__JSON_FROM_BACKEND.ui.minDataDate,
);
const MAX_DATA_DATE: moment$Moment = moment(
  window.__JSON_FROM_BACKEND.ui.maxDataDate,
);

type DefaultProps = {
  onApplyClick?: (timeInterval: CustomizableTimeInterval) => void,
  onDateChanged?: (timeInterval: CustomizableTimeInterval) => void,
};

type Props = {
  ...DefaultProps,
  itemToCustomize: CustomizableTimeInterval,
  onItemCustomized: (item: CustomizableTimeInterval) => void,
};

export default class DateFilterCustomizationModule extends React.PureComponent<Props> {
  static defaultProps: DefaultProps = {
    onApplyClick: undefined,
    onDateChanged: undefined,
  };

  @autobind
  onDateConfigurationApply(dateConfiguration: DateConfiguration) {
    const { itemToCustomize, onItemCustomized, onApplyClick } = this.props;
    const intervalItem = itemToCustomize.updateDateConfiguration(
      dateConfiguration,
    );
    onItemCustomized(intervalItem);
    if (onApplyClick) {
      onApplyClick(intervalItem);
    }
  }

  @autobind
  onDateConfigurationChange(dateConfiguration: DateConfiguration) {
    const { itemToCustomize, onDateChanged } = this.props;
    if (isDateConfigurationValid(dateConfiguration) && onDateChanged) {
      const intervalItem = itemToCustomize.updateDateConfiguration(
        dateConfiguration,
      );
      onDateChanged(intervalItem);
    }
  }

  render(): React.Node {
    const { itemToCustomize, onItemCustomized } = this.props;
    const {
      enabledGranularities,
      defaultRelativeDates,
      enabledCalendarTypes,
      defaultCalendarType,
    } = DatePickerSettings.current().modelValues();

    return (
      <DatePicker
        className="date-filter-customization-module__date-picker"
        enabledDateGranularities={enabledGranularities}
        quickOptions={defaultRelativeDates}
        onApplyClick={this.onDateConfigurationApply}
        onDateConfigurationChange={this.onDateConfigurationChange}
        initialDateConfiguration={itemToCustomize.dateConfiguration()}
        applyButtonText={I18N.text('Apply date filter')}
        fiscalStartMonth={CalendarSettings.current().fiscalStartMonth()}
        minAllTimeDate={MIN_DATA_DATE}
        maxAllTimeDate={MAX_DATA_DATE}
        enabledCalendarTypes={enabledCalendarTypes}
        defaultCalendarType={defaultCalendarType}
        renderAdditionalEditorUI={() => (
          <NegateFilterCheckbox
            item={itemToCustomize}
            onItemCustomized={onItemCustomized}
          />
        )}
      />
    );
  }
}
