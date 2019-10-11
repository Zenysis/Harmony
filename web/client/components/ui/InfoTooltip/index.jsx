// @flow
import * as React from 'react';
import ReactDOM from 'react-dom';

import autobind from 'decorators/autobind';
import type { StyleObject } from 'types/jsCore';

// TODO(pablo): this component has been massively hacked to fix a bug where
// tooltips would get hidden in components that had an overlay scroll or hidden.
// The proper fix is to extract the tooltip to a common Tooltip UI component
// that will handle all absolute or fixed positioning using React Portals.

type Props = {|
  /** Can be used to define the color, margins, etc of the tooltip */
  iconStyle?: StyleObject,

  /** The text to display when hovering over the tooltip */
  text?: string,

  /**
   * **HACK(pablo):** this is a temporary fix to make the tooltip show up
   * as a fixed position element, so that it can still render even if we
   * are in a component that has overflow auto/scroll/hidden.
   * A more stable fix is to actually create a Tooltip component that will
   * always position itself correctly in the window.
   */
  useFixedPositionTooltipHack: boolean,
|};

type State = {
  iconX: number | void,
  iconY: number | void,
};

export default class InfoTooltip extends React.PureComponent<Props, State> {
  // HACK(pablo): the node in which we will render the fixed position tooltip
  // as a hack until we finally create a proper Tooltip component
  _portalNode: HTMLDivElement = document.createElement('div');

  static defaultProps = {
    iconStyle: undefined,
    text: undefined,
    useFixedPositionTooltipHack: false,
  };

  state = {
    iconX: undefined,
    iconY: undefined,
  };

  componentDidMount() {
    if (document.body) {
      document.body.appendChild(this._portalNode);
    }
  }

  componentWillUnmount() {
    if (document.body) {
      document.body.removeChild(this._portalNode);
    }
  }

  @autobind
  onMouseOver(event: SyntheticEvent<HTMLSpanElement>) {
    const { top, left } = event.currentTarget.getBoundingClientRect();
    this.setState({
      iconX: left,
      iconY: top,
    });
  }

  @autobind
  onMouseOut() {
    this.setState({
      iconX: undefined,
      iconY: undefined,
    });
  }

  maybeRenderFixedPositionTooltip() {
    const { text } = this.props;
    const { iconX, iconY } = this.state;
    if (iconX !== undefined && iconY !== undefined) {
      const style = {
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderRadius: 5,
        color: '#ffffff',
        left: iconX,
        marginTop: 25,
        maxWidth: 240,
        padding: 10,
        position: 'fixed',
        top: iconY,
        transform: 'translateX(-50%)',
        zIndex: 1000,
      };

      return ReactDOM.createPortal(
        <span style={style}>{text}</span>,
        this._portalNode,
      );
    }
    return null;
  }

  renderIcon() {
    const { iconStyle } = this.props;
    return <span style={iconStyle} className="glyphicon glyphicon-info-sign" />;
  }

  renderFixedPositionHack() {
    return (
      <span
        onFocus={this.onMouseOver}
        onMouseOver={this.onMouseOver}
        onBlur={this.onMouseOut}
        onMouseOut={this.onMouseOut}
      >
        <span className="zen-info-tooltip">{this.renderIcon()}</span>
        {this.maybeRenderFixedPositionTooltip()}
      </span>
    );
  }

  render() {
    const { text, useFixedPositionTooltipHack } = this.props;
    if (useFixedPositionTooltipHack && text !== undefined) {
      return this.renderFixedPositionHack();
    }

    // if there is no text, this is just the icon with no tooltip
    if (text === undefined) {
      return this.renderIcon();
    }

    return (
      <span className="zen-info-tooltip" data-content={text}>
        {this.renderIcon()}
      </span>
    );
  }
}
