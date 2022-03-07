// @flow
import * as React from 'react';

import type { SVGProps } from 'components/ui/Icon/internal/SVGs/types';

export default function BarGraphVisualization(
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
          d="M16.64 1H1.36c-.2 0-.36.34-.36.76V63h16V1.76c0-.42-.16-.76-.36-.76zm46 17.07H47.36c-.2 0-.36.25-.36.55V63h16V18.62c0-.3-.16-.55-.36-.55zm-23 17.07H24.36a.35.35 0 00-.36.33V63h16V35.47a.35.35 0 00-.36-.33z"
        />
        <path d="M18 64H0V1.75C0 .74.57 0 1.36 0h15.28C17.43 0 18 .74 18 1.75zM2 62h14V2H2zm62 2H46V18.61a1.45 1.45 0 011.36-1.54h15.28A1.45 1.45 0 0164 18.61zm-16-2h14V19.07H48zm-7 2H23V35.47a1.36 1.36 0 011.36-1.34h15.28A1.36 1.36 0 0141 35.47zm-16-2h14V36.14H25z" />
      </g>
    </svg>
  );
}
