// @flow
import * as React from 'react';

import CaseManagementInfoContext from 'components/QueryResult/CaseManagementInfoContext';
import CheckboxControl from 'components/visualizations/common/controls/CheckboxControl';
import getLinkableCaseType from 'components/visualizations/Table/getLinkableCaseType';
import type GroupBySettings from 'models/core/QueryResultSpec/GroupBySettings';

type Props = {
  groupBySettings: GroupBySettings,
  isEnabled: boolean,
  onChange: (controlKey: string, value: boolean | string) => void,
};

const TEXT_PATH = 'visualizations.Table.TableControlsBlock';

/**
 * This control is used to allow table rows to link to case management.
 * This will only render if the query has the right dimensions selected
 * to link to a case type.
 */
export default function CasePageLinkingControl({
  groupBySettings,
  isEnabled,
  onChange,
}: Props): React.Node {
  const { allDruidCaseTypes } = React.useContext(CaseManagementInfoContext);
  if (allDruidCaseTypes.isEmpty()) {
    return null;
  }

  const linkableCaseType = getLinkableCaseType(
    allDruidCaseTypes,
    groupBySettings,
  );

  // does any case type's primary dimension match one of the queried dimensions?
  if (linkableCaseType) {
    return (
      <CheckboxControl
        controlKey="enableCasePageLinking"
        onValueChange={onChange}
        value={isEnabled}
        labelClassName="wrap-label-text"
        label={t('enableCasePageLinking', {
          scope: TEXT_PATH,
          caseTypeName: t('select_filter.labels')[
            linkableCaseType.primaryDruidDimension()
          ],
        })}
      />
    );
  }

  return null;
}
