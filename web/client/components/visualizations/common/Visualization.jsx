// @flow
import * as React from 'react';

import AlertMessage, { ALERT_TYPE } from 'components/common/AlertMessage';
import ElementResizeService from 'services/ui/ElementResizeService';
import ProgressBar from 'components/ui/ProgressBar';
import autobind from 'decorators/autobind';
import type { ResizeRegistration } from 'services/ui/ElementResizeService';

type DefaultProps = {
  className: string,
  footer: React.Node,
  loading: boolean,
  warning: string,
};

type Props = {
  ...DefaultProps,
  children: React.Node | ((height: number, width: number) => React.Node),
};

type State = {
  height: number,
  width: number,
};

export default class Visualization extends React.Component<Props, State> {
  static defaultProps: DefaultProps = {
    className: '',
    footer: null,
    loading: false,
    warning: '',
  };

  resizeRegistration: ResizeRegistration<HTMLDivElement> = ElementResizeService.register<HTMLDivElement>(
    this.onResize,
  );

  state: State = { height: 10, width: 10 };

  @autobind
  onResize({ contentRect }: ResizeObserverEntry) {
    const { height, width } = contentRect;
    this.setState({ height, width });
  }

  maybeRenderWarning(): React.Node {
    if (!this.props.warning) {
      return null;
    }

    return (
      <AlertMessage type={ALERT_TYPE.WARNING}>
        {this.props.warning}
      </AlertMessage>
    );
  }

  renderFooter(): React.Node {
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

  renderVisualization(): React.Node {
    const { children, loading } = this.props;
    const { height, width } = this.state;

    // Choosing visibility hidden vs display none to allow third party
    // libraries that interact with the block to perform setup as if the
    // block is rendered.
    const style = loading ? { visibility: 'hidden' } : undefined;
    const vizContent =
      typeof children === 'function' ? children(height, width) : children;
    return (
      <div
        className="visualization"
        ref={this.resizeRegistration.setRef}
        style={style}
      >
        {vizContent}
      </div>
    );
  }

  render(): React.Node {
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
