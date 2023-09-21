// @flow
import * as React from 'react';

import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import LabelWrapper from 'components/ui/LabelWrapper';
import {
  QUERY_POLICY_MAP,
  SOURCE_NAME,
} from 'services/models/QueryPolicy/constants';
import { getFullDimensionName } from 'models/core/wip/Dimension';
import type QueryPolicy from 'services/models/QueryPolicy';

type DisaggregatedDimensionQueryPolicies = {
  all: QueryPolicy | void,
  policies: $ReadOnlyArray<QueryPolicy>,
};

export type DisaggregatedQueryPolicies = {
  +[dimensionName: string]: DisaggregatedDimensionQueryPolicies,
};

const { queryPolicyDimensions } = window.__JSON_FROM_BACKEND;
export const EMPTY_POLICY_MAP: DisaggregatedQueryPolicies = queryPolicyDimensions.reduce(
  (acc, dimensionName) => {
    acc[dimensionName] = { all: undefined, policies: [] };
    return acc;
  },
  {},
);

/**
 * Takes a list of QueryPolicies and first disaggregates them by dimension, and
 * for each, further disaggregates by an `all` policy and individual ones
 */
export function disaggregateQueryPolicies(
  queryPolicies: $ReadOnlyArray<QueryPolicy>,
): DisaggregatedQueryPolicies {
  const policyMap = { ...EMPTY_POLICY_MAP };
  window.__JSON_FROM_BACKEND.queryPolicyDimensions.forEach(dimensionName => {
    policyMap[dimensionName] = { all: undefined, policies: [] };
  });

  queryPolicies.forEach(policy => {
    // We currently do not surface composite policies to users
    if (policy.getQueryPolicyType() === QUERY_POLICY_MAP.composite) {
      return;
    }
    const dimensionName = policy.dimension();
    if (!(dimensionName in policyMap)) {
      policyMap[dimensionName] = { all: undefined, policies: [] };
    }

    const dimensionValue = policy.dimensionValue();
    if (dimensionValue === null) {
      policyMap[dimensionName].all = policy;
    } else {
      const { policies } = policyMap[dimensionName];
      policyMap[dimensionName].policies = [...policies, policy];
    }
  });
  return policyMap;
}

/**
 * Takes a list of QueryPolicies and displays first the number of source
 * policies, and then all other dimensions.
 */
export function getQueryPolicyAccessDots(
  policies: $ReadOnlyArray<QueryPolicy>,
): React.Element<typeof LabelWrapper> | null {
  const dimensionToPoliciesMap = disaggregateQueryPolicies(policies);
  const sourceEntry = dimensionToPoliciesMap.source;
  let datasourcesText;
  if (sourceEntry && sourceEntry.all !== undefined) {
    datasourcesText = I18N.text('All data sources');
  } else if (sourceEntry) {
    datasourcesText = I18N.text(
      {
        one: '1 data source',
        other: '%(count)s data sources',
        zero: 'No data sources',
      },
      'datasourceCount',
      { count: sourceEntry.policies.length },
    );
  }

  // NOTE: We only want to differentiate dimension names when we have
  // more than 2 columns
  const dimensionArr = Object.keys(dimensionToPoliciesMap);
  const nonSourceDots = [];
  dimensionArr.forEach(dimensionId => {
    if (dimensionId !== SOURCE_NAME) {
      const entry = dimensionToPoliciesMap[dimensionId];
      let dimensionCount;
      // NOTE: This is attempting to pluralize dimension names by just sticking
      // an 's' on the end, which has mixed success. Union Council -> Union Councils
      // works, but Country -> Countrys does not.
      if (dimensionArr.length > 2 && entry.all !== undefined) {
        dimensionCount = I18N.text('All %(dimensionName)ss', {
          dimensionName: getFullDimensionName(dimensionId),
        });
      } else if (dimensionArr.length > 2) {
        dimensionCount = I18N.text(
          {
            one: '1 %(dimensionName)s',
            other: '%(count)s %(dimensionName)ss',
            zero: 'No %(dimensionName)ss',
          },
          'dimensionCount',
          {
            count: entry.policies.length,
            dimensionName: getFullDimensionName(dimensionId),
          },
        );
      } else if (entry.all !== undefined) {
        dimensionCount = I18N.text('All geographies');
      } else {
        dimensionCount = I18N.text(
          {
            one: '1 geography',
            other: '%(count)s geographies',
            zero: 'No geographies',
          },
          'geographyCount',
          { count: entry.policies.length },
        );
      }
      nonSourceDots.push(
        <Group.Horizontal key={dimensionId} testId="non-data-sources-text">
          <div className="admin-app-card-shared__dot" />
          {dimensionCount}
        </Group.Horizontal>,
      );
    }
  });

  if (!datasourcesText && nonSourceDots.length === 0) {
    return null;
  }

  const datasourcesBlock = datasourcesText ? (
    <Group.Horizontal testId="data-sources-text">
      <div className="admin-app-card-shared__dot" />
      {datasourcesText}
    </Group.Horizontal>
  ) : null;

  return (
    <LabelWrapper
      label={I18N.text('Data access')}
      labelClassName="admin-app-card-shared__header"
    >
      <Group.Vertical className="admin-app-card-shared__group" spacing="xxs">
        {datasourcesBlock}
        {nonSourceDots}
      </Group.Vertical>
    </LabelWrapper>
  );
}
