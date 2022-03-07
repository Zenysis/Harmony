// @flow
import * as React from 'react';

import DimensionValueService from 'services/wip/DimensionValueService';
import getDimensionValueMap from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/FilterSelectionBlock/getDimensionValueMap';
import { cancelPromise } from 'util/promiseUtil';
import type DimensionValue from 'models/core/wip/Dimension/DimensionValue';

type DimensionValueMap = {
  +[dimensionId: string]: $ReadOnlyArray<DimensionValue>,
  ...,
};

export default function useDimensionValueMap(): DimensionValueMap {
  const [
    dimensionValueMap,
    setDimensionValueMap,
  ] = React.useState<DimensionValueMap>({});

  React.useEffect(() => {
    const promise = DimensionValueService.getAll().then(dimensionValues =>
      setDimensionValueMap(getDimensionValueMap(dimensionValues)),
    );
    return () => cancelPromise(promise);
  }, []);

  return dimensionValueMap;
}
