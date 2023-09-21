// @flow
import * as React from 'react';
import { useFragment } from 'react-relay/hooks';

import CalculationUtil from 'models/core/wip/Calculation/CalculationUtil';
import type { Calculation } from 'models/core/wip/Calculation/types';
import type { useFieldCalculation_field$key } from './__generated__/useFieldCalculation_field.graphql';

export default function useFieldCalculation(
  field: useFieldCalculation_field$key,
): Calculation {
  const { serializedCalculation } = useFragment(
    graphql`
      fragment useFieldCalculation_field on field {
        serializedCalculation: calculation
      }
    `,
    field,
  );

  const calculation = React.useMemo(
    () => CalculationUtil.UNSAFE_deserialize(serializedCalculation),
    [serializedCalculation],
  );
  return calculation;
}
