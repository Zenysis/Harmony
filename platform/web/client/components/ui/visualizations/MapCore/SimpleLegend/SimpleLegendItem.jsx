// @flow
import * as React from 'react';
import classNames from 'classnames';

import * as Zen from 'lib/Zen';
import Group from 'components/ui/Group';
import Icon from 'components/ui/Icon';
import { noop } from 'util/util';
import type { IconType } from 'components/ui/Icon/types';

export type RowData = {
  +color: string,
  +iconType?: IconType,
  +label: string,
};

type Props = {
  disabledLegendIds?: Zen.Map<true>,
  onToggleLegend?: (legendId: string) => void,
  rows: $ReadOnlyArray<RowData>,
  symbolShape?: 'circle' | 'square',
  title: string,
};

function renderLegendRow(
  row: RowData,
  symbolShape: string,
  onToggleLegend: (legendId: string) => void,
  disableLegendIds: Zen.Map<true>,
) {
  const { color, iconType, label } = row;
  const symbol =
    iconType === undefined ? (
      <div
        className={`map-simple-legend__row-color map-simple-legend__row-color--${symbolShape}`}
        style={{ backgroundColor: color }}
      />
    ) : (
      <Icon style={{ color }} type={iconType} />
    );

  const isDisabled = disableLegendIds.has(label);
  const className = classNames('map-simple-legend__row', {
    'map-simple-legend__row--disabled': isDisabled,
  });

  return (
    <div key={`${color}--${label}`} className={className}>
      {symbol}
      <div
        aria-label={`toggle ${label}`}
        className="map-simple-legend__row-label"
        onClick={() => onToggleLegend(label)}
        role="button"
      >
        {label}
      </div>
    </div>
  );
}

/**
 * The SimpleLegendItem will render a series of rows, each with a color and
 * label.
 */
function SimpleLegendItem({
  disabledLegendIds = Zen.Map.create(),
  onToggleLegend = noop,
  rows,
  symbolShape = 'circle',
  title,
}: Props) {
  return (
    <div className="map-simple-legend__item">
      <div className="map-simple-legend__title">{title}</div>
      <Group.Vertical spacing="xs" spacingUnit="em">
        {rows.map(row =>
          renderLegendRow(row, symbolShape, onToggleLegend, disabledLegendIds),
        )}
      </Group.Vertical>
    </div>
  );
}

export default (React.memo(SimpleLegendItem): React.AbstractComponent<Props>);
