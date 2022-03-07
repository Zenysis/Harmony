// @flow
import * as React from 'react';

import type { SVGProps } from 'components/ui/Icon/internal/SVGs/types';

export default function TableVisualization(
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
        <path d="M62.6,64H1.4A1.4,1.4,0,0,1,0,62.6V1.4A1.4,1.4,0,0,1,1.4,0H62.6A1.4,1.4,0,0,1,64,1.4V62.6A1.4,1.4,0,0,1,62.6,64ZM2,62H62V2H2Z" />
        <path d="M41.33 11h2v52h-2zM20.67 11h2v52h-2z" />
        <g fillOpacity="0.4" stroke="currentColor" strokeWidth="2">
          <rect x="1" y="1" width="62" height="10.33" rx="0.4" />
        </g>
      </g>
    </svg>
  );
}
