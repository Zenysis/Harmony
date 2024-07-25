// @flow
import * as React from 'react';
import ReactDOMServer from 'react-dom/server';

import Tag from 'components/ui/Tag';

type Props = {
  fieldId: string,
  label: string,
  lineNumber: number,
  mode: 'editor' | 'viewer',
  startIndex: number,
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
  mode,
  startIndex,
}: Props): React.Node {
  if (mode === 'viewer') {
    return (
      <Tag size={Tag.Sizes.SMALL} value={label}>
        {label}
      </Tag>
    );
  }

  if (mode === 'editor') {
    return (
      <span
        className="custom-calculations-formula-editor__field-tag"
        data-end-index={startIndex + label.length}
        data-field-id={fieldId}
        data-line-number={lineNumber}
        data-start-index={startIndex}
      />
    );
  }

  throw new Error(`[PlaceholderFieldTag] Invalid mode passed: ${mode}`);
}

PlaceholderFieldTag.asHTML = (props: Props): string =>
  ReactDOMServer.renderToString(<PlaceholderFieldTag {...props} />);
