// @flow
import * as React from 'react';

import Control from 'components/visualizations/common/controls/Control';
import DropdownControl, {
  Option,
} from 'components/visualizations/common/controls/DropdownControl';
import type { VisualizationControlProps } from 'components/visualizations/common/controls/commonTypes';

type Props = VisualizationControlProps<number> & {
  maxResults: number,
  resultLimitOptions: Array<number>,

  buttonMinWidth?: number,
  showAllOption: boolean,
};

const defaultProps = {
  ...Control.defaultColumnCounts,
  buttonMinWidth: undefined,
  showAllOption: true,
};

const TXT_LIMIT_RESULTS = t('query_result.controls.limit_results');
const TXT_ALL = t('query_result.common.all');

export default function ResultLimitControl(props: Props) {
  const {
    maxResults,
    resultLimitOptions,
    showAllOption,
    value,
    ...passThroughControlProps
  } = props;

  // If the current number of results is less than the smallest result limit
  // option, and the all option is disabled, we can hide the result limit
  // control.
  if (maxResults < resultLimitOptions[0] && !showAllOption) {
    return null;
  }

  const actualValue =
    maxResults < Math.min(...resultLimitOptions) ? maxResults : value;

  const options = resultLimitOptions
    .filter(limit => !Number.isNaN(limit) && limit < maxResults)
    .map(limit => (
      <Option key={limit} value={limit}>
        {limit}
      </Option>
    ));

  if (showAllOption) {
    options.push(
      <Option key={maxResults} value={maxResults}>
        {TXT_ALL}
      </Option>,
    );
  }

  return (
    <DropdownControl
      label={TXT_LIMIT_RESULTS}
      value={actualValue}
      {...passThroughControlProps}
    >
      {options}
    </DropdownControl>
  );
}

ResultLimitControl.defaultProps = defaultProps;
