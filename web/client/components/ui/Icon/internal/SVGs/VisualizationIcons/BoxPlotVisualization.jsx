// @flow
import * as React from 'react';

import type { SVGProps } from 'components/ui/Icon/internal/SVGs/types';

export default function BoxPlotVisualization(
  props: SVGProps,
): React.Element<'svg'> {
  return (
    <svg
      width="64px"
      height="64px"
      viewBox="0 0 64 64"
      color="#2D80C2"
      {...props}
    >
      <g fill="currentColor">
        <path
          fillOpacity="0.4"
          d="M2 37.83h12v6.72H2zM50 35.51h12v6.67H50zM26 29.05h12v9.46H26z"
        />
        <path d="M14.55 20.56H9V2h4a1 1 0 000-2H3a1 1 0 000 2h4v18.56H1.45A1.45 1.45 0 000 22v23.1a1.45 1.45 0 001.45 1.45H7v15.26H3a1 1 0 000 2h10a1 1 0 000-2H9V46.56h5.55A1.45 1.45 0 0016 45.11V22a1.45 1.45 0 00-1.45-1.44zm-.55 24H2v-6.73h12zM2 35.83V22.56h12v13.27zM62.55 23.83H57V11.29h4a1 1 0 000-2H51a1 1 0 000 2h4v12.54h-5.55A1.45 1.45 0 0048 25.28v17.45a1.45 1.45 0 001.45 1.45H55v8h-4a1 1 0 000 2h10a1 1 0 000-2h-4v-8h5.55A1.45 1.45 0 0064 42.73V25.28a1.45 1.45 0 00-1.45-1.45zM62 42.18H50v-6.67h12zm-12-8.67v-7.68h12v7.68zM38.55 18.51H33V7.57h4a1 1 0 000-2H27a1 1 0 000 2h4v10.94h-5.55A1.45 1.45 0 0024 20v19.1a1.45 1.45 0 001.45 1.45H31V56.1h-4a1 1 0 100 2h10a1 1 0 000-2h-4V40.51h5.55A1.45 1.45 0 0040 39.06V20a1.45 1.45 0 00-1.45-1.49zm-.55 20H26v-9.46h12zM26 27.05v-6.54h12v6.54z" />
      </g>
    </svg>
  );
}
