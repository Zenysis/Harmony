// @flow
import * as React from 'react';

import type { SVGProps } from 'components/ui/Icon/internal/SVGs/types';

export default function OverlappingBarGraphVisualization(
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
        <path d="M11.48 64h-5.2a1.39 1.39 0 01-1.41-1.36V51.07a1.39 1.39 0 011.41-1.36h5.2a1.39 1.39 0 011.41 1.36v11.57A1.39 1.39 0 0111.48 64zm-4.6-1.94h4V51.65h-4z" />
        <path d="M18 64h-6.52v-1.94a.59.59 0 00-.6.58v-11h-4v11a.59.59 0 00-.6-.58V64H0V42.9a1.38 1.38 0 011.4-1.36h15.24A1.38 1.38 0 0118 42.9zm-5.15-1.94H16V43.48H2v18.58h2.87v-11a1.39 1.39 0 011.41-1.36h5.2a1.39 1.39 0 011.41 1.36zM59 64h-8V38.27a1.39 1.39 0 011.41-1.36h5.2A1.39 1.39 0 0159 38.27zm-6-1.94h4V38.85h-4z" />
        <path d="M64 64h-7V38.85h-4V64h-7V1.36A1.39 1.39 0 0147.37 0h15.22A1.39 1.39 0 0164 1.36zm-5-1.94h3V1.94H48v60.12h3V38.27a1.39 1.39 0 011.41-1.36h5.2A1.39 1.39 0 0159 38.27zM36 64h-8V16.71a1.38 1.38 0 011.4-1.35h5.22A1.38 1.38 0 0136 16.71zm-6-1.94h4V17.3h-4z" />
        <path d="M30 64h-6.81V33.63a1.38 1.38 0 011.4-1.35H30zm-4.81-1.94H28V34.22h-2.8zM41.23 64H34V32.28h5.83a1.38 1.38 0 011.4 1.35zM36 62.06h3.21V34.22H36z" />
        <g fillOpacity="0.4">
          <rect width="6.01" height="12.35" x="5.87" y="50.68" rx="0.4" />
          <path d="M52.38 37.88h5.2a.4.4 0 01.4.4V63H52V38.28a.4.4 0 01.38-.4zM29.39 16.33h5.21a.4.4 0 01.4.4V63h-6V16.73a.4.4 0 01.39-.4z" />
        </g>
      </g>
    </svg>
  );
}
