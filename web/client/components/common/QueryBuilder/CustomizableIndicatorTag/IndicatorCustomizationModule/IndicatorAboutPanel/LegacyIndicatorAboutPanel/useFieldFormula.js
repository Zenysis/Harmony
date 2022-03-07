// @flow
import * as React from 'react';
import Promise from 'bluebird';

import ComplexCalculation from 'models/core/wip/Calculation/ComplexCalculation';
import Constituent from 'models/core/wip/Calculation/FormulaCalculation/Constituent';
import FieldInfoService from 'services/FieldInfoService';
import FieldService from 'services/wip/FieldService';
import FormulaCalculation from 'models/core/wip/Calculation/FormulaCalculation';
import { cancelPromise } from 'util/promiseUtil';
import type Field from 'models/core/wip/Field';

const FORMULA_MATCH_PATTERN = /[a-zA-Z][a-zA-Z0-9_]+/g;

// Find if this field ID has a formula representation. If it does, return a
// `FormulaCalculation` that is visually equivalent to the formula the backend
// will be using. If the field does not use a formula, return `undefined`.
// NOTE(stephen): This is primarily needed to support the "formula viewer" panel
// in the indicator customization module for non-data catalog deployments that
// still rely on ComplexCalculation.
// NOTE(stephen): This method is considered legacy since it relies on the
// legacy `FieldInfoService`.
export default function useFieldFormula(
  fieldId: string,
): FormulaCalculation | void {
  const [formula, setFormula] = React.useState<string | void>(undefined);
  const [
    calculation,
    setCalculation,
  ] = React.useState<FormulaCalculation | void>(undefined);

  React.useEffect(() => {
    const promise = FieldInfoService.fetchSingle(fieldId).then(fieldInfo => {
      if (fieldInfo.formula) {
        setFormula(fieldInfo.formula);
      }
    });

    return () => cancelPromise(promise);
  }, [fieldId]);

  React.useEffect(() => {
    if (formula === undefined) {
      return;
    }

    const fieldIds = Array.from(formula.matchAll(FORMULA_MATCH_PATTERN)).map(
      match => match[0],
    );
    if (fieldIds.length === 0) {
      return;
    }

    const promise = Promise.all(fieldIds.map(FieldService.get)).then(
      (fields: $ReadOnlyArray<Field | void>) => {
        const constituents = fields.map((field, idx) => {
          // The promises that are returned are in the same order as the field
          // IDs array. Sometimes, a Field will not exist for a field ID
          // (maybe the formula is referencing old variables? Maybe it is
          // referencing hidden fields?) so we fallback to using the field ID
          // as the name if it is missing.
          const constituentId = fieldIds[idx];
          const constituentName =
            field !== undefined ? field.canonicalName() : constituentId;

          // NOTE(stephen): Using a ComplexCalculation here since we do not
          // actually care what the calculation type should be. It will not
          // be used.
          const constituentCalculation =
            field !== undefined
              ? field.calculation()
              : ComplexCalculation.create({
                  calculationId: constituentId,
                  filter: null,
                });

          return Constituent.create({
            calculation: constituentCalculation,
            id: constituentId,
            name: constituentName,
          });
        });

        const formulaCalculation = FormulaCalculation.create({
          constituents,
          expression: formula,
        });

        setCalculation(formulaCalculation);
      },
    );

    // NOTE(stephen): Consistent returns are not needed for a useEffect hook.
    // eslint-disable-next-line consistent-return
    return () => cancelPromise(promise);
  }, [formula]);

  return calculation;
}
