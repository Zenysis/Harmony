// @flow
import * as React from 'react';
import ReactDOMServer from 'react-dom/server';

import Field from 'models/core/Field';

type Props = {
  field: Field,
  lineNumber: number,
  startIndex: number,
  mode: 'editor' | 'viewer',
};

/**
 * This tag is a placeholder whose only purpose is to be converted to HTML so
 * it can be rendered in the FormulaEditor.
 */
export default function PlaceholderFieldTag(props: Props) {
  const { field, lineNumber, startIndex, mode } = props;

  if (mode === 'viewer') {
    return (
      <div className="custom-calculations-formula-viewer__tag">
        {field.label()}
      </div>
    );
  }

  if (mode === 'editor') {
    return (
      <span
        className="custom-calculations-formula-editor__field-tag"
        data-field-id={field.id()}
        data-line-number={lineNumber}
        data-start-index={startIndex}
        data-end-index={startIndex + field.label().length}
      />
    );
  }

  throw new Error(`[PlaceholderFieldTag] Invalid mode passed: ${mode}`);
}

PlaceholderFieldTag.asHTML = (props: Props) =>
  ReactDOMServer.renderToString(<PlaceholderFieldTag {...props} />);
