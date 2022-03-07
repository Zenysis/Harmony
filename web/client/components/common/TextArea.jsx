// @flow
import * as React from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import classNames from 'classnames';

import autobind from 'decorators/autobind';
import type { StyleObject } from 'types/jsCore';

type DefaultProps = {
  className: string | void,
  maxHeight: string | number | void,
  maxRows: number | void,
  minHeight: string | number | void,
  rows: number,
  style: StyleObject | void,

  placeholder?: string,
};

type Props = {
  ...DefaultProps,
  onChange: (value: string) => void,
  value: string,
};

export default class TextArea extends React.Component<Props> {
  static defaultProps: DefaultProps = {
    className: undefined,
    maxHeight: undefined,
    maxRows: undefined,
    minHeight: undefined,
    placeholder: '',
    rows: 1,
    style: undefined,
  };

  getStyle(): StyleObject {
    const { minHeight, maxHeight, style } = this.props;
    const oldMinHeight = style ? style.minHeight : undefined;
    const oldMaxHeight = style ? style.maxHeight : undefined;
    const styleObject = {
      ...style,
      minHeight: minHeight !== undefined ? minHeight : oldMinHeight,
      maxHeight: maxHeight !== undefined ? maxHeight : oldMaxHeight,
    };

    return styleObject;
  }

  @autobind
  onChange(event: Event) {
    const { target } = event;

    if (target instanceof HTMLTextAreaElement) {
      this.props.onChange(target.value);
    }
  }

  render(): React.Node {
    const { maxRows, rows, value, placeholder } = this.props;
    const className = classNames(
      'zen-textarea form-control',
      this.props.className,
    );

    return (
      <TextareaAutosize
        className={className}
        value={value}
        onChange={this.onChange}
        maxRows={maxRows}
        rows={rows}
        style={this.getStyle()}
        placeholder={placeholder}
      />
    );
  }
}
