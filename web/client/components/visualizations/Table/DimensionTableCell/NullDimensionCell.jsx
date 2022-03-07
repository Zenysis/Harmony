// @flow
import * as React from 'react';

import Tooltip from 'components/ui/Tooltip';

const TEXT_PATH = 'visualizations.Table';
const TEXT = t(TEXT_PATH);

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
      content={t('nullDimensionValueTooltip', {
        scope: TEXT_PATH,
        dimensionName: dimensionLabel,
      })}
    >
      <div className="table-visualization__empty-dimension-cell">
        {TEXT.nullDimensionValue}
      </div>
    </Tooltip>
  );
}

export default (React.memo(NullDimensionCell): React.AbstractComponent<Props>);
