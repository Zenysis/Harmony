// @flow
import * as React from 'react';

import I18N from 'lib/I18N';
import Tooltip from 'components/ui/Tooltip';

type Props = {
  dimensionLabel: string,
  isTotalRow: boolean,
};

function NullDimensionCell({ dimensionLabel, isTotalRow }: Props): React.Node {
  if (isTotalRow) {
    return null;
  }

  return (
    <Tooltip
      content={I18N.text(
        'This row shows the value for all data where %(dimensionName)s is unknown or unmatched. This may happen for a few reasons such as when data is not reported against a certain group by at all or when locations have not been matched to the Master Facility List. Contact your data manager to resolve unknown or unmatched cases.',
        { dimensionName: dimensionLabel },
      )}
    >
      <div className="table-visualization__empty-dimension-cell">
        {I18N.text('Empty')}
      </div>
    </Tooltip>
  );
}

export default (React.memo(NullDimensionCell): React.AbstractComponent<Props>);
