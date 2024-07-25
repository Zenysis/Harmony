// @flow
import * as React from 'react';

import Checkbox from 'components/ui/Checkbox';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import InfoTooltip from 'components/ui/InfoTooltip';

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
        <I18N.Ref id="Name" />
      </div>
      <div role="columnheader">
        <I18N>Short Name</I18N>
      </div>
      <div role="columnheader">
        <I18N.Ref id="description" />
      </div>
      <div role="columnheader">
        <I18N>Calculation</I18N>
      </div>
      <div role="columnheader">
        <I18N>Category</I18N>
      </div>
      <div role="columnheader">
        <Group.Horizontal spacing="none">
          <I18N.Ref id="Data Source" />
          <InfoTooltip
            text={I18N.text(
              'The data source can only be populated by the pipeline. Indicators without a data source cannot be published.',
              'data-source-explanation',
            )}
          />
        </Group.Horizontal>
      </div>
    </div>
  );
}
