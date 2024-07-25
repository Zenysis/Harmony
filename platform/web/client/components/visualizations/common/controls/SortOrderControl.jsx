// @flow
import * as React from 'react';

import DropdownControl, {
  Option,
} from 'components/visualizations/common/controls/DropdownControl';
import I18N from 'lib/I18N';
import {
  SORT_ALPHABETICAL,
  SORT_ASCENDING,
  SORT_DESCENDING,
} from 'components/QueryResult/graphUtil';
import type { VisualizationControlProps } from 'components/visualizations/common/controls/commonTypes';

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
  labelForAlphabeticalOption = I18N.textById('Alphabetical'),
}: Props): React.Node {
  const alphabeticalOption = includeAlphabetical ? (
    <Option value={SORT_ALPHABETICAL}>{labelForAlphabeticalOption}</Option>
  ) : null;

  return (
    <DropdownControl
      buttonMinWidth={buttonMinWidth}
      controlKey={controlKey}
      label={I18N.text('Sort order')}
      onValueChange={onValueChange}
      value={value}
    >
      <Option value={SORT_ASCENDING}>
        <I18N>Ascending</I18N>
      </Option>
      <Option value={SORT_DESCENDING}>
        <I18N>Descending</I18N>
      </Option>
      {alphabeticalOption}
    </DropdownControl>
  );
}
