// @flow
import * as React from 'react';

import type { SVGProps } from 'components/ui/Icon/internal/SVGs/types';

export default function GISHeatMapDisabled(
  props: SVGProps,
): React.Element<'svg'> {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M0 5C0 2.23858 2.23858 0 5 0H19C21.7614 0 24 2.23858 24 5V19C24 21.7614 21.7614 24 19 24H5C2.23858 24 0 21.7614 0 19V5Z"
        fill="#E9E9E9"
      />
      <circle opacity="0.5" cx="12" cy="12" r="6.66667" fill="#BFC2C9" />
      <circle
        opacity="0.7"
        cx="12.0001"
        cy="12.0001"
        r="5.33333"
        fill="#BFC2C9"
      />
      <circle opacity="0.9" cx="12" cy="12" r="2.66667" fill="#BFC2C9" />
      <circle cx="12.0001" cy="12.0001" r="1.33333" fill="#BFC2C9" />
    </svg>
  );
}
