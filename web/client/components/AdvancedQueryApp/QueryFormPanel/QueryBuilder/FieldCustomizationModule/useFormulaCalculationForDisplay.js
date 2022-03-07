// @flow
import * as React from 'react';

import Constituent from 'models/core/wip/Calculation/FormulaCalculation/Constituent';
import FormulaCalculation from 'models/core/wip/Calculation/FormulaCalculation';
import type Field from 'models/core/wip/Field';
import type { Calculation } from 'models/core/wip/Calculation/types';

// Build a displayable FormulaCalculation for the provided calculation and list
// of constituents. This is needed to be backwards-compatible with the
// non-DataCatalog version of the about panel. See comment in
// `FieldAboutPanelContent` for why we need to produce a special
// FormulaCalculation only for display purposes.
export default function useFormulaCalculationForDisplay(
  calculation: Calculation | void,
  constituentFields: $ReadOnlyArray<Field>,
): FormulaCalculation | void {
  return React.useMemo(() => {
    if (calculation === undefined) {
      return undefined;
    }

    if (calculation.tag === 'FORMULA') {
      return calculation;
    }

    // NOTE(stephen): Making this check *after* testing the calculation type
    // since it is possible, but unlikely, for there to be no constituentFields
    // for a FormulaCalculation. One example would be a pure mathematical
    // formula using only numbers and no fields.
    if (constituentFields.length === 0) {
      return undefined;
    }

    const constituentIds = [];
    const constituents = constituentFields.map(field => {
      const fieldId = field.id();
      constituentIds.push(fieldId);

      return Constituent.create({
        calculation: field.calculation(),
        id: fieldId,
        name: field.canonicalName(),
      });
    });

    // If we have constituent fields but we are *not* inside a
    // FormulaCalculation, then we must be working with a composite calculation.
    // Build a new FormulaCalculation from these constituents so that we are
    // able to visualize the true underlying formula.
    return FormulaCalculation.create({
      constituents,
      expression: constituentIds.join(' + '),
      filter: null,
    });
  }, [calculation, constituentFields]);
}
