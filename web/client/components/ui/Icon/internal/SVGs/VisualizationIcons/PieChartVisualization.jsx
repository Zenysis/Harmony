// @flow
import * as React from 'react';

import type { SVGProps } from 'components/ui/Icon/internal/SVGs/types';

export default function PieChartVisualization(
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
        <path d="M32 64c-.76 0-1.58 0-2.5-.11A31.93 31.93 0 017.73 11.22 31.75 31.75 0 0129.5.19L30.58.1v32.43l23.08 23-.82.7A32 32 0 0132 64zM28.58 2.28A30 30 0 002 32a30.1 30.1 0 0027.66 29.9c.86.07 1.63.1 2.34.1a30 30 0 0018.71-6.55l-22.13-22.1z" />
        <path d="M33.42 28.51V0l1.08.08a31.75 31.75 0 0118.29 7.57l.82.7zm2-26.33v21.51L50.65 8.48a29.64 29.64 0 00-15.23-6.3zM55.62 53.52L34 31.94l21.62-21.58.7.82a31.9 31.9 0 010 41.52zM36.84 31.94l18.65 18.62a29.9 29.9 0 000-37.25z" />
        <path
          d="M34.42 1.08v25L52.14 8.41a30.89 30.89 0 00-17.72-7.33zM55.56 52.05a30.9 30.9 0 000-40.22L35.42 31.94z"
          fillOpacity="0.4"
        />
      </g>
    </svg>
  );
}
