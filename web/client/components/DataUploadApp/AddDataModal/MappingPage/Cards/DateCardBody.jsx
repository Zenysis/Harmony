// @flow
import * as React from 'react';

import I18N from 'lib/I18N';
import type ColumnSpec from 'models/DataUploadApp/ColumnSpec';

type Props = {
  column: ColumnSpec,
};

export default function DateCardBody({ column }: Props): React.Node {
  return (
    column.error() && (
      <div className="data-upload-matching-card__message--error">
        <I18N>Date format not recognized</I18N>
      </div>
    )
  );
}
