// @flow
import * as React from 'react';

import normalizeARIAName from 'components/ui/util/normalizeARIAName';

type Props = {
  /** The accessibility name for this loading bar. Defaults to 'Loading' */
  ariaName?: string,

  /** Extra class name to attach to the progress bar */
  className?: string,

  /**
   * Enables rendering of the progress bar.
   * Nothing is rendered if its set to false
   */
  enabled?: boolean,

  /**
   * The completed percentage of the task in progress.
   * Should be a number between 0 and 100
   */
  percentCompleted?: number,
};

const TEXT = t('ui.ProgressBar');

export default function ProgressBar({
  ariaName = TEXT.loading,
  className = '',
  enabled = true,
  percentCompleted = 100,
}: Props): React.Element<'div'> | null {
  if (!enabled) {
    return null;
  }

  const barStyle = {
    width: `${percentCompleted}%`,
  };

  return (
    <div
      role="progressbar"
      className={`progress ${className}`}
      aria-label={normalizeARIAName(ariaName)}
    >
      <div
        className="progress-bar progress-bar-striped active"
        style={barStyle}
      />
    </div>
  );
}
