// @flow
import * as React from 'react';

import LegendItemRow from 'components/visualizations/LineGraph/LineGraphLegend/LegendItemRow';
import type { LegendItem } from 'components/visualizations/LineGraph/LineGraphLegend/types';

type Props = {
  className?: string,
  items: $ReadOnlyArray<LegendItem>,

  onClick?: string => void,
  onDoubleClick?: string => void,
  orientation: 'horizontal' | 'vertical',
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
          key={item.id}
          item={item}
          onClick={onClick}
          onDoubleClick={onDoubleClick}
        />
      ))}
    </div>
  );
}

export default (React.memo(LineGraphLegend): React.AbstractComponent<Props>);
