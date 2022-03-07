// @flow
import * as React from 'react';

import type { SVGProps } from 'components/ui/Icon/internal/SVGs/types';

export default function AnalyzeNotification(
  props: SVGProps,
): React.Element<'svg'> {
  return (
    <svg
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 60 60"
      {...props}
    >
      <path d="M59 60H1a1 1 0 010-2h58a1 1 0 010 2z" fill="#266092" />
      <path
        d="M11.77 59.45H2.08V33a2 2 0 012-2h5.69a2 2 0 012 2v26.45zm-7.69-2h5.69V33H4.08v24.45zM23.31 59.45h-9.69v-39.7a2 2 0 012-2h5.69a2 2 0 012 2v39.7zm-7.69-2h5.69v-37.7h-5.69v37.7zM34.85 59.45h-9.7V26.37a2 2 0 012-2h5.7a2 2 0 012 2v33.08zm-7.7-2h5.7V26.37h-5.7v31.08zM46.31 59.74h-9.54V2a2 2 0 012-2h5.54a2 2 0 012 2v57.74zm-7.54-2h5.54V2h-5.54v55.74zM57.92 59.45h-9.69V14.79a2 2 0 012-2h5.69a2 2 0 012 2v44.66zm-7.69-2h5.69V14.79h-5.69v42.66z"
        fill="#266092"
      />
    </svg>
  );
}
