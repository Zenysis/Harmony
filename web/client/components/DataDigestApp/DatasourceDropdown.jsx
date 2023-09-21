// @flow
import * as React from 'react';

import Dropdown from 'components/ui/Dropdown';
import I18N from 'lib/I18N';
import useDatasourceLookup from 'components/common/useDatasourceLookup';
import { GLOBAL_PIPELINE_SUMMARY_KEY } from 'models/DataDigestApp/types';

type Props = {
  datasources: $ReadOnlyArray<string>,
  includeAllOption?: boolean,
  includeSourceId?: boolean,
  // TODO: Refine this type
  onSelectionChange: any,
  value: string | void,
};

export default function DatasourceDropdown({
  datasources,
  includeAllOption = false,
  includeSourceId = false,
  onSelectionChange,
  value,
}: Props): React.Node {
  const datasourceLookup = useDatasourceLookup();

  const allOption = includeAllOption ? (
    <Dropdown.Option value={GLOBAL_PIPELINE_SUMMARY_KEY}>
      All datasources
    </Dropdown.Option>
  ) : null;

  return (
    <Dropdown
      ariaName={I18N.text('select datasource')}
      defaultDisplayContent={I18N.textById('Datasource')}
      onSelectionChange={onSelectionChange}
      value={value}
    >
      {allOption}
      {datasources.map(source => (
        <Dropdown.Option key={source} value={source}>
          {includeSourceId
            ? `${datasourceLookup(source)} [${source}]`
            : datasourceLookup(source)}
        </Dropdown.Option>
      ))}
    </Dropdown>
  );
}
