// @flow
import * as React from 'react';

import type { SVGProps } from 'components/ui/Icon/internal/SVGs/types';

export default function GISHeatMap(props: SVGProps): React.Element<'svg'> {
  return (
    <svg
      fill="none"
      height="24"
      viewBox="0 0 24 24"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M0 5C0 2.23858 2.23858 0 5 0H19C21.7614 0 24 2.23858 24 5V19C24 21.7614 21.7614 24 19 24H5C2.23858 24 0 21.7614 0 19V5Z"
        fill="#E8F0FF"
      />
      <circle cx="12" cy="12" fill="#3597E4" opacity="0.5" r="6.66667" />
      <circle cx="12" cy="12" fill="#3597E4" opacity="0.7" r="5.33333" />
      <circle cx="12" cy="12" fill="#3597E4" opacity="0.9" r="2.66667" />
      <circle cx="12" cy="12" fill="#3597E4" r="1.33333" />
    </svg>
  );
}
