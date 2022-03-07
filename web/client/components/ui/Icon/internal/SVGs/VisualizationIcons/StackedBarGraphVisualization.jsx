// @flow
import * as React from 'react';

import type { SVGProps } from 'components/ui/Icon/internal/SVGs/types';

export default function StackedBarGraphVisualization(
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
        <path d="M18 35.85H0V1.41A1.39 1.39 0 011.36 0h15.28A1.39 1.39 0 0118 1.41zm-16-2h14V2H2zM41 13.79H23V1.15A1.22 1.22 0 0124.36 0h15.28A1.22 1.22 0 0141 1.15zm-16-2h14V2H25zM64 48.88H46V1.57A1.46 1.46 0 0147.36 0h15.28A1.46 1.46 0 0164 1.57zm-16-2h14V2H48z" />
        <path d="M64 63.92H46V48.06a1.25 1.25 0 011.36-1.18h15.28A1.25 1.25 0 0164 48.06zm-16-2h14v-13H48zM41 63.92H23V13.39a1.46 1.46 0 011.36-1.61h15.28A1.46 1.46 0 0141 13.39zm-16-2h14V13.79H25zM.25 64L0 35.29a1.32 1.32 0 01.41-1 1.35 1.35 0 01.93-.39l15.29-.13a1.36 1.36 0 011 .39 1.32 1.32 0 01.4 1l.25 28.7zM2 35.93L2.23 62l14-.12-.23-26zm14.64-.12zM2 35.27zm14-.12z" />
        <g fillOpacity=".4">
          <path d="M62.64 47.88H47.36c-.2 0-.36.08-.36.18v14.86h16V48.06c0-.06-.16-.18-.36-.18zM39.64 12.78H24.36c-.2 0-.36.28-.36.61v49.53h16V13.39c0-.33-.16-.61-.36-.61zM16.64 34.8l-15.29.14a.35.35 0 00-.35.34L1.24 63l16-.14L17 35.14a.35.35 0 00-.36-.34z" />
        </g>
      </g>
    </svg>
  );
}
