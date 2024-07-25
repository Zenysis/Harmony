// @flow
import * as React from 'react';

import type { SVGProps } from 'components/ui/Icon/internal/SVGs/types';

export default function PharmacyPin(props: SVGProps): React.Element<'svg'> {
  return (
    <svg
      height="21"
      viewBox="0 0 21 21"
      width="21"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M17.612 0C11.005 0 5.647 5.321 5.647 11.885c0 3.358 3.295 9.374 3.295 9.374l8.229 13.96 8.586-13.797s3.814-5.74 3.814-9.537C29.572 5.321 24.216 0 17.612 0zm-.057 18.431a6.848 6.848 0 0 1-6.848-6.853 6.844 6.844 0 0 1 6.848-6.846 6.849 6.849 0 1 1 0 13.699z"
        fill="currentColor"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="2"
        transform="translate(3 3)"
      />
      <path
        d="M18.982 7.406h-2.705v3.081h-3.149v2.706h3.149v3.174h2.705v-3.174h3.108v-2.706h-3.108z"
        fill="currentColor"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="2"
        transform="translate(3 3)"
      />
    </svg>
  );
}
