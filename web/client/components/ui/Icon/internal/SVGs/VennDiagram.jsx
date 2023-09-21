// @flow
import * as React from 'react';

import type { SVGProps } from 'components/ui/Icon/internal/SVGs/types';

export default function VennDiagram(props: SVGProps): React.Element<'svg'> {
  return (
    <svg
      fill="none"
      height="20"
      viewBox="0 0 20 20"
      width="20"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g
        fill="none"
        fillRule="evenodd"
        stroke="#000000"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="13.5" cy="10" r="6" />
        <circle cx="7.5" cy="10" r="6" />
      </g>
    </svg>
  );
}
