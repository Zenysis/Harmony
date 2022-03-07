// @flow
import * as React from 'react';

import type { SVGProps } from 'components/ui/Icon/internal/SVGs/types';

export default function ScatterplotVisualization(
  props: SVGProps,
): React.Element<'svg'> {
  return (
    <svg
      width="64px"
      height="64px"
      viewBox="0 0 64 64"
      color="#2D80C2"
      {...props}
    >
      <g fill="currentColor">
        <path d="M.87 0h.25A.87.87 0 012 .87V64H0V.87A.87.87 0 01.87 0z" />
        <path d="M64 62.87v.25a.87.87 0 01-.87.87H0V62h63.13a.87.87 0 01.87.87z" />
        <g fillOpacity="0.4" stroke="currentColor" strokeWidth="2">
          <circle cx="14" cy="47" r="7" />
          <circle cx="44" cy="43" r="7" />
          <circle cx="27" cy="22" r="12" />
          <circle cx="49" cy="6" r="5" />
          <circle cx="56" cy="24" r="3" />
        </g>
      </g>
    </svg>
  );
}
