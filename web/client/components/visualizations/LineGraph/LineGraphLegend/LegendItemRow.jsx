// @flow
import * as React from 'react';
import classNames from 'classnames';

import Tooltip from 'components/ui/Tooltip';
import type { LegendItem } from 'components/visualizations/LineGraph/LineGraphLegend/types';

type Props = {
  item: LegendItem,
  onClick: (string => void) | void,
  onDoubleClick: (string => void) | void,
};

const LINE_DASH_STYLE = {
  'line-dash': '9, 9',
  'line-dashdot': '9, 3, 3, 3',
  'line-dot': '3, 3',
  'line-longdash': '15, 15',
  'line-longdashdot': '15, 6, 3, 6',
  'line-solid': undefined,
};

function renderShape(shape: $PropertyType<LegendItem, 'shape'>) {
  if (shape === 'block') {
    return <rect height={10} width={30} />;
  }

  return (
    <line
      strokeDasharray={LINE_DASH_STYLE[shape]}
      strokeWidth={2}
      x1={0}
      x2={30}
      y1="50%"
      y2="50%"
    />
  );
}

function LegendItemRow({ item, onClick, onDoubleClick }: Props) {
  const labelRef = React.useRef<HTMLDivElement | null>(null);

  const { color, enabled, id, label, shape } = item;
  const itemRole =
    onClick !== undefined || onDoubleClick !== undefined ? 'button' : undefined;
  const className = classNames('line-graph-legend-item-row', {
    'line-graph-legend-item-row--disabled': !enabled,
  });

  // NOTE(stephen): Handling double clicks is kind of a pain. If there is both a
  // click listener and a double click listener, and a double click event is
  // triggered, 2 click events will also be triggered. We want to ensure that
  // only the double click event is triggered in this case.
  const clickHandlers = React.useMemo<{
    onClick?: (SyntheticMouseEvent<HTMLDivElement>) => void,
    onDoubleClick?: () => void,
  }>(() => {
    // If both a click handler and a double click handler are defined, we need
    // to differentiate a single and double click and only call the handler for
    // one of them.
    if (onClick !== undefined && onDoubleClick !== undefined) {
      let timeoutId;
      return {
        onClick: e => {
          if (e.nativeEvent.detail >= 2) {
            clearTimeout(timeoutId);
            timeoutId = undefined;
            onDoubleClick(id);
            return;
          }

          timeoutId = setTimeout(() => onClick(id), 200);
        },
      };
    }

    return {
      onClick: onClick !== undefined ? () => onClick(id) : undefined,
      onDoubleClick:
        onDoubleClick !== undefined ? () => onDoubleClick(id) : undefined,
    };
  }, [id, onClick, onDoubleClick]);

  // NOTE(david): If the label text is cutoff with elipses we display a tooltip
  // with the full label.
  const labelElt = labelRef.current;
  const textIsCutoff =
    labelElt !== null && labelElt.scrollWidth > labelElt.offsetWidth;

  const legendItemContents = (
    <div
      alt={label}
      className={className}
      key={`${color}-${label}`}
      role={itemRole}
      {...clickHandlers}
    >
      <svg
        className="line-graph-legend-item-row__marker"
        fill={color}
        height={10}
        stroke={color}
        width={30}
      >
        {renderShape(shape)}
      </svg>
      <div className="line-graph-legend-item-row__label" ref={labelRef}>
        {label}
      </div>
    </div>
  );

  if (textIsCutoff) {
    return <Tooltip content={label}>{legendItemContents}</Tooltip>;
  }

  return legendItemContents;
}

export default (React.memo(LegendItemRow): React.AbstractComponent<Props>);
