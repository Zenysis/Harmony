// @flow
import * as React from 'react';

import type { SVGProps } from 'components/ui/Icon/internal/SVGs/types';

export default function ErrorOutline(props: SVGProps): React.Element<'svg'> {
  return (
    <svg
      height="20"
      viewBox="0 0 20 20"
      width="20"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        fill="currentColor"
        d="M9.99175 1.66663C5.39175 1.66663 1.66675 5.39996 1.66675 9.99996C1.66675 14.6 5.39175 18.3333 9.99175 18.3333C14.6001 18.3333 18.3334 14.6 18.3334 9.99996C18.3334 5.39996 14.6001 1.66663 9.99175 1.66663ZM10.8334 10.8333V5.83329H9.16675V10.8333H10.8334ZM10.8334 14.1666V12.5H9.16675V14.1666H10.8334ZM3.33341 9.99996C3.33341 13.6833 6.31675 16.6666 10.0001 16.6666C13.6834 16.6666 16.6667 13.6833 16.6667 9.99996C16.6667 6.31663 13.6834 3.33329 10.0001 3.33329C6.31675 3.33329 3.33341 6.31663 3.33341 9.99996Z"
      />
    </svg>
  );
}
