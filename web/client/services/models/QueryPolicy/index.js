// @flow
import * as Zen from 'lib/Zen';
import DimensionFilter from 'services/models/QueryPolicy/DimensionFilter';
import memoizeOne from 'decorators/memoizeOne';
import {
  QUERY_POLICY_ID_MAP,
  QUERY_POLICY_MAP,
  QUERY_POLICY_NAME_TO_ID_MAP,
  SOURCE_NAME,
} from 'services/models/QueryPolicy/constants';
import type { QUERY_POLICY_TYPE } from 'services/models/QueryPolicy/constants';
import type { Serializable } from 'lib/Zen';

export const ALL_DATA_SOURCES_POLICY_NAME = 'all_sources';

type SerializedQueryPolicy = {
  $uri: string,
  description: string,
  name: string,
  policyFilters: { [string]: Zen.Serialized<DimensionFilter>, ... },
  queryPolicyTypeId: number,
};

type RequiredValues = {
  /**
   * Query policy type.
   */
  queryPolicyTypeId: number,
};

type DefaultValues = {
  /**
   * A unique human-readable name to denote the query policy.
   */
  name: string,

  /**
   * A description of what data the query policy is governing the access to.
   */
  description: string,

  /**
   * A mapping of dimension names to the discrete dimension values that the
   * policy holder is allowed to query data for.
   */
  policyFilters: Zen.Map<DimensionFilter>,

  /**
   * The unique uri that can be used to locate this query policy on the server
   */
  uri: string,
};

/**
 * A model for representing a policy which governs access controls around
 * which data a policy holder may or may not query.
 */
class QueryPolicy
  extends Zen.BaseModel<QueryPolicy, RequiredValues, DefaultValues>
  implements Serializable<SerializedQueryPolicy> {
  static defaultValues: DefaultValues = {
    name: '',
    description: '',
    policyFilters: Zen.Map.create(),
    uri: '',
  };

  static deserialize(values: SerializedQueryPolicy): Zen.Model<QueryPolicy> {
    const {
      $uri,
      description,
      name,
      policyFilters,
      queryPolicyTypeId,
    } = values;
    const policyFiltersMap = Zen.Map.create(policyFilters).map(
      (serializedDimensionFilter, dimensionName) => {
        const { includeValues, allValues } = serializedDimensionFilter;
        return DimensionFilter.create({
          dimensionName,
          includeValues: Zen.Array.create(includeValues),
          allValues,
        });
      },
    );

    return QueryPolicy.create({
      name,
      description,
      policyFilters: policyFiltersMap,
      queryPolicyTypeId,
      uri: $uri,
    });
  }

  // NOTE(toshi): To be used for site admin
  @memoizeOne
  static getAllPolicies(): $ReadOnlyArray<Zen.Model<QueryPolicy>> {
    const rawQueryPolicyDimensions =
      window.__JSON_FROM_BACKEND.queryPolicyDimensions || {};
    return Object.keys(rawQueryPolicyDimensions).map(dimensionName => {
      const policyName = rawQueryPolicyDimensions[dimensionName];
      const typeId =
        dimensionName === SOURCE_NAME
          ? QUERY_POLICY_NAME_TO_ID_MAP[QUERY_POLICY_MAP.datasource]
          : QUERY_POLICY_NAME_TO_ID_MAP[QUERY_POLICY_MAP.dimension];
      return QueryPolicy.create({
        queryPolicyTypeId: typeId,
        name: policyName,
        policyFilters: Zen.Map.create().set(
          dimensionName,
          DimensionFilter.create({
            dimensionName,
            includeValues: Zen.Array.create(),
            allValues: true,
          }),
        ),
      });
    });
  }

  getQueryPolicyType(): QUERY_POLICY_TYPE {
    return QUERY_POLICY_ID_MAP[this._.queryPolicyTypeId()];
  }

  serialize(): SerializedQueryPolicy {
    const {
      description,
      name,
      policyFilters,
      queryPolicyTypeId,
      uri,
    } = this.modelValues();
    return {
      description,
      name,
      policyFilters: Zen.serializeMap(policyFilters),
      queryPolicyTypeId,
      $uri: uri,
    };
  }
}

export default ((QueryPolicy: $Cast): Class<Zen.Model<QueryPolicy>>);
