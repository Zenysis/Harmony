import React from 'react';
import PropTypes from 'prop-types';
import ProgressBar from 'components/ui/ProgressBar';
import AlertMessage, { ALERT_TYPE } from 'components/common/AlertMessage';

const propTypes = {
  children: PropTypes.node.isRequired,

  className: PropTypes.string,
  footer: PropTypes.node,
  loading: PropTypes.bool,
  warning: PropTypes.string,
};

const defaultProps = {
  className: '',
  footer: null,
  loading: false,
  warning: '',
};

export default class Visualization extends React.PureComponent {
  maybeRenderWarning() {
    if (!this.props.warning) {
      return null;
    }

    return (
      <AlertMessage type={ALERT_TYPE.WARNING}>
        {this.props.warning}
      </AlertMessage>
    );
  }

  renderFooter() {
    const { footer, loading } = this.props;

    // Choosing visibility hidden instead of returning null so that
    // visualizations that rely on DOM calculations to compute size and position
    // can work with the post-loading layout.
    const style = loading ? { visibility: 'hidden' } : undefined;
    return (
      <div className="footer" style={style}>
        {footer}
        {this.maybeRenderWarning()}
      </div>
    );
  }

  renderVisualization() {
    const { children, loading } = this.props;

    // Choosing visibility hidden vs display none to allow third party
    // libraries that interact with the block to perform setup as if the
    // block is rendered.
    const style = loading ? { visibility: 'hidden' } : undefined;
    return (
      <div className="visualization" style={style}>
        {children}
      </div>
    );
  }

  render() {
    const { className, loading } = this.props;
    return (
      <div className={`visualization-block ${className}`}>
        <ProgressBar enabled={loading} />
        {this.renderVisualization()}
        {this.renderFooter()}
      </div>
    );
  }
}

Visualization.propTypes = propTypes;
Visualization.defaultProps = defaultProps;
