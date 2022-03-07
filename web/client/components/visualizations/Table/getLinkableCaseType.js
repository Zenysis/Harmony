// @flow
import * as Zen from 'lib/Zen';
import type DruidCaseType from 'models/CaseManagementApp/DruidCaseType';
import type GroupBySettings from 'models/core/QueryResultSpec/GroupBySettings';

/**
 * Given a map of all DruidCaseTypes and the selected GroupBys, get
 * (if any) the DruidCaseType we can link to.
 *
 * A case type can be linked through our GroupBySettings only if we have
 * selected any dimension groupings that are equal to the case type's
 * primary dimension AND that case type does not have any other dimensions
 * that can be treated as primary dimensions.
 *
 * TODO(pablo): allow case types with multiple primary dimension to be linkable
 */
export default function getLinkableCaseType(
  druidCaseTypes: Zen.Map<DruidCaseType>,
  groupBySettings: GroupBySettings,
): DruidCaseType | void {
  // get all case types with a single primary dimension
  const linkableCaseTypes = druidCaseTypes
    .values()
    .filter(caseType => caseType.primaryDimensionNames().size() === 1);

  const dimensionNames = new Set(
    groupBySettings
      .groupings()
      .values()
      .filter(group => group.type() === 'STRING')
      .map(group => group.id()),
  );

  // get the first case type we find whose primary dimension is in our query
  // selections
  return linkableCaseTypes.find(caseType =>
    dimensionNames.has(caseType.primaryDruidDimension()),
  );
}
