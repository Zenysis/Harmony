// @flow
import * as React from 'react';

import Checkbox from 'components/ui/Checkbox';
import I18N from 'lib/I18N';

const COLUMN_TITLES = [
  I18N.text('Name', 'name'),
  I18N.text('Description', 'description'),
  I18N.text('Data Source', 'dataSource'),
  I18N.text('Status', 'status'),
];

type Props = {
  onSelectAllToggle: () => void,
  selectionState: 'checked' | 'indeterminate' | 'unchecked',

  allowSelectAll?: boolean,
};

export default function DirectoryTableHeader({
  onSelectAllToggle,
  selectionState,

  allowSelectAll = true,
}: Props): React.Element<'div'> {
  // Convert our verbose representation of the selection state into a value that
  // is compatible with the Checkbox component.
  const checkboxValue =
    selectionState === 'indeterminate'
      ? 'indeterminate'
      : selectionState === 'checked';

  return (
    <div className="dc-directory-table-header" role="row">
      <div
        className={`dc-directory-table-header__checkbox dc-directory-table-header__checkbox--${selectionState}`}
      >
        {allowSelectAll && (
          <Checkbox onChange={onSelectAllToggle} value={checkboxValue} />
        )}
      </div>
      {COLUMN_TITLES.map(title => (
        <div key={title} role="columnheader">
          {title}
        </div>
      ))}
    </div>
  );
}
