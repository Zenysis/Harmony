// @flow
import * as React from 'react';

import type { SVGProps } from 'components/ui/Icon/internal/SVGs/types';

export default function School(props: SVGProps): React.Element<'svg'> {
  return (
    <svg
      height="21"
      viewBox="0 0 21 21"
      width="21"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect fill="none" height="21" width="21" x="0" y="0" />
      <path
        d="M11,13v-1h2v-1H9.5v-1H13V9h-2V8h2V7h-2V6h2V5H9.5V4H13V3h-2V2h2V1H8v13h5v-1H11z M6,11H2V1h4V11z M6,12l-2,2l-2-2H6z"
        fill="currentColor"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="2"
        transform="translate(3 3)"
      />
      <path
        d="M11,13v-1h2v-1H9.5v-1H13V9h-2V8h2V7h-2V6h2V5H9.5V4H13V3h-2V2h2V1H8v13h5v-1H11z M6,11H2V1h4V11z M6,12l-2,2l-2-2H6z"
        fill="currentColor"
        transform="translate(3 3)"
      />
    </svg>
  );
}
