// @flow
import * as React from 'react';
import classNames from 'classnames';

import type { StyleObject } from 'types/jsCore';

type Size = 'small' | 'medium' | 'large';
type SizeMap = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
};

export const SIZES: SizeMap = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
};

type DefaultProps = {
  className?: string,
  size?: Size,
  style?: StyleObject,
};

type Props = {
  ...DefaultProps,
  children: React.Node,
};

/**
 * A basic Well component
 *
 * Sizes can be specified from the `Well.Sizes` constant:
 *
 * `Well.Sizes.SMALL | MEDIUM | LARGE`
 */
export default function Well({
  children,
  className = '',
  size = SIZES.MEDIUM,
  style = undefined,
}: Props): React.Element<'div'> {
  let sizeClass = '';
  if (size === SIZES.SMALL) {
    sizeClass = 'well-sm';
  } else if (size === SIZES.LARGE) {
    sizeClass = 'well-lg';
  }

  const divClassName = classNames('well', sizeClass, className);
  return (
    <div className={divClassName} style={style}>
      {children}
    </div>
  );
}

Well.Sizes = SIZES;
