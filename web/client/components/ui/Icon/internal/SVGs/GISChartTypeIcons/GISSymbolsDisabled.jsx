// @flow
import * as React from 'react';

import type { SVGProps } from 'components/ui/Icon/internal/SVGs/types';

export default function GISSymbolsDisabled(
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
      <circle cx="16" cy="16" r="2.66667" fill="#BFC2C9" />
      <rect
        x="5.33337"
        y="5.33337"
        width="5.33333"
        height="5.33333"
        fill="#BFC2C9"
      />
      <path
        d="M16 5.33337L18.3094 9.33337H13.6906L16 5.33337Z"
        fill="#BFC2C9"
      />
      <path
        d="M8.00004 13.3334L8.59874 15.176H10.5362L8.96876 16.3148L9.56747 18.1574L8.00004 17.0186L6.43261 18.1574L7.03132 16.3148L5.46389 15.176H7.40134L8.00004 13.3334Z"
        fill="#BFC2C9"
      />
    </svg>
  );
}
