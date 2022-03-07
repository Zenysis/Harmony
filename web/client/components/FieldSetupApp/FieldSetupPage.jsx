// @flow
import * as React from 'react';

import I18N from 'lib/I18N';
import UnpublishedFieldsTableContainer from 'components/FieldSetupApp/UnpublishedFieldsTableContainer';

// Field setup page wrapper that includes the title and unpublished fields table
// container.
export default function FieldSetupPage(): React.Element<'div'> {
  return (
    <div className="field-setup-page">
      <div className="field-setup-page__title">
        <I18N>Indicator Setup</I18N>
      </div>
      <React.Suspense fallback="loading">
        <UnpublishedFieldsTableContainer />
      </React.Suspense>
    </div>
  );
}
