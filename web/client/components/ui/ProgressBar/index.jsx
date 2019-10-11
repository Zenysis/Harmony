// @flow
import * as React from 'react';

type Props = {|
  /** Extra class name to attach to the progress bar */
  className: string,

  /**
   * Enables rendering of the progress bar.
   * Nothing is rendered if its set to false
   */
  enabled: boolean,

  /**
   * The completed percentage of the task in progress.
   * Should be a number between 0 and 100
   */
  percentCompleted: number,
|};

const defaultProps = {
  className: '',
  enabled: true,
  percentCompleted: 100,
};

export default function ProgressBar(props: Props) {
  const { className, enabled, percentCompleted } = props;

  if (!enabled) {
    return null;
  }

  const barStyle = {
    width: `${percentCompleted}%`,
  };

  return (
    <div className={`progress ${className}`}>
      <div
        className="progress-bar progress-bar-striped active"
        style={barStyle}
      />
    </div>
  );
}

ProgressBar.defaultProps = defaultProps;
