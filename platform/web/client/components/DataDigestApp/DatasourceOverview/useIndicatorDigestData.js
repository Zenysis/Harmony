// @flow
import * as React from 'react';

import DatasourceDigest from 'models/DataDigestApp/DatasourceDigest';
import DatasourceDigestService from 'services/DataDigestService';
import FieldService from 'services/wip/FieldService';
import patchLegacyServices from 'components/DataCatalogApp/common/patchLegacyServices';
import type IndicatorDigestData from 'models/DataDigestApp/IndicatorDigestData';

// Patch services to use GraphQL relay queries instead of potions.
patchLegacyServices();

/**
 * Fetches the indicator digest data for a given DatasourceDigest.
 * Returns a tuple of the indicator digest model (or undefined if none could be
 * found), a boolean indicating whether or not the data is loading.
 */
export default function useIndicatorDigestData(
  digest: DatasourceDigest | void,
): [IndicatorDigestData | void, boolean] {
  const [
    indicatorDigestData,
    setIndicatorDigestData,
  ] = React.useState<void | IndicatorDigestData>(undefined);
  const [isLoadingIndicatorData, setIsLoadingIndicatorData] = React.useState(
    true,
  );

  React.useEffect(() => {
    if (digest) {
      FieldService.getMap().then(fieldMap => {
        setIsLoadingIndicatorData(true);
        DatasourceDigestService.getIndicatorDigestData(digest, fieldMap).then(
          indicatorDigest => {
            setIndicatorDigestData(indicatorDigest);
            setIsLoadingIndicatorData(false);
          },
        );
      });
    }
  }, [digest]);

  return [indicatorDigestData, isLoadingIndicatorData];
}
