// @flow
import * as React from 'react';

type Props = {|
  /** Extra class name to attach to the loading spinner */
  className: string,

  /** The color of the spinner */
  color: string,

  /** Determines if the spinner is shown. */
  loading: boolean,

  /** Diameter (in pixels) of the spinner */
  size: number,
|};

// TODO(pablo): refactor into a functional component with React.memo once we
// upgrade to React 16.8
/**
 * A simple loading spinner to be used when waiting for data to load e.g. in the
 * hierarchical selector component.
 */
export default class LoadingSpinner extends React.PureComponent<Props> {
  static defaultProps = {
    className: '',
    color: '#293742', // Equivalent to $dark-grey-3
    loading: true,
    size: 20,
  };

  render(): React.Node {
    const { size, color, className } = this.props;
    const styles = {
      borderColor: color,
      height: size,
      width: size,
    };

    return (
      this.props.loading && (
        <div className={`zen-loading-spinner ${className}`}>
          <div style={styles} className="zen-loading-spinner__contents" />
        </div>
      )
    );
  }
}
