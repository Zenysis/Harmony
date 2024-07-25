// @flow
import * as React from 'react';
import { useFragment } from 'react-relay/hooks';

import CalculationUtil from 'models/core/wip/Calculation/CalculationUtil';
import type { Calculation } from 'models/core/wip/Calculation/types';
import type { useUnpublishedFieldCalculation_unpublishedField$key } from './__generated__/useUnpublishedFieldCalculation_unpublishedField.graphql';

export default function useUnpublishedFieldCalculation(
  field: useUnpublishedFieldCalculation_unpublishedField$key,
): Calculation | void {
  const { serializedCalculation } = useFragment(
    graphql`
      fragment useUnpublishedFieldCalculation_unpublishedField on unpublished_field {
        serializedCalculation: calculation
      }
    `,
    field,
  );

  const calculation = React.useMemo(() => {
    return serializedCalculation
      ? CalculationUtil.UNSAFE_deserialize(serializedCalculation)
      : undefined;
  }, [serializedCalculation]);
  return calculation;
}
