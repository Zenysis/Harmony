// @flow
import * as React from 'react';

import I18N from 'lib/I18N';
import normalizeARIAName from 'components/ui/util/normalizeARIAName';
import type { StyleObject } from 'types/jsCore';

type Props = {
  /** The aria label for the loading spinner */
  ariaName?: string,

  /** Extra class name to attach to the loading spinner */
  className?: string,

  /** The color of the spinner */
  color?: string,

  /** Determines if the spinner is shown. */
  loading?: boolean,

  /** Diameter (in pixels) of the spinner */
  size?: number,

  /** Extra styles to attach to the loading spinner */
  style?: StyleObject | void,
};

/**
 * A simple loading spinner to be used when waiting for data to load.
 */
function LoadingSpinner({
  ariaName = I18N.text('loading'),
  className = '',
  color = '#293742', // Equivalent to $dark-gray-3
  loading = true,
  size = 20,
  style = undefined,
}: Props): React.Element<'div'> | null {
  const styles = {
    borderColor: color,
    height: size,
    width: size,
    ...style,
  };

  return loading ? (
    <div
      aria-label={normalizeARIAName(ariaName)}
      className={`zen-loading-spinner ${className}`}
      style={styles}
    />
  ) : null;
}

export default (React.memo(LoadingSpinner): React.AbstractComponent<Props>);
