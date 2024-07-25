// @flow
import * as Zen from 'lib/Zen';
import type { Serializable } from 'lib/Zen';

type RequiredValues = {
  type: string,
};

type DefaultValues = {
  /**
   * The filter criteria is of the form:
   *   {
   *     _display: string,
   *     [criteria1]: any,
   *     [criteria2]: any,
   *     ...
   *   }
   */
  criteria: { +[string]: mixed, ... },
};

// A SerializedQueryFilter is just the filter criteria.
// Its shape is explained a few lines above.
type SerializedQueryFilter = { +[string]: mixed, ... };
type DeserializationConfig = { filterType: string };

/**
 * A QuerySelectionFilter represents a filter that is applied to a query
 * on the backend. It is a part of the QuerySelections model.
 * This is not to be confused with a QueryResultFilter which is a filter
 * applied on the frontend.
 */
class QuerySelectionFilter
  extends Zen.BaseModel<QuerySelectionFilter, RequiredValues, DefaultValues>
  implements Serializable<SerializedQueryFilter, DeserializationConfig> {
  static defaultValues: DefaultValues = {
    criteria: {},
  };

  static deserialize(
    legacyObj: SerializedQueryFilter,
    config: DeserializationConfig,
  ): Zen.Model<QuerySelectionFilter> {
    return QuerySelectionFilter.create({
      criteria: legacyObj,
      type: config.filterType,
    });
  }

  serialize(): SerializedQueryFilter {
    return this._.criteria();
  }
}

export default ((QuerySelectionFilter: $Cast): Class<
  Zen.Model<QuerySelectionFilter>,
>);
