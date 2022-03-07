// @flow
import * as React from 'react';

import ConfigurationService from 'services/ConfigurationService';
import Dropdown from 'components/ui/Dropdown';
import Group from 'components/ui/Group';
import { cancelPromise } from 'util/promiseUtil';
import { noop } from 'util/util';
import type Configuration from 'services/models/Configuration';
import type { ChildProps } from 'components/AdminApp/ConfigurationTab/ConfigurationEntry';

const KEY_TEXT = t('admin_app.configuration.keys');

type Props = {
  ...ChildProps,
  configuration: Configuration,
  onConfigurationUpdated?: (updatedValue: Configuration) => void,
};

export default function DatasourceControl({
  configuration,
  onConfigurationUpdated = noop,
}: Props): React.Node {
  const [flagOptions, setFlagOptions] = React.useState<$ReadOnlyArray<string>>(
    [],
  );
  const [currentDatasource, setCurrentDatasource] = React.useState<string>('');

  React.useEffect(() => {
    const promise = ConfigurationService.getDatasourceDict().then(
      datasources => {
        setFlagOptions([...datasources.datasourceList, 'LATEST_DATASOURCE']);
        setCurrentDatasource(datasources.currentDatasource);
      },
    );
    return () => cancelPromise(promise);
  }, [setCurrentDatasource, setFlagOptions]);

  const onDatasourceSelection = React.useCallback(
    (selectedValue: string) => {
      const updatedConfiguration: Configuration = configuration.value(
        selectedValue,
      );
      onConfigurationUpdated(updatedConfiguration);
    },
    [configuration, onConfigurationUpdated],
  );

  const flagDropdownOptions = flagOptions.map(option => (
    <Dropdown.Option key={option} value={option}>
      {option}
    </Dropdown.Option>
  ));

  const value = configuration.value();
  const dropdownText: string = t(
    'admin_app.configuration.flagConfiguration.currentValueLabel',
    {
      key: KEY_TEXT[configuration.key()],
    },
  );

  return (
    <Group.Vertical spacing="s">
      {dropdownText}
      <Dropdown
        defaultDisplayContent={currentDatasource}
        value={value}
        onSelectionChange={onDatasourceSelection}
      >
        {flagDropdownOptions}
      </Dropdown>
    </Group.Vertical>
  );
}
