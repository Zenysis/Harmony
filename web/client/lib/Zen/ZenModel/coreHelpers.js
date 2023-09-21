// @flow
/* eslint-disable no-use-before-define */
import type {
  AnyModel,
  Model,
  StatefulComputeDerivedValueFn,
} from 'lib/Zen/ZenModel';

/**
 * This is a collection of core helper functions and types that we expose to
 * users. This is different from ZenModelUtil in that these are not optional
 * utilities, but actually core functions for the correct usage of parts
 * of ZenModel's API.
 */

export type ModelValues<M: AnyModel> = {
  ...$PropertyType<M, '_modelValues'>,
  ...$PropertyType<M, '_derivedValues'>,
};
export type ModelValueKeys<M: AnyModel> = $Keys<ModelValues<M>>;
export type ModelValueType<M: AnyModel, K> = $ElementType<ModelValues<M>, K>;
export type SettableValues<M: AnyModel> = $PropertyType<M, '_modelValues'>;
export type SettableValueKeys<M: AnyModel> = $Keys<SettableValues<M>>;
export type SettableValueType<M: AnyModel, K> = $ElementType<
  SettableValues<M>,
  K,
>;

/**
 * Helper function that returns a function that compare two models
 * to see if any of the `valueKeys` have changed.
 * This is very useful in the specification of derived values.
 * E.g.
 *   static derivedConfig = {
 *     fullName: [hasChanged<Person>('name', 'lastName'), ...],
 *   };
 * ^ This will create a derived property that recomputes when `name` or
 * `lastName` changes.
 *
 * @param {...Array<SettableValueKeys>} valueKeys The keys to compare
 * @returns {(Model, Model) => boolean} Function that compares the `valueKeys`
 * of two models and returns true if they have changed.
 */
export function hasChanged<M: AnyModel>(
  ...valueKeys: $ReadOnlyArray<SettableValueKeys<M>>
): (prevModel: M, nextModel: M) => boolean {
  return hasChangedDeep(...valueKeys);
}

/**
 * Helper function that returns a function that compares two models
 * to see if any of the `valueKeys` have changed.
 * This is the same as `hasChanged`, except that now you can specify paths
 * of keys, so that you can compare values deeply nested within models:
 * E.g.
 *   static derivedConfig = {
 *     jobName: [hasChanged<Person>('job.name'), ...],
 *   };
 * ^ This will create a derived property that recomputes when `job.name()`
 * changes.
 *
 * NOTE: use this function carefully because Flow can no longer check the
 * specific key path anymore to make sure it's valid. This function uses
 * the more general `string` type.
 *
 * @param {...Array<string>} valueKeys The keys to compare
 * @returns {(Model, Model) => boolean} Function that compares the `valueKeys`
 * of two models and returns true if they have changed.
 */
export function hasChangedDeep<M: AnyModel>(
  ...valueKeys: $ReadOnlyArray<string>
): (prevModel: M, nextModel: M) => boolean {
  return (prevModel: M, nextModel: M) =>
    valueKeys.some(key => {
      const [prevVal, nextVal] = key
        .split('.')
        .reduce(([p, n], k) => [p.get(k), n.get(k)], [prevModel, nextModel]);
      return prevVal !== nextVal;
    });
}

/**
 * Helper function to flag a function as a stateful derived calculation.
 * This is necessary if a derived calculation needs access to the prevModel.
 * If you don't wrap it with `statefulCompute` then the function cannot
 * take a `prevModel` as an argument.
 * @param {(currModel, prevModel) => T} computeFunc The function to recompute a
 *   derived value. Its parameters are the current model and the previous model
 * @returns {(currModel, prevModel) => T} The same function, but now
 *   recognizable by a ZenModel as a stateful compute function.
 */
export function statefulCompute<T, M: AnyModel>(
  computeFunc: (currModel: Model<M>, prevModel: Model<M> | void) => T,
): StatefulComputeDerivedValueFn<T, M> {
  return {
    computeFunc,
    isStatefulCompute: true,
  };
}
