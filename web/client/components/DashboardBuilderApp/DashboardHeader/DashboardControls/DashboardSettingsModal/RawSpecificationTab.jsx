// @flow
import * as React from 'react';

import I18N from 'lib/I18N';
import TextArea from 'components/common/TextArea';
import type Dashboard from 'models/core/Dashboard';

type Props = {
  active: boolean,
  dashboard: Dashboard,
  onRawSpecificationChange: (string | void) => void,
  rawSpecification: string | void,
};

export default function RawSpecificationTab({
  active,
  dashboard,
  onRawSpecificationChange,
  rawSpecification,
}: Props): React.Element<'div'> {
  // NOTE(stephen): Only serialize the specification if the tab is active. This
  // saves us from having to rebuild the JSON every time the spec changes.
  const initialRawSpecification = React.useMemo(() => {
    if (!active) {
      return '';
    }

    return JSON.stringify(dashboard.specification().serialize(), null, 2);
  }, [active, dashboard]);

  const onChange = React.useCallback(
    newRawSpecification => {
      // If the raw specification text is identical to the initial version, unset
      // the changes that have been made. Otherwise, store the new raw spec text.
      onRawSpecificationChange(
        newRawSpecification === initialRawSpecification
          ? undefined
          : newRawSpecification,
      );
    },
    [initialRawSpecification, onRawSpecificationChange],
  );

  return (
    <div className="raw-specification-tab">
      <p>
        <I18N id="pasteJSON">
          Paste the JSON representation of the Dashboard Specification below
        </I18N>
      </p>
      {active && (
        <TextArea
          onChange={onChange}
          maxHeight={400}
          value={rawSpecification || initialRawSpecification}
        />
      )}
    </div>
  );
}
