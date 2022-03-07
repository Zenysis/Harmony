// @flow
import * as React from 'react';

import DatasourceDigest from 'models/DataDigestApp/DatasourceDigest';
import DatasourceDigestCollection from 'models/DataDigestApp/DatasourceDigestCollection';
import DatasourceDigestTree from 'models/DataDigestApp/DatasourceDigestTree';
import DatasourceDropdown from 'components/DataDigestApp/DatasourceDropdown';
import DatasourceNamesExplainer from 'components/DataDigestApp/DatasourceNamesExplainer';
import Dropdown from 'components/ui/Dropdown';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import LoadingSpinner from 'components/ui/LoadingSpinner';

type Props = {
  datasourceDigestTree: DatasourceDigestTree,
  onSelectionsChange: (selections: {
    selectedDigest: DatasourceDigest | void,
    selectedDigestCollection: DatasourceDigestCollection,
  }) => void,
  selectedDigest: DatasourceDigest | void,
  selectedDigestCollection: DatasourceDigestCollection,
};

/**
 * This is the row with the dropdown selectors for Datasource, Date,
 * Metadata file, and the Download button
 */
export default function SelectionsRow({
  datasourceDigestTree,
  onSelectionsChange,
  selectedDigest,
  selectedDigestCollection,
}: Props): React.Node {
  const onDatasourceChange = (newDatasource: string) => {
    // keep the digest from the same date if possible, otherwise switch to
    // first digest
    const currentDigest = selectedDigest;
    const newDigestCollection = datasourceDigestTree.getDatasourceDigestCollection(
      newDatasource,
    );
    const firstDigest = newDigestCollection.getFirstDatasourceDigest();
    const newDigest = currentDigest
      ? newDigestCollection.getDigest(currentDigest.date()) || firstDigest
      : firstDigest;
    onSelectionsChange({
      selectedDigest: newDigest,
      selectedDigestCollection: newDigestCollection,
    });
  };

  const onDateChange = (newDigest: DatasourceDigest) => {
    onSelectionsChange({
      selectedDigestCollection,
      selectedDigest: newDigest,
    });
  };

  const dateOptions = React.useMemo(
    () =>
      selectedDigestCollection.getDigests().map(digest => (
        <Dropdown.Option key={digest.getStandardDateString()} value={digest}>
          {digest.getReadableDateString()}
        </Dropdown.Option>
      )),
    [selectedDigestCollection],
  );
  const datesDropdown = (
    <Dropdown
      defaultDisplayContent={I18N.textById('Date')}
      onSelectionChange={onDateChange}
      value={selectedDigest}
    >
      {dateOptions}
    </Dropdown>
  );

  return (
    <React.Suspense fallback={<LoadingSpinner />}>
      <Group.Horizontal alignItems="center" flex>
        <p>{I18N.text('Show overview for')}</p>
        <DatasourceDropdown
          datasources={datasourceDigestTree.datasourceNames()}
          onSelectionChange={onDatasourceChange}
          value={selectedDigestCollection.datasourceName()}
        />
        <p>{I18N.text('from')}</p>
        {datesDropdown}
        <DatasourceNamesExplainer />
      </Group.Horizontal>
    </React.Suspense>
  );
}
