// @flow
import * as React from 'react';

import type { SVGProps } from 'components/ui/Icon/internal/SVGs/types';

export default function NoSearchResults(props: SVGProps): React.Element<'svg'> {
  return (
    <svg
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 114 114"
      height="114"
      width="114"
      {...props}
    >
      <circle cx="57" cy="57" r="57" fill="#EFF1F5" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M62.333 30.333H41c-2.933 0-5.307 2.4-5.307 5.334l-.026 42.666c0 2.934 2.373 5.334 5.306 5.334H73c2.933 0 5.333-2.4 5.333-5.334v-32l-16-16zM41 35.667h18.667L73 49v22.88l-4.907-4.907c3.414-5.173 2.854-12.186-1.706-16.746A13.225 13.225 0 0057 46.333c-3.413 0-6.8 1.307-9.413 3.894-5.2 5.2-5.2 13.626 0 18.8 2.586 2.586 6 3.893 9.413 3.893 2.56 0 5.12-.747 7.333-2.213l7.6 7.626H41V35.667zm16 31.946a7.93 7.93 0 005.627-2.346 7.82 7.82 0 002.346-5.627 7.93 7.93 0 00-2.346-5.627A7.821 7.821 0 0057 51.667a7.821 7.821 0 00-5.627 2.346 7.82 7.82 0 00-2.346 5.627 7.93 7.93 0 002.346 5.627A7.821 7.821 0 0057 67.613z"
        fill="#ABAEB4"
      />
    </svg>
  );
}
