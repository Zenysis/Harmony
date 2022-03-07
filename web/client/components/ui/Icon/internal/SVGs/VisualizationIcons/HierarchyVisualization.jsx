// @flow
import * as React from 'react';

import type { SVGProps } from 'components/ui/Icon/internal/SVGs/types';

export default function HierarchyVisualization(
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
        <path d="M13 45a13 13 0 1113-13 13 13 0 01-13 13zm0-24a11 11 0 1011 11 11 11 0 00-11-11z" />
        <path d="M37 57a1 1 0 01-1-1V8a1 1 0 012 0v48a1 1 0 01-1 1z" />
        <path d="M25 31h12v2H25zM49 9H37a1 1 0 010-2h12a1 1 0 010 2zM49 57H37a1 1 0 010-2h12a1 1 0 010 2z" />
        <g fillOpacity="0.4" stroke="currentColor" strokeWidth="2">
          <circle cx="56" cy="8" r="7" />
          <circle cx="56" cy="56" r="7" />
          <circle cx="13" cy="32" r="12" />
        </g>
      </g>
    </svg>
  );
}
