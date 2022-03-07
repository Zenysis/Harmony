// @flow
import * as React from 'react';

import DatasourceDigest from 'models/DataDigestApp/DatasourceDigest';
import DatasourceDigestService from 'services/DataDigestService';
import type LocationsDigestData from 'models/DataDigestApp/LocationsDigestData';

/**
 * Fetches the unmatched locations data for a given DatasourceDigest.
 * Returns a tuple of the unmatched locations digest (or undefined if none
 * could be found) and a boolean indicating whether or not the data is loading.
 */
export default function useUnmatchedLocationsData(
  digest: DatasourceDigest | void,
): [LocationsDigestData | void, boolean] {
  const [
    unmatchedLocationsData,
    setUnmatchedLocationsData,
  ] = React.useState<void | LocationsDigestData>(undefined);
  const [
    isLoadingUnmatchedLocationData,
    setIsLoadingUnmatchedLocationData,
  ] = React.useState(true);

  React.useEffect(() => {
    if (digest) {
      setIsLoadingUnmatchedLocationData(true);
      DatasourceDigestService.getUnmatchedLocationsData(digest).then(
        unmatchedLocations => {
          setUnmatchedLocationsData(unmatchedLocations);
          setIsLoadingUnmatchedLocationData(false);
        },
      );
    }
  }, [digest]);

  return [unmatchedLocationsData, isLoadingUnmatchedLocationData];
}
