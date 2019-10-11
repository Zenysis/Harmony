import React, { Component } from 'react';
import PropTypes from 'prop-types';

let widgetId = 0;

// Wrapper that puts anything inside a widget.

class Widget extends Component {
  constructor(props) {
    super(props);
    this.state = {
      id: `wid-id-${widgetId}`,
      isCollapsible: props.isCollapsible || props.collapsed,
      show: !props.collapsed,
      buttonValue: '+',
    };
    widgetId++; // Each widget needs a unique id.
    this.handlecollapseButtonClick = this.handlecollapseButtonClick.bind(this);
  }

  showHeader() {
    return (
      <header>
        <span className="widget-icon">
          {' '}
          <i className="glyphicon glyphicon-search" />{' '}
        </span>
        <h2>{this.props.title}</h2>
      </header>
    );
  }

  showBody() {
    return (
      <div>
        <div className="jarviswidget-editbox">
          <input className="form-control" type="text" />
        </div>

        <div className="widget-body">{this.props.children}</div>
      </div>
    );
  }

  showcollapseButton() {
    return (
      <div
        className="expand-button"
        onClick={this.handlecollapseButtonClick}
        role="button"
      >
        <h4>{this.state.buttonValue}</h4>
      </div>
    );
  }

  handlecollapseButtonClick() {
    this.setState({
      buttonValue: this.state.buttonValue === '+' ? '\u2013' : '+',
      show: !this.state.show,
    });
  }

  render() {
    return (
      <div className="widget-container">
        {this.props.collapsed && this.state.isCollapsible
          ? this.showcollapseButton()
          : null}
        <div className="jarviswidget" id={this.state.id}>
          {/* widget options:
              usage: div
              className="jarviswidget"
              id="wid-id-0"
              data-widget-editbutton="false"
              data-widget-colorbutton="false"
              data-widget-editbutton="false"
              data-widget-togglebutton="false"
              data-widget-deletebutton="false"
              data-widget-fullscreenbutton="false"
              data-widget-custombutton="false"
              data-widget-collapsed="true"
              data-widget-sortable="false"
            */}
          {this.showHeader()}
          {this.state.show ? this.showBody() : null}
        </div>
      </div>
    );
  }
}

Widget.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  isCollapsible: PropTypes.bool,
  collapsed: PropTypes.bool,
};

Widget.defaultProps = {
  collapsed: false,
  isCollapsible: false,
};

export default Widget;
