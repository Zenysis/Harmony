// @flow
import * as React from 'react';

import type { StyleObject } from 'types/jsCore';

// The position represents the start and end index (inclusive) that should be
// highlighted in a string.
type Position = [number, number];

type DefaultProps = {
  className: string,
  highlightPositions: $ReadOnlyArray<Position>,
  style?: StyleObject,
};

type Props = {
  ...DefaultProps,
  text: string,
};

/**
 * Highlight the text substrings based on the highlight positions provided.
 */
export default class TextHighlighter extends React.PureComponent<Props> {
  static defaultProps: DefaultProps = {
    className: '',
    highlightPositions: [],
    style: undefined,
  };

  renderTextSlice(
    start: number,
    end: number,
    highlighted: boolean = false,
  ): React.Node {
    const key = `${start}-${end}`;
    const className = highlighted
      ? 'ui-text-highlighter__line--highlighted'
      : '';

    return (
      <span key={key} className={`ui-text-highlighter__line ${className}`}>
        {this.props.text.substring(start, end)}
      </span>
    );
  }

  renderFormattedText(): React.Node {
    const { highlightPositions, text } = this.props;
    const textLength = text.length;
    if (textLength === 0 || highlightPositions.length === 0) {
      return this.renderTextSlice(0, textLength);
    }

    const output = [];
    let curStart = 0;
    highlightPositions.forEach(([start, end]) => {
      // Render the non-highlighted portion first.
      if (start !== curStart) {
        output.push(this.renderTextSlice(curStart, start));
      }

      // Render the highlighted section.
      output.push(this.renderTextSlice(start, end + 1, true));
      curStart = end + 1;
    });

    // If there is a remaining piece after the last highlighted portion, render
    // it.
    if (curStart !== textLength) {
      output.push(this.renderTextSlice(curStart, textLength));
    }

    return output;
  }

  render(): React.Element<'span'> {
    const { className, style } = this.props;
    return (
      <span className={`${className} ui-text-highlighter`} style={style}>
        {this.renderFormattedText()}
      </span>
    );
  }
}
