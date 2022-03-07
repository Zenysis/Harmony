// @flow
import * as React from 'react';

import type { SVGProps } from 'components/ui/Icon/internal/SVGs/types';

export default function LineGraphVisualization(
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
        <path d="M.87 0h.25A.87.87 0 012 .87V64H0V.87A.87.87 0 01.87 0z" />
        <path d="M64 62.87v.25a.87.87 0 01-.87.87H0V62h63.13a.87.87 0 01.87.87z" />
        <path d="M12.62086 22.41493L24.20806 11.396l1.37823 1.4493-11.5872 11.01893zM29.37992 12.9507l1.12763-1.6518 9.74564 6.653-1.12763 1.6518zM42.78098 17.76032L56.14854 6.32719l1.29996 1.5199-13.36756 11.43313zM28.42168 50.00476L40.17166 39.086l1.36145 1.46509-11.75 10.91876zM44.58156 39.86674l.94818-1.76096 10.91792 5.8787-.94818 1.76095zM12.59815 44.01124l1.1094-1.6641 12.58893 8.3926-1.1094 1.6641z" />
        <g fillOpacity="0.4" stroke="currentColor" strokeWidth="2">
          <circle cx="11.47" cy="24.91" r="2.52" />
          <circle cx="42.81" cy="20.3" r="2.52" />
          <circle cx="27.14" cy="10.59" r="2.52" />
          <circle cx="58.48" cy="5.21" r="2.52" />
          <circle cx="58.48" cy="45.76" r="2.52" />
          <circle cx="27.6" cy="52.48" r="2.52" />
          <circle cx="42.81" cy="38.3" r="2.52" />
          <circle cx="11.47" cy="41.56" r="2.52" />
        </g>
      </g>
    </svg>
  );
}
