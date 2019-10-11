// @flow
import * as Zen from 'lib/Zen';
import DimensionFilter from 'services/models/QueryPolicy/DimensionFilter';

type BackendQueryPolicy = {
  $uri: string,
  description: string,
  endDate: string,
  name: string,
  policyFilters: { [dimensionName: string]: Zen.Serialized<DimensionFilter> },
  startDate: string,
};

/**
 * A model for representing a policy which governs access controls around
 * which data a policy holder may or may not query.
 */

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
   * @readonly
   * The unique uri that can be used to locate this query policy on the server
   */
  uri: Zen.ReadOnly<string>,
};

class QueryPolicy extends Zen.BaseModel<QueryPolicy, {}, DefaultValues> {
  static defaultValues = {
    name: '',
    description: '',
    policyFilters: Zen.Map.create(),
    uri: '',
  };

  static deserialize(values: BackendQueryPolicy): Zen.Model<QueryPolicy> {
    const { $uri, policyFilters, name, description } = values;
    const policyFiltersMap = Zen.Map.create(policyFilters).map(
      (backendDimensionFilter, dimensionName) => {
        const { includeValues, allValues } = backendDimensionFilter;
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
      uri: $uri,
    });
  }
}

export default ((QueryPolicy: any): Class<Zen.Model<QueryPolicy>>);
