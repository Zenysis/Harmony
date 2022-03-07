// @flow
import * as React from 'react';

import type { SVGProps } from 'components/ui/Icon/internal/SVGs/types';

export default function Calendar(props: SVGProps): React.Element<'svg'> {
  return (
    <svg
      height="24"
      viewBox="5 4 15 15"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fill="currentColor"
        d="M17.833 10.25V7.919l-1.75-.001v.58a.583.583 0 11-1.166 0v-.58l-5.834-.001v.581a.583.583 0 11-1.166 0v-.581H6.17c-.001 0-.002.984-.002 2.333h11.665zm0 1.167H6.168l-.001 6.414c0 .002 11.663.002 11.663.002.002 0 .002-3.562.003-6.416zm-1.75-4.667h1.747c.646 0 1.17.522 1.17 1.169v9.912A1.17 1.17 0 0117.83 19H6.17C5.524 19 5 18.478 5 17.831V7.919A1.17 1.17 0 016.17 6.75h1.747V5.585a.583.583 0 111.166 0V6.75h5.834V5.585a.583.583 0 111.166 0V6.75z"
      />
    </svg>
  );
}
