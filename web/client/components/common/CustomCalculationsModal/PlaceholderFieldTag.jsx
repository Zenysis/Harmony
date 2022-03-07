// @flow
import * as React from 'react';
import ReactDOMServer from 'react-dom/server';

import Tag from 'components/ui/Tag';

type Props = {
  fieldId: string,
  label: string,
  lineNumber: number,
  startIndex: number,
  mode: 'editor' | 'viewer',
};

/**
 * This tag is a placeholder whose only purpose is to be converted to HTML so
 * it can be inserted into the FormulaEditor's inner HTML. Once inserted,
 * it is then converted to a FormulaFieldTag so it can be a part of the React
 * component tree.
 */
export default function PlaceholderFieldTag({
  fieldId,
  label,
  lineNumber,
  startIndex,
  mode,
}: Props): React.Node {
  if (mode === 'viewer') {
    return (
      <Tag value={label} size={Tag.Sizes.SMALL}>
        {label}
      </Tag>
    );
  }

  if (mode === 'editor') {
    return (
      <span
        className="custom-calculations-formula-editor__field-tag"
        data-field-id={fieldId}
        data-line-number={lineNumber}
        data-start-index={startIndex}
        data-end-index={startIndex + label.length}
      />
    );
  }

  throw new Error(`[PlaceholderFieldTag] Invalid mode passed: ${mode}`);
}

PlaceholderFieldTag.asHTML = (props: Props): string =>
  ReactDOMServer.renderToString(<PlaceholderFieldTag {...props} />);
