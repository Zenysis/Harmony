// @flow
import * as React from 'react';

import LegendItemRow from 'components/visualizations/LineGraph/LineGraphLegend/LegendItemRow';
import type { LegendItem } from 'components/visualizations/LineGraph/LineGraphLegend/types';

type Props = {
  items: $ReadOnlyArray<LegendItem>,
  orientation: 'horizontal' | 'vertical',

  className?: string,
  onClick?: string => void,
  onDoubleClick?: string => void,
};

function LineGraphLegend({
  items,
  orientation,
  className = '',
  onClick = undefined,
  onDoubleClick = undefined,
}: Props) {
  // prettier-ignore
  const fullClassName =
    `line-graph-legend line-graph-legend--${orientation} ${className}`;
  return (
    <div className={fullClassName}>
      {items.map(item => (
        <LegendItemRow
          item={item}
          key={item.id}
          onClick={onClick}
          onDoubleClick={onDoubleClick}
        />
      ))}
    </div>
  );
}

export default (React.memo(LineGraphLegend): React.AbstractComponent<Props>);
