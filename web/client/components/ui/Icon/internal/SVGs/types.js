// @flow
import type { StyleObject } from 'types/jsCore';

export type SVGProps = {
  'aria-hidden': boolean,
  className: string,
  onClick?: (event: SyntheticMouseEvent<HTMLSpanElement>) => void,
  style?: StyleObject,
  role?: string,

  'aria-label'?: string,
};
