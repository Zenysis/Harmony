// @flow
import * as React from 'react';

import type { SVGProps } from 'components/ui/Icon/internal/SVGs/types';

export default function ScorecardVisualization(props: SVGProps) {
  return (
    <svg
      width="64px"
      height="64px"
      viewBox="0 0 64 64"
      color="#2D80C2"
      data-viz-icon-no-outline
      {...props}
    >
      <g fill="currentColor">
        <path d="M62.6,64H1.4A1.4,1.4,0,0,1,0,62.6V1.4A1.4,1.4,0,0,1,1.4,0H62.6A1.4,1.4,0,0,1,64,1.4V62.6A1.4,1.4,0,0,1,62.6,64ZM2,62H62V2H2Z" />
        <path d="M41.33 11h2v52h-2zM20.67 11h2v52h-2z" />
        <rect
          fillOpacity="0.4"
          stroke="currentColor"
          strokeWidth="2"
          x="1"
          y="1"
          width="62"
          height="10.33"
          rx="0.4"
        />
        <g stroke="currentColor" strokeWidth="1.5">
          <rect
            x="21.67"
            y="12"
            width="20.66"
            height="8.6111"
            fillOpacity="0.1"
          />
          <rect
            x="21.67"
            y="20.6111"
            width="20.66"
            height="8.6111"
            fillOpacity="0.2"
          />
          <rect
            x="21.67"
            y="29.2222"
            width="20.66"
            height="8.6111"
            fillOpacity="0.3"
          />
          <rect
            x="21.67"
            y="37.8333"
            width="20.66"
            height="8.6111"
            fillOpacity="0.4"
          />
          <rect
            x="21.67"
            y="46.4444"
            width="20.66"
            height="8.6111"
            fillOpacity="0.5"
          />
          <rect
            x="21.67"
            y="55.0555"
            width="20.66"
            height="8.6111"
            fillOpacity="0.6"
          />
        </g>
      </g>
    </svg>
  );
}
