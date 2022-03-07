// @flow
import * as React from 'react';

import type { SVGProps } from 'components/ui/Icon/internal/SVGs/types';

export default function School(props: SVGProps): React.Element<'svg'> {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 21 21"
      height="21"
      width="21"
      {...props}
    >
      <rect fill="none" x="0" y="0" width="21" height="21" />
      <path
        fill="currentColor"
        transform="translate(3 3)"
        d="M11,13v-1h2v-1H9.5v-1H13V9h-2V8h2V7h-2V6h2V5H9.5V4H13V3h-2V2h2V1H8v13h5v-1H11z M6,11H2V1h4V11z M6,12l-2,2l-2-2H6z"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="2"
      />
      <path
        fill="currentColor"
        transform="translate(3 3)"
        d="M11,13v-1h2v-1H9.5v-1H13V9h-2V8h2V7h-2V6h2V5H9.5V4H13V3h-2V2h2V1H8v13h5v-1H11z M6,11H2V1h4V11z M6,12l-2,2l-2-2H6z"
      />
    </svg>
  );
}
