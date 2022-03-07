// @flow
import * as React from 'react';

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

type Props = {
  ...VisualizationControlProps<string>,
  buttonMinWidth?: number,
  includeAlphabetical?: boolean,
  labelForAlphabeticalOption?: string,
};

export default function SortOrderControl({
  controlKey,
  onValueChange,
  value,
  buttonMinWidth = undefined,
  includeAlphabetical = false,
  labelForAlphabeticalOption = TXT_COMMON.alphabetical,
}: Props): React.Node {
  const alphabeticalOption = includeAlphabetical ? (
    <Option value={SORT_ALPHABETICAL}>{labelForAlphabeticalOption}</Option>
  ) : null;

  return (
    <DropdownControl
      controlKey={controlKey}
      value={value}
      onValueChange={onValueChange}
      label={TXT_LABEL}
      buttonMinWidth={buttonMinWidth}
    >
      <Option value={SORT_ASCENDING}>{TXT_COMMON.ascending}</Option>
      <Option value={SORT_DESCENDING}>{TXT_COMMON.descending}</Option>
      {alphabeticalOption}
    </DropdownControl>
  );
}
