// @flow
import * as React from 'react';

import DropdownControl, {
  Option,
} from 'components/visualizations/common/controls/DropdownControl';
import type { VisualizationControlProps } from 'components/visualizations/common/controls/commonTypes';

type Props = {
  ...VisualizationControlProps<number>,
  resultLimitOptions: $ReadOnlyArray<number>,

  buttonMinWidth?: number,
  showAllOption?: boolean,
};

const TXT_LIMIT_RESULTS = t('query_result.controls.limit_results');
const TXT_ALL = t('query_result.common.all');

// On 2019-10-15, a breaking change was made to the ResultLimitControl where
// the "All" value was changed to a static value of -1. Previously it was equal
// to a now removed `maxResults` prop. Some dashboards and cached sessions will
// still have this max value which is not located inside the result limit
// options. Find the correct bucket that includes this value or return -1 if
// it is larger than the biggest bucket.
function bucketValue(
  value: number,
  resultLimitOptions: $ReadOnlyArray<number>,
): number {
  if (value === -1 || resultLimitOptions.includes(value)) {
    return value;
  }

  const bucket = resultLimitOptions.find(v => v > value);
  return bucket === undefined ? -1 : bucket;
}

export default function ResultLimitControl({
  controlKey,
  onValueChange,
  resultLimitOptions,
  value,
  buttonMinWidth = undefined,
  showAllOption = true,
}: Props): React.Node {
  const options = resultLimitOptions.map(limit => (
    <Option key={limit} value={limit}>
      {limit}
    </Option>
  ));

  // The All option has a value of `-1` to show that all results should be
  // included. This is instead of hardcoding the maximum results possible since
  // the query result can change.
  if (showAllOption) {
    options.push(
      <Option key={-1} value={-1}>
        {TXT_ALL}
      </Option>,
    );
  }

  return (
    <DropdownControl
      label={TXT_LIMIT_RESULTS}
      labelClassName="wrap-label-text"
      value={bucketValue(value, resultLimitOptions)}
      controlKey={controlKey}
      onValueChange={onValueChange}
      buttonMinWidth={buttonMinWidth}
    >
      {options}
    </DropdownControl>
  );
}
