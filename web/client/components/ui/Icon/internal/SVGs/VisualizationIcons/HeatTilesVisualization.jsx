// @flow
import * as React from 'react';

import type { SVGProps } from 'components/ui/Icon/internal/SVGs/types';

export default function HeatTilesVisualization(
  props: SVGProps,
): React.Element<'svg'> {
  return (
    <svg
      color="#2D80C2"
      data-viz-icon-no-outline
      height="64px"
      viewBox="0 0 64 64"
      width="64px"
      {...props}
    >
      <g fill="currentColor" stroke="currentColor" strokeWidth="1.5">
        <g fillOpacity="0.6">
          <rect height="13" rx=".4" width="13" x="17.33" y="1" />
          <rect height="13" rx=".4" width="13" x="1" y="33.67" />
          <rect height="13" rx=".4" width="13" x="50" y="33.67" />
          <rect height="13" rx=".4" width="13" x="17.33" y="50" />
        </g>
        <g fillOpacity="0.3">
          <rect height="13" rx=".4" width="13" x="50" y="1" />
          <rect height="13" rx=".4" width="13" x="1" y="17.33" />
          <rect height="13" rx=".4" width="13" x="33.67" y="17.33" />
          <rect height="13" rx=".4" width="13" x="50" y="50" />
        </g>
        <g fillOpacity="0">
          <rect height="13" rx=".4" width="13" x="1" y="1" />
          <rect height="13" rx=".4" width="13" x="33.67" y="1" />
          <rect height="13" rx=".4" width="13" x="17.33" y="17.33" />
          <rect height="13" rx=".4" width="13" x="50" y="17.33" />
          <rect height="13" rx=".4" width="13" x="17.33" y="33.67" />
          <rect height="13" rx=".4" width="13" x="33.67" y="33.67" />
          <rect height="13" rx=".4" width="13" x="1" y="50" />
          <rect height="13" rx=".4" width="13" x="33.67" y="50" />
        </g>
      </g>
    </svg>
  );
}
