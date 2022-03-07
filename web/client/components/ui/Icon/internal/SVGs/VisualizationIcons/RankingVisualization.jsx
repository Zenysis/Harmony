// @flow
import * as React from 'react';

import type { SVGProps } from 'components/ui/Icon/internal/SVGs/types';

export default function RankingVisualization(
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
        <path d="M33.16 19.76l6.36-10.23a1 1 0 00-.33-1.38 1 1 0 00-1.37.32L32 17.89zM28.46 23.54l-4.31 6.93a1 1 0 00.32 1.38A1 1 0 0025 32a1 1 0 00.85-.47l3.8-6.12zM39 55H25a1 1 0 010-2h14a1 1 0 010 2z" />
        <path d="M35.39 58.61a1 1 0 01-.71-.29 1 1 0 010-1.41l3.61-3.62a1 1 0 011.42 1.42l-3.62 3.61a1 1 0 01-.7.29z" />
        <path d="M39 55a1 1 0 01-.71-.29l-3.61-3.62a1 1 0 011.41-1.41l3.62 3.61a1 1 0 010 1.42A1 1 0 0139 55zM39 35h-5.11a1 1 0 010-2H39a1 1 0 010 2z" />
        <path d="M39 35a1 1 0 01-1-1v-5.11a1 1 0 012 0V34a1 1 0 01-1 1zM39 10h-5.11a1 1 0 010-2H39a1 1 0 010 2z" />
        <path d="M39 15.11a1 1 0 01-1-1V9a1 1 0 012 0v5.11a1 1 0 01-1 1zM38.67 35a1 1 0 01-.85-.47l-13.67-22a1 1 0 011.7-1.06l13.67 22a1 1 0 01-.33 1.38 1 1 0 01-.52.15z" />
        <g
          fillOpacity="0.4"
          transform="translate(1, -1)"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect width="18" height="18" y="46" rx=".2" />
          <rect width="18" height="18" y="24" rx=".2" />
          <rect width="18" height="18" y="2" rx=".2" />
          <rect width="18" height="18" x="44" y="25" rx=".2" />
          <rect width="18" height="18" x="44" y="46" rx=".2" />
          <rect width="18" height="18" x="44" y="2" rx=".2" />
        </g>
      </g>
    </svg>
  );
}
