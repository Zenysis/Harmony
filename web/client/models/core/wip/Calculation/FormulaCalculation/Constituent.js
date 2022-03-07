// @flow
import * as Zen from 'lib/Zen';
// eslint-disable-next-line import/no-cycle
import CalculationUtil from 'models/core/wip/Calculation/CalculationUtil';
import type {
  Calculation,
  SerializedCalculation,
} from 'models/core/wip/Calculation/types';
import type { Serializable } from 'lib/Zen';
import type { SerializedCohortCalculationForQuery } from 'models/core/wip/Calculation/CohortCalculation';
import type { SerializedFormulaCalculationForQuery } from 'models/core/wip/Calculation/FormulaCalculation';

type Values = {
  calculation: Calculation,
  id: string,
  name: string,
};

type SerializedConstituent = {
  calculation: SerializedCalculation,
  id: string,
  name: string,
};

export type SerializedConstituentForQuery = {
  calculation:
    | SerializedCalculation
    | SerializedCohortCalculationForQuery
    | SerializedFormulaCalculationForQuery,
  id: string,
};

/**
 * The Constituent is a calculable value that is needed by the mathematical
 * formula evaluated by Constituent.
 *
 * NOTE(stephen): Once a Constituent is created, it is standalone. If the true
 * calculation or field name that it is based off changes, the Constituent
 * calculation *will not change*. It is up to the user to make sure the
 * Constituent is in-sync with what they expect.
 */
class Constituent extends Zen.BaseModel<Constituent, Values>
  implements Serializable<SerializedConstituent> {
  static deserializeAsync(
    values: SerializedConstituent,
  ): Promise<Zen.Model<Constituent>> {
    return CalculationUtil.deserializeAsync(values.calculation).then(
      calculation =>
        Constituent.create({
          calculation,
          id: values.id,
          name: values.name,
        }),
    );
  }

  static UNSAFE_deserialize(
    values: SerializedConstituent,
  ): Zen.Model<Constituent> {
    const calculation = CalculationUtil.UNSAFE_deserialize(values.calculation);
    return Constituent.create({
      calculation,
      id: values.id,
      name: values.name,
    });
  }

  serialize(): SerializedConstituent {
    return {
      calculation: this._.calculation().serialize(),
      id: this._.id(),
      name: this._.name(),
    };
  }

  serializeForQuery(): SerializedConstituentForQuery {
    const { calculation, id } = this.modelValues();
    return {
      calculation:
        calculation.tag === 'COHORT' || calculation.tag === 'FORMULA'
          ? calculation.serializeForQuery()
          : calculation.serialize(),
      id,
    };
  }
}

export default ((Constituent: $Cast): Class<Zen.Model<Constituent>>);
