// @flow
import * as React from 'react';

import type { SVGProps } from 'components/ui/Icon/internal/SVGs/types';

export default function HeatTilesVisualization(
  props: SVGProps,
): React.Element<'svg'> {
  return (
    <svg
      width="64px"
      height="64px"
      viewBox="0 0 64 64"
      color="#2D80C2"
      data-viz-icon-no-outline
      {...props}
    >
      <g fill="currentColor" stroke="currentColor" strokeWidth="1.5">
        <g fillOpacity="0.6">
          <rect width="13" height="13" x="17.33" y="1" rx=".4" />
          <rect width="13" height="13" x="1" y="33.67" rx=".4" />
          <rect width="13" height="13" x="50" y="33.67" rx=".4" />
          <rect width="13" height="13" x="17.33" y="50" rx=".4" />
        </g>
        <g fillOpacity="0.3">
          <rect width="13" height="13" x="50" y="1" rx=".4" />
          <rect width="13" height="13" x="1" y="17.33" rx=".4" />
          <rect width="13" height="13" x="33.67" y="17.33" rx=".4" />
          <rect width="13" height="13" x="50" y="50" rx=".4" />
        </g>
        <g fillOpacity="0">
          <rect width="13" height="13" x="1" y="1" rx=".4" />
          <rect width="13" height="13" x="33.67" y="1" rx=".4" />
          <rect width="13" height="13" x="17.33" y="17.33" rx=".4" />
          <rect width="13" height="13" x="50" y="17.33" rx=".4" />
          <rect width="13" height="13" x="17.33" y="33.67" rx=".4" />
          <rect width="13" height="13" x="33.67" y="33.67" rx=".4" />
          <rect width="13" height="13" x="1" y="50" rx=".4" />
          <rect width="13" height="13" x="33.67" y="50" rx=".4" />
        </g>
      </g>
    </svg>
  );
}
