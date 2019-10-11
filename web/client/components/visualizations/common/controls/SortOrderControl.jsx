// @flow
import * as React from 'react';

import Control from 'components/visualizations/common/controls/Control';
import DropdownControl, {
  Option,
} from 'components/visualizations/common/controls/DropdownControl';
import {
  SORT_ALPHABETICAL,
  SORT_ASCENDING,
  SORT_DESCENDING,
} from 'components/QueryResult/graphUtil';
import type { VisualizationControlProps } from 'components/visualizations/common/controls/commonTypes';

const TXT_LABEL = t('query_result.controls.sort_label');
const TXT_COMMON = t('query_result.common');

type Props = VisualizationControlProps<string> & {
  includeAlphabetical: boolean,
  labelForAlphabeticalOption: string,
};

const defaultProps = {
  ...Control.defaultColumnCounts,
  includeAlphabetical: false,
  labelForAlphabeticalOption: TXT_COMMON.alphabetical,
};

export default function SortOrderControl(props: Props) {
  const {
    includeAlphabetical,
    labelForAlphabeticalOption,
    ...passThroughControlProps
  } = props;
  const alphabeticalOption = includeAlphabetical ? (
    <Option value={SORT_ALPHABETICAL}>{labelForAlphabeticalOption}</Option>
  ) : null;

  return (
    <DropdownControl label={TXT_LABEL} {...passThroughControlProps}>
      <Option value={SORT_ASCENDING}>{TXT_COMMON.ascending}</Option>
      <Option value={SORT_DESCENDING}>{TXT_COMMON.descending}</Option>
      {alphabeticalOption}
    </DropdownControl>
  );
}

SortOrderControl.defaultProps = defaultProps;
