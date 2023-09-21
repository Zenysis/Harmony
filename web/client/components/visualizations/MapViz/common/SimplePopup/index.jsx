// @flow
import * as React from 'react';

import PopupContainer from 'components/visualizations/MapViz/common/PopupContainer';
import TooltipTable from 'components/ui/visualizations/common/SimpleTooltip/internal/TooltipTable';
import type { RowData } from 'components/ui/visualizations/common/SimpleTooltip/internal/TooltipTable';

type Props = {
  latitude: number,
  longitude: number,
  onRequestClose: (SyntheticMouseEvent<HTMLElement> | Event) => void,
  rows: $ReadOnlyArray<RowData>,
  subtitle?: string | void,
  title?: string | void,
};

/**
 * The SimplePopup provides a consistent popup experience for when all you need
 * to display is table with labels and values.
 */
function SimplePopup({
  latitude,
  longitude,
  onRequestClose,
  rows,
  subtitle = undefined,
  title = undefined,
}: Props) {
  return (
    <PopupContainer
      latitude={latitude}
      longitude={longitude}
      onRequestClose={onRequestClose}
    >
      <TooltipTable
        className="map-simple-popup"
        rows={rows}
        subtitle={subtitle}
        title={title}
      />
    </PopupContainer>
  );
}

export default (React.memo(SimplePopup): React.AbstractComponent<Props>);
