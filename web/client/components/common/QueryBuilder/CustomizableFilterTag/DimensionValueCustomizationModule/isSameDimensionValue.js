// @flow
import type DimensionValue from 'models/core/wip/Dimension/DimensionValue';

export default function isSameDimensionValue(
  valA: DimensionValue,
  valB: DimensionValue,
): boolean {
  // TODO(david, stephen): Change this to compare ids when we have stable ids
  // dimension values. For now this is fine as a dimension value name should be
  // stable and unique within a single dimension.
  return valA.name() === valB.name();
}
