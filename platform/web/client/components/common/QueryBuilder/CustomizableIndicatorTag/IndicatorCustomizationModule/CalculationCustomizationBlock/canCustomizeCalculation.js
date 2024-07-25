// @flow
import AverageOverTimeCalculation from 'models/core/wip/Calculation/AverageOverTimeCalculation';
import ComplexCalculation from 'models/core/wip/Calculation/ComplexCalculation';
import FormulaCalculation from 'models/core/wip/Calculation/FormulaCalculation';
import LastValueCalculation from 'models/core/wip/Calculation/LastValueCalculation';
import type { Calculation } from 'models/core/wip/Calculation/types';

// Determine if the customization module can support customizing the provided
// calculation. Complex calculations cannot be customized because the true
// calculation type is only resolvable on the backend. AverageOverTime and
// LastValue calculations cannot be customized because their underlying data
// points in the database would not make sense if calculated any other way.
// FormulaCalculation cannot be customized at this time because it is new and
// still evolving. There is no way to create a formula from the indicator form.
export default function canCustomizeCalculation(
  calculation: Calculation,
): boolean {
  return !(
    calculation instanceof ComplexCalculation ||
    calculation instanceof AverageOverTimeCalculation ||
    calculation instanceof LastValueCalculation ||
    calculation instanceof FormulaCalculation
  );
}
