// @flow
import * as React from 'react';

import type { SVGProps } from 'components/ui/Icon/internal/SVGs/types';

export default function GISDots(props: SVGProps): React.Element<'svg'> {
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
      <circle cx="7.99992" cy="7.99998" fill="#3597E4" r="2.66667" />
      <ellipse
        cx="15.9999"
        cy="7.99998"
        fill="#3597E4"
        rx="2.66667"
        ry="2.66667"
      />
      <circle cx="15.9999" cy="16" fill="#3597E4" r="2.66667" />
      <ellipse cx="7.99992" cy="16" fill="#3597E4" rx="2.66667" ry="2.66667" />
    </svg>
  );
}
