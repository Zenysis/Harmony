import React from 'react';
import PropTypes from 'prop-types';
import TextareaAutosize from 'react-autosize-textarea';
import classNames from 'classnames';

import ZenPropTypes from 'util/ZenPropTypes';
import { omit } from 'util/util';

const propTypes = {
  className: PropTypes.string,
  initialValue: ZenPropTypes.all([
    // use initialValue if component is uncontrolled
    PropTypes.string,
    ZenPropTypes.xor('value'),
  ]),
  isManuallyResizable: PropTypes.bool,
  onChange: PropTypes.func, // f(value: string, event: object)
  onResize: PropTypes.func, // f()
  // if set, will override maxHeight property in style prop
  maxHeight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  // if set, will override minHeight property in style prop
  minHeight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  maxRows: PropTypes.number,
  rows: PropTypes.number,
  style: PropTypes.object,
  value: PropTypes.string, // if using as a controlled component
};

const defaultProps = {
  className: null,
  minHeight: undefined,
  initialValue: undefined,
  isManuallyResizable: false,
  onChange: undefined,
  onResize: undefined,
  maxHeight: undefined,
  maxRows: undefined,
  rows: 1,
  style: {},
  value: undefined,
};

export default class TextArea extends React.Component {
  constructor(props) {
    super(props);
    const { value, initialValue } = this.props;
    this._isControlledComponent = value !== undefined;
    if (!this._isControlledComponent) {
      this.state = { value: initialValue };
    }

    this.onChange = this.onChange.bind(this);
  }

  getValue() {
    return this._isControlledComponent ? this.props.value : this.state.value;
  }

  getStyle() {
    const { minHeight, maxHeight, style } = this.props;
    return {
      ...style,
      minHeight: minHeight !== undefined ? minHeight : style.minHeight,
      maxHeight: maxHeight !== undefined ? maxHeight : style.maxHeight,
      resize: !this.props.isManuallyResizable ? 'none' : style.resize,
    };
  }

  onChange(event) {
    if (!this._isControlledComponent) {
      this.setState({ value: event.target.value });
    }

    if (this.props.onChange) {
      this.props.onChange(event.target.value, event);
    }
  }

  render() {
    const className = classNames(
      'zen-textarea form-control',
      this.props.className,
    );

    // Allowing passThrough props here so the user can still specify other
    // common DOM attributes (like style, onBlur, onFocus, etc.)
    const passThroughProps = omit(this.props, propTypes);
    return (
      <TextareaAutosize
        className={className}
        value={this.getValue()}
        onChange={this.onChange}
        onResize={this.props.onResize}
        maxRows={this.props.maxRows}
        rows={this.props.rows}
        style={this.getStyle()}
        {...passThroughProps}
      />
    );
  }
}

TextArea.propTypes = propTypes;
TextArea.defaultProps = defaultProps;
