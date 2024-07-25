// @flow
import * as Zen from 'lib/Zen';
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
  dimension: string,
  dimensionValue: ?string,
  queryPolicyTypeId: number,
};

type RequiredValues = {
  /**
   * Query policy type.
   */
  dimension: string,
  dimensionValue: ?string,
  queryPolicyTypeId: number,
};

type DefaultValues = {
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
    uri: '',
  };

  static deserialize(values: SerializedQueryPolicy): Zen.Model<QueryPolicy> {
    const { $uri, dimension, dimensionValue, queryPolicyTypeId } = values;

    return QueryPolicy.create({
      dimension,
      dimensionValue,
      queryPolicyTypeId,
      uri: $uri,
    });
  }

  // NOTE: To be used for site admin
  @memoizeOne
  static getAllPolicies(): $ReadOnlyArray<Zen.Model<QueryPolicy>> {
    const rawQueryPolicyDimensions =
      window.__JSON_FROM_BACKEND.queryPolicyDimensions || [];
    return rawQueryPolicyDimensions.map(dimensionName => {
      const typeId =
        dimensionName === SOURCE_NAME
          ? QUERY_POLICY_NAME_TO_ID_MAP[QUERY_POLICY_MAP.datasource]
          : QUERY_POLICY_NAME_TO_ID_MAP[QUERY_POLICY_MAP.dimension];
      return QueryPolicy.create({
        dimension: dimensionName,
        dimensionValue: null,
        queryPolicyTypeId: typeId,
      });
    });
  }

  getQueryPolicyType(): QUERY_POLICY_TYPE {
    return QUERY_POLICY_ID_MAP[this._.queryPolicyTypeId()];
  }

  serialize(): SerializedQueryPolicy {
    const {
      dimension,
      dimensionValue,
      queryPolicyTypeId,
      uri,
    } = this.modelValues();
    return {
      dimension,
      dimensionValue,
      queryPolicyTypeId,
      $uri: uri,
    };
  }
}

export default ((QueryPolicy: $Cast): Class<Zen.Model<QueryPolicy>>);
