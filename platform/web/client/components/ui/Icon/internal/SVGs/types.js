// @flow
import type { StyleObject } from 'types/jsCore';

export type SVGProps = {
  'aria-hidden': boolean,
  'aria-label'?: string,
  className: string,
  onClick?: (event: SyntheticMouseEvent<HTMLSpanElement>) => void,
  role?: string,
  style?: StyleObject,
};
