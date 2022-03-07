// @flow
import * as React from 'react';

import DatasourceDigest from 'models/DataDigestApp/DatasourceDigest';
import DatasourceDigestService from 'services/DataDigestService';
import type LocationsDigestData from 'models/DataDigestApp/LocationsDigestData';

/**
 * Fetches the mapped locations data for a given DatasourceDigest.
 * Returns a tuple of the mapped locations digest (or undefined if none
 * could be found) and a boolean indicating whether or not the data is loading.
 */
export default function useMappedLocationsData(
  digest: DatasourceDigest | void,
): [LocationsDigestData | void, boolean] {
  const [
    mappedLocationsData,
    setMappedLocationsData,
  ] = React.useState<void | LocationsDigestData>(undefined);
  const [
    isLoadingMappedLocationData,
    setIsLoadingMappedLocationData,
  ] = React.useState(true);

  React.useEffect(() => {
    if (digest) {
      setIsLoadingMappedLocationData(true);
      DatasourceDigestService.getMappedLocationsData(digest).then(
        mappedLocations => {
          setMappedLocationsData(mappedLocations);
          setIsLoadingMappedLocationData(false);
        },
      );
    }
  }, [digest]);

  return [mappedLocationsData, isLoadingMappedLocationData];
}
