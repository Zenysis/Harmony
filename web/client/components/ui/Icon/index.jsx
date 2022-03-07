// @flow
import * as React from 'react';

import normalizeARIAName from 'components/ui/util/normalizeARIAName';
import { SVG_MAP } from 'components/ui/Icon/internal/SVGs';
import type { IconType } from 'components/ui/Icon/types';
import type { SVGType } from 'components/ui/Icon/internal/SVGs';
import type { StyleObject } from 'types/jsCore';

type Props = {
  /**
   * A valid glyphicon suffix. You can find all glyphicons here:
   * https://getbootstrap.com/docs/3.3/components/
   *
   * This type can be imported from `components/ui/Icon/types`
   * */
  type: IconType,

  /**
   * Whether or not this icon should be hidden from accessibility tools,
   * such as screen readers. Typically we'd do this when an icon is placed
   * next to its text, making the icon redundant for a screen reader.
   */
  ariaHidden?: boolean,

  /** The accessibility name for this icon */
  ariaName?: string,
  className?: string,
  onClick?: (event: SyntheticMouseEvent<HTMLSpanElement>) => void,
  style?: StyleObject,
};

/**
 * An Icon component to render any glyphicon or custom SVG icon.
 * For glyphicons, the `type` prop is a glyphicon suffix taken from this list:
 * https://getbootstrap.com/docs/3.3/components/
 *
 * For SVGs, the type prop is key of `SVG_MAP` in
 * `components/ui/Icon/internal/SVGs/index.jsx`.
 */
export default function Icon({
  type,
  ariaHidden = false,
  ariaName = undefined,
  className = '',
  onClick = undefined,
  style = undefined,
}: Props): React.Node {
  const isSVG = type in SVG_MAP;
  const iconClassName = isSVG
    ? `zen-icon ${className}`
    : `zen-icon glyphicon glyphicon-${type} ${className}`;

  const IconElement = isSVG ? SVG_MAP[((type: $Cast): SVGType)] : 'span';

  const ariaNameToUse = normalizeARIAName(ariaName);
  if (onClick) {
    return (
      <IconElement
        role="button"
        aria-hidden={ariaHidden}
        aria-label={ariaNameToUse}
        onClick={onClick}
        className={iconClassName}
        style={style}
      />
    );
  }

  return (
    <IconElement
      aria-hidden={ariaHidden}
      aria-label={ariaNameToUse}
      className={iconClassName}
      style={style}
    />
  );
}
