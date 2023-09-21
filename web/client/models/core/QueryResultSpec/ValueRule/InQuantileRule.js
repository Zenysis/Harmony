// @flow
import * as Zen from 'lib/Zen';
import I18N from 'lib/I18N';
import {
  getQuantile,
  roundValue,
} from 'models/core/QueryResultSpec/ValueRule/rulesUtil';
import type { Serializable } from 'lib/Zen';
import type { TestableRule } from 'models/core/QueryResultSpec/ValueRule/TestableRule';

export const ORDINALS: { [string]: string } = {
  '1': I18N.text('First'),
  '10': I18N.text('Tenth'),
  '2': I18N.text('Second'),
  '3': I18N.text('Third'),
  '4': I18N.text('Fourth'),
  '5': I18N.text('Fifth'),
  '6': I18N.text('Sixth'),
  '7': I18N.text('Seventh'),
  '8': I18N.text('Eighth'),
  '9': I18N.text('Ninth'),
};

export const QUANTILES: { [string]: string } = {
  '10': I18N.text('decile'),
  '2': I18N.text('half'),
  '3': I18N.text('tertile'),
  '4': I18N.text('quartile'),
  '5': I18N.text('quintile'),
};

type Values = {
  n: number,
  percentile: number,
};

type SerializedInQuantileRule = {
  n: number,
  percentile: number,
  type: 'IN_QUANTILE',
};

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
    const { n, percentile } = values;
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
  // TODO: modify range so that both start and end are inclusive
  getRuleString(allValues: $ReadOnlyArray<?number>): string {
    const { n, percentile } = this.modelValues();
    const [startOfQuantile, endOfQuantile] = this._getQuantileRange(allValues);
    const startVal = roundValue(startOfQuantile);
    const endVal = roundValue(endOfQuantile);

    const ordinalText = ORDINALS[String(n)];
    const quantileText = QUANTILES[String(Math.round(1 / percentile))];
    const quantile = `${ordinalText} ${quantileText}`;

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
