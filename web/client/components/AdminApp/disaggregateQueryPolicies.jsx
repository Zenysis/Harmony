// @flow
import * as React from 'react';

import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import LabelWrapper from 'components/ui/LabelWrapper';
import {
  QUERY_POLICY_MAP,
  SOURCE_NAME,
} from 'services/models/QueryPolicy/constants';
import type QueryPolicy from 'services/models/QueryPolicy';

type DisaggregatedDimensionQueryPolicies = {
  all: QueryPolicy | void,
  policies: $ReadOnlyArray<QueryPolicy>,
};

export type DisaggregatedQueryPolicies = {
  +[dimensionName: string]: DisaggregatedDimensionQueryPolicies,
};

const { queryPolicyDimensions } = window.__JSON_FROM_BACKEND;
export const EMPTY_POLICY_MAP: DisaggregatedQueryPolicies = Object.keys(
  queryPolicyDimensions,
).reduce((acc, dimensionName) => {
  acc[dimensionName] = { all: undefined, policies: [] };
  return acc;
}, {});

/**
 * Takes a list of QueryPolicies and first disaggregates them by dimension, and
 * for each, further disaggregates by an `all` policy and individual ones
 */
export function disaggregateQueryPolicies(
  queryPolicies: $ReadOnlyArray<QueryPolicy>,
): DisaggregatedQueryPolicies {
  const policyMap = { ...EMPTY_POLICY_MAP };
  Object.keys(window.__JSON_FROM_BACKEND.queryPolicyDimensions).forEach(
    dimensionName => {
      policyMap[dimensionName] = { all: undefined, policies: [] };
    },
  );

  queryPolicies.forEach(policy => {
    // We currently do not surface composite policies to users
    if (policy.getQueryPolicyType() === QUERY_POLICY_MAP.composite) {
      return;
    }
    const dimensionFilter = policy.policyFilters();
    const dimensionName = dimensionFilter.keys()[0];
    if (!(dimensionName in policyMap)) {
      policyMap[dimensionName] = { all: undefined, policies: [] };
    }

    const dimensionEntry = dimensionFilter.get(dimensionName);
    if (dimensionEntry && dimensionEntry.allValues()) {
      policyMap[dimensionName].all = policy;
    } else {
      const { policies } = policyMap[dimensionName];
      policyMap[dimensionName].policies = [...policies, policy];
    }
  });
  return policyMap;
}

function getNumPoliciesText(
  entry: DisaggregatedDimensionQueryPolicies,
): string {
  const numIndividualPolicies = entry.policies.length;
  if (entry.all !== undefined) {
    return I18N.textById('All');
  }
  if (numIndividualPolicies === 0) {
    return I18N.textById('No');
  }
  return `${numIndividualPolicies}`;
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
  const datasourcesText = sourceEntry
    ? t('datasourceCount', {
        count: sourceEntry.policies.length,
        num: getNumPoliciesText(sourceEntry),
        scope: 'admin_app.disaggregateQueryPolicies',
      })
    : undefined;

  // NOTE(toshi): We only want to differentiate dimension names when we have
  // more than 2 columns
  const dimensionArr = Object.keys(dimensionToPoliciesMap);
  const nonSourceDots = [];
  dimensionArr.forEach(dimensionName => {
    if (dimensionName !== SOURCE_NAME) {
      const entry = dimensionToPoliciesMap[dimensionName];
      const numPolicies = getNumPoliciesText(entry);
      const dimensionCount =
        dimensionArr.length > 2
          ? t('dimensionCount', {
              dimensionName,
              count: entry.policies.length,
              num: numPolicies,
              scope: 'admin_app.disaggregateQueryPolicies',
            })
          : t('geographyCount', {
              count: entry.policies.length,
              num: numPolicies,
              scope: 'admin_app.disaggregateQueryPolicies',
            });
      nonSourceDots.push(
        <Group.Horizontal key={dimensionName} testId="non-data-sources-text">
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
