// @flow
import * as React from 'react';

import DatasourceDigest from 'models/DataDigestApp/DatasourceDigest';
import DatasourceDigestCollection from 'models/DataDigestApp/DatasourceDigestCollection';
import DatasourceDigestTree from 'models/DataDigestApp/DatasourceDigestTree';
import DatasourceSummaryBlock from 'components/DataDigestApp/DatasourceOverview/DatasourceSummaryBlock';
import Group from 'components/ui/Group';
import IndicatorDigestBlock from 'components/DataDigestApp/DatasourceOverview/IndicatorDigestBlock';
import LocationsBlock from 'components/DataDigestApp/DatasourceOverview/LocationsBlock';
import SelectionsRow from 'components/DataDigestApp/DatasourceOverview/SelectionsRow';
import useMappedLocationsData from 'components/DataDigestApp/DatasourceOverview/useMappedLocationsData';
import useUnmatchedLocationsData from 'components/DataDigestApp/DatasourceOverview/useUnmatchedLocationsData';

type Props = {
  datasourceDigestTree: DatasourceDigestTree,
  initialDatasource: string,
};

// sets the datasource URL parameter if the datasource exists
function updateDatasourceURLParameter(datasource: string | void) {
  if (datasource) {
    const urlParams = new URLSearchParams(window.location.hash.substring(1));
    urlParams.set('datasource', datasource);
    window.location.hash = urlParams;
  }
}

export default function DatasourceOverview({
  datasourceDigestTree,
  initialDatasource,
}: Props): React.Node {
  const datasourceDigest = datasourceDigestTree.getFirstDatasourceDigestCollection();

  const [
    digestCollection,
    setDigestCollection,
  ] = React.useState<DatasourceDigestCollection>(datasourceDigest);

  const [digest, setDigest] = React.useState<DatasourceDigest | void>(
    digestCollection.getFirstDatasourceDigest(),
  );

  const [
    mappingLocationsData,
    isLoadingMappingLocationData,
  ] = useMappedLocationsData(digest);
  const [
    unmatchedLocationsData,
    isLoadingUnmatchedLocationData,
  ] = useUnmatchedLocationsData(digest);

  const onSelectionsChange = ({ selectedDigest, selectedDigestCollection }) => {
    setDigestCollection(selectedDigestCollection);
    setDigest(selectedDigest);
  };

  // update current datasource on mount
  React.useLayoutEffect(() => {
    const isDatasourceReal =
      initialDatasource &&
      datasourceDigestTree.datasourceDigests().has(initialDatasource);
    if (isDatasourceReal) {
      const selectedDigestCollection = datasourceDigestTree.getDatasourceDigestCollection(
        initialDatasource,
      );
      const selectedDigest = selectedDigestCollection.getFirstDatasourceDigest();
      onSelectionsChange({ selectedDigest, selectedDigestCollection });
    }
  }, [datasourceDigestTree, initialDatasource]);

  // update URL with current datasource whenever the current datasource digest changes
  React.useEffect(() => {
    if (digest) {
      updateDatasourceURLParameter(digest.datasourceName());
    }
  }, [digest]);

  return (
    <Group.Vertical spacing="xl">
      <SelectionsRow
        datasourceDigestTree={datasourceDigestTree}
        onSelectionsChange={onSelectionsChange}
        selectedDigest={digest}
        selectedDigestCollection={digestCollection}
      />
      <DatasourceSummaryBlock digest={digest} />
      <IndicatorDigestBlock digest={digest} />
      <LocationsBlock
        isLoadingLocationData={isLoadingUnmatchedLocationData}
        locationsData={unmatchedLocationsData}
        locationType="unmatched"
      />
      <LocationsBlock
        isLoadingLocationData={isLoadingMappingLocationData}
        locationsData={mappingLocationsData}
        locationType="mapped"
      />
    </Group.Vertical>
  );
}
