// @flow
import * as React from 'react';

export type RowData = {
  label: string,
  value: string | number,
};

type Props = {
  rows: $ReadOnlyArray<RowData>,
  className?: string,
  subtitle?: string | void,
  title?: string | void,
};

function renderRow({ label, value }: RowData) {
  return (
    <div key={label} className="viz-tooltip-table__row">
      <div className="viz-tooltip-table__row-label">{label}</div>
      <div className="viz-tooltip-table__row-value">{value}</div>
    </div>
  );
}

function maybeRenderTitleBlock(title: string, subtitle: string) {
  if (title.length === 0 && subtitle.length === 0) {
    return null;
  }

  return (
    <div
      className="viz-tooltip-table__title-block"
      key={`${title}--${subtitle}`}
    >
      {title.length > 0 && (
        <div className="viz-tooltip-table__title">{title}</div>
      )}
      {subtitle.length > 0 && (
        <div className="viz-tooltip-table__subtitle">{subtitle}</div>
      )}
    </div>
  );
}

/**
 * A simple table structure for rendering rows inside a tooltip.
 */
function TooltipTable({
  rows,
  className = '',
  subtitle = undefined,
  title = undefined,
}: Props) {
  return (
    <div className={`viz-tooltip-table ${className}`}>
      {maybeRenderTitleBlock(title || '', subtitle || '')}
      <div className="tooltip-table__rows">{rows.map(renderRow)}</div>
    </div>
  );
}

export default (React.memo(TooltipTable): React.AbstractComponent<Props>);
