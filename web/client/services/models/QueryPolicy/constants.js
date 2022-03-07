// @flow

export type QUERY_POLICY_TYPE = 'DIMENSION' | 'DATASOURCE' | 'COMPOSITE';

export const QUERY_POLICY_MAP = {
  datasource: 'DATASOURCE',
  dimension: 'DIMENSION',
  composite: 'COMPOSITE',
};

export const QUERY_POLICY_NAME_TO_ID_MAP = {
  DATASOURCE: 1,
  DIMENSION: 2,
  COMPOSITE: 3,
};

export const QUERY_POLICY_ID_MAP: { [number]: QUERY_POLICY_TYPE, ... } = {};
Object.keys(QUERY_POLICY_NAME_TO_ID_MAP).forEach(policyType => {
  QUERY_POLICY_ID_MAP[QUERY_POLICY_NAME_TO_ID_MAP[policyType]] = policyType;
});

export const SOURCE_NAME = 'source';
export const SUBRECIPIENT_NAME = 'subrecipient';
