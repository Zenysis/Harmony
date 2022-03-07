// @flow
import * as React from 'react';

import Checkbox from 'components/ui/Checkbox';
import I18N from 'lib/I18N';

type Props = {
  onSelectAllToggle: () => void,
  selectionState: 'checked' | 'indeterminate' | 'unchecked',
};

export default function TableHeader({
  onSelectAllToggle,
  selectionState,
}: Props): React.Element<'div'> {
  const checkboxValue =
    selectionState === 'indeterminate'
      ? 'indeterminate'
      : selectionState === 'checked';

  return (
    <div className="fs-unpublished-fields-table-rows__header-row" role="row">
      <div role="columnheader">
        <Checkbox
          className={`fs-unpublished-fields-table-rows__header-checkbox fs-unpublished-fields-table-rows__header-checkbox--${selectionState}`}
          onChange={onSelectAllToggle}
          value={checkboxValue}
        />
        <I18N>Indicator ID</I18N>
      </div>
      <div role="columnheader">
        <I18N>Name</I18N>
      </div>
      <div role="columnheader">
        <I18N>Short Name</I18N>
      </div>
      <div role="columnheader">
        <I18N.Ref id="Description" />
      </div>
      <div role="columnheader">
        <I18N>Calculation</I18N>
      </div>
      <div role="columnheader">
        <I18N>Category</I18N>
      </div>
      <div role="columnheader">
        <I18N.Ref id="Datasource" />
      </div>
    </div>
  );
}
