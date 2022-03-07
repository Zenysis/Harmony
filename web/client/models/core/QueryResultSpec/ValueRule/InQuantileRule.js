// @flow
import * as Zen from 'lib/Zen';
import {
  getQuantile,
  roundValue,
} from 'models/core/QueryResultSpec/ValueRule/rulesUtil';
import type { Serializable } from 'lib/Zen';
import type { TestableRule } from 'models/core/QueryResultSpec/ValueRule/TestableRule';

type Values = {
  percentile: number,
  n: number,
};

type SerializedInQuantileRule = {
  type: 'IN_QUANTILE',
  percentile: number,
  n: number,
};

const TEXT_PATH = 'models.core.QueryResultSpec.ValueRule';
const TEXT = t(TEXT_PATH);

/**
 * Test if a value is in the n-th quantile of an array, where each quantile is
 * of `percentile` size.
 *
 * For example, if percentile is 0.25 and n is 2, then this tests if we are in
 * the second quartile (so between 0.25 and 0.5).
 *
 * There are some special cases in terms of inclusive/exclusive values, so as
 * an example, this is how we split quartiles:
 *   Q1: x <= 0.25
 *   Q2: 0.25 < x <= 0.5
 *   Q3: 0.5 < x <= 0.75
 *   Q4: 0.75 < x
 * The start of a quartile is *inclusive* and the end of a quartile is
 * *exclusive*. The only exception is the last quantile where we take all
 * numbers greater than the start value (meaning we *include* the very last
 * value, otherwise the 100th percentile would never fall into any bucket).
 */
class InQuantileRule extends Zen.BaseModel<InQuantileRule, Values>
  implements Serializable<SerializedInQuantileRule>, TestableRule {
  tag: 'IN_QUANTILE' = 'IN_QUANTILE';

  static deserialize(
    values: SerializedInQuantileRule,
  ): Zen.Model<InQuantileRule> {
    const { percentile, n } = values;
    return InQuantileRule.create({ n, percentile });
  }

  _getQuantileRange(allValues: $ReadOnlyArray<?number>): [number, number] {
    const { n, percentile } = this.modelValues();
    const startOfQuantile = getQuantile(allValues, (n - 1) * percentile);
    const endOfQuantile = getQuantile(allValues, n * percentile);
    return [startOfQuantile, endOfQuantile];
  }

  testValue(val: ?number, allValues: $ReadOnlyArray<?number>): boolean {
    if (val === null || val === undefined) {
      return false;
    }

    const { n, percentile } = this.modelValues();
    const [startOfQuantile, endOfQuantile] = this._getQuantileRange(allValues);
    if (n * percentile === 1) {
      // last quantile
      return val > startOfQuantile;
    }
    if (n === 1) {
      return val <= endOfQuantile;
    }
    return val > startOfQuantile && val <= endOfQuantile;
  }

  /**
   * Return a string to describe this rule. Formatted as the quantile the rule
   * includes (eg. "third quartile") and the range of the quantile. The start
   * value (except for the first quantile) is exclusive.
   */
  // TODO(sophie): modify range so that both start and end are inclusive
  getRuleString(allValues: $ReadOnlyArray<?number>): string {
    const { n, percentile } = this.modelValues();
    const [startOfQuantile, endOfQuantile] = this._getQuantileRange(allValues);
    const startVal = roundValue(startOfQuantile);
    const endVal = roundValue(endOfQuantile);
    const quantile = t('quantileOfData', {
      scope: TEXT_PATH,
      ordinal: TEXT.ordinals[String(n)],
      quantile: TEXT.quantiles[String(Math.round(1 / percentile))],
    });
    return `${quantile} (${n !== 1 ? '> ' : ''}${startVal} - ${endVal})`;
  }

  serialize(): SerializedInQuantileRule {
    const { n, percentile } = this.modelValues();
    return {
      n,
      percentile,
      type: this.tag,
    };
  }
}

export default ((InQuantileRule: $Cast): Class<Zen.Model<InQuantileRule>>);
