// @flow
import * as React from 'react';
import classNames from 'classnames';

import InfoTooltip from 'components/ui/InfoTooltip';
import type { StyleObject } from 'types/jsCore';

type SizesMap = {
  LARGE: 'large',
  MEDIUM: 'medium',
  SMALL: 'small',
};

const SIZES: SizesMap = {
  LARGE: 'large',
  MEDIUM: 'medium',
  SMALL: 'small',
};

type Props = {
  children: React.Node,
  size: 'large' | 'medium' | 'small',

  className: string,

  /**
   * Adds an info icon next to the heading, and shows a tooltip when you hover
   * over it
   */
  infoTooltip?: string,
  style?: StyleObject,

  /** Adds an underline to the heading */
  underlined?: boolean,

  /**
   * Render the heading with white text (useful for when against a dark
   * background
   */
  whiteText?: boolean,
};

const defaultProps = {
  className: '',
  style: undefined,
  infoTooltip: undefined,
};

/**
 * A basic heading component. It comes with three variants: Large, Medium and
 * Small.
 * These sizes can be specified through a `size` prop, but can also be specified
 * more succinctly by using `<Heading.Large>` or `<Heading.Small>` components.
 * This approach is encouraged because it is easier to read.
 */
export default function Heading({
  children,
  size,
  className = '',
  infoTooltip = undefined,
  style = undefined,
  underlined = false,
  whiteText = false,
}: Props): React.Node {
  const contents = (
    <React.Fragment>
      {children}
      {infoTooltip ? <InfoTooltip text={infoTooltip} /> : null}
    </React.Fragment>
  );

  const headingClassName = classNames(className, {
    'u-heading-large': size === 'large',
    'u-heading-medium': size === 'medium',
    'u-heading-small': size === 'small',
    'u-heading--underlined': underlined,
    'u-heading--white': whiteText,
  });

  const commonProps = {
    style,
    className: headingClassName,
  };

  switch (size) {
    case SIZES.LARGE:
      return <h1 {...commonProps}>{contents}</h1>;
    case SIZES.MEDIUM:
      return <h2 {...commonProps}>{contents}</h2>;
    case SIZES.SMALL:
      return <h3 {...commonProps}>{contents}</h3>;
    default:
      throw new Error(`[Heading] Invalid size '${size}' specified`);
  }
}

Heading.defaultProps = defaultProps;
Heading.Sizes = SIZES;

Heading.Large = (
  props: $Diff<React.ElementConfig<typeof Heading>, { size: mixed }>,
): React.Element<typeof Heading> => <Heading size={SIZES.LARGE} {...props} />;

Heading.Medium = (
  props: $Diff<React.ElementConfig<typeof Heading>, { size: mixed }>,
): React.Element<typeof Heading> => <Heading size={SIZES.MEDIUM} {...props} />;

Heading.Small = (
  props: $Diff<React.ElementConfig<typeof Heading>, { size: mixed }>,
): React.Element<typeof Heading> => <Heading size={SIZES.SMALL} {...props} />;
