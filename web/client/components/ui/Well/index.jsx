// @flow
import * as React from 'react';
import classNames from 'classnames';

type Size = 'small' | 'medium' | 'large';

export const SIZES: { [string]: Size } = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
};

type Props = {|
  children: React.Node,

  className: string,
  size: Size,
|};

const defaultProps = {
  className: '',
  size: SIZES.MEDIUM,
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
  className,
  size,
  ...passThroughProps
}: Props) {
  let sizeClass = '';
  if (size === SIZES.SMALL) {
    sizeClass = 'well-sm';
  } else if (size === SIZES.LARGE) {
    sizeClass = 'well-lg';
  }

  const divClassName = classNames('well', sizeClass, className);
  return (
    <div className={divClassName} {...passThroughProps}>
      {children}
    </div>
  );
}

Well.defaultProps = defaultProps;
Well.Sizes = SIZES;
