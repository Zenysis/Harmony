// @flow
import * as Zen from 'lib/Zen';
import type { Serializable } from 'lib/Zen';

type SerializedDimensionFilter = {
  allValues: boolean,
  includeValues: $ReadOnlyArray<string>,
  excludeValues: $ReadOnlyArray<string>,
};

type RequiredValues = {
  /**
   * The name of the dimension that this filter represents restrictions for.
   */
  dimensionName: string,
};

type DefaultValues = {
  /**
   * Indicates whether or not this filter allows querying on ALL values for the
   * declared dimension. If `excludeValues` is set, this value will include all
   * values except for those explicitly defined in `excludeValues`
   */
  allValues: boolean,
  /**
   * The specific values (if any) that this filter restricts querying on.
   */
  excludeValues: Zen.Array<string>,
  /**
   * The specific values (if any) that this filter allows querying on.
   */
  includeValues: Zen.Array<string>,
};

/**
 * A model for representing query restrictions for an individual dimension.
 */
class DimensionFilter
  extends Zen.BaseModel<DimensionFilter, RequiredValues, DefaultValues>
  implements Serializable<SerializedDimensionFilter> {
  static defaultValues: DefaultValues = {
    allValues: false,
    excludeValues: Zen.Array.create(),
    includeValues: Zen.Array.create(),
  };

  serialize(): SerializedDimensionFilter {
    return {
      allValues: this._.allValues(),
      excludeValues: this._.excludeValues().arrayView(),
      includeValues: this._.includeValues().arrayView(),
    };
  }

  /**
   * Indicates whether or not the holder of the Query Policy that this
   * DimensionFilter is associated with can filter on `value` for the
   * dimension this filter represents query restrictions for.
   *
   * @param {string} value The specific value for the given dimension.
   *                       (e.g. `hmis_indicator_4421`)
   *
   * @returns {boolean} `true` if the policy holder can query for `value` in
   *                    the filter's dimension and `false` otherwise.
   */
  canQuerySpecificValue(value: string): boolean {
    return (
      (this.canQueryAllValues() && !this._.excludeValues().includes(value)) ||
      this._.includeValues().includes(value)
    );
  }

  /**
   * Indicates whether or not the holder of the Query Policy that this
   * DimensionFilter is associated with can filter on ALL values for
   * the dimension this filter represents query restrictions for.
   *
   * @returns {boolean} `true` if the policy holder can query for ALL values in
   *                    the filter's dimension and `false` otherwise.
   */
  canQueryAllValues(): boolean {
    return this._.allValues() && this._.excludeValues().size() === 0;
  }
}

export default ((DimensionFilter: $Cast): Class<Zen.Model<DimensionFilter>>);
