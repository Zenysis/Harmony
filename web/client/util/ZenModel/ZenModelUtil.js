// @flow
import type ZenModel from 'util/ZenModel';

type Visibility = 'PUBLIC' | 'PRIVATE';

type ValueDefinition<T> = {
  valueType: ReactPropsCheckType,
  defaultValue: T | void,
  visibility: Visibility,
};

type ShouldRecomputeFn<Model: ZenModel> = (
  prevModel: Model,
  currModel: Model,
) => boolean;

type StatefulComputeDerivedValueFn<T, Model: ZenModel> = {
  (currModel: Model, prevModel: Model | void): T,
  isStatefulCompute: true,
};

type ComputeDerivedValueFn<T, Model: ZenModel> = (currModel: Model) => T;

type DerivedValueDefinition<T, Model: ZenModel> = {
  valueType: ReactPropsCheckType,
  shouldRecomputeFunc: ShouldRecomputeFn<Model>,
  computeFunc:
    | ComputeDerivedValueFn<T, Model>
    | StatefulComputeDerivedValueFn<T, Model>,
};

interface ForEachable<T> {
  forEach(func: (value: T) => mixed): void;
}

export const VISIBILITIES: { [Visibility]: Visibility } = {
  PUBLIC: 'PUBLIC',
  PRIVATE: 'PRIVATE',
};

/**
 * Helper function to create a value definition for a ZenModel
 * @param {ReactPropsCheckType} valueType A type from the PropTypes library
 * @param {T} defaultValue The default value in case a user doesn't supply one
 * @param {Visibility} visibility Is the value PUBLIC or PRIVATE
 *   (defaults to PUBLIC)
 * @returns {ValueDefinition} A value definition tuple to be used
 * internally by ZenModel
 */
export function def<T>(
  valueType: ReactPropsCheckType,
  defaultValue?: T | void = undefined,
  visibility?: Visibility = VISIBILITIES.PUBLIC,
): ValueDefinition<T> {
  if (!(visibility in VISIBILITIES)) {
    throw new Error(
      '[ZenModel] def: Invalid visibility specified. Must be public or private',
    );
  }

  if (!valueType) {
    throw new Error(
      '[ZenModel] def: cannot specify a null or undefined valueType',
    );
  }

  return { valueType, defaultValue, visibility };
}

/**
 * Helper function to create a value definition for a ZenModel
 * @param {ReactPropsCheckType} valueType A type from the PropTypes library
 * @param {T} defaultValue The default value in case a user doesn't supply one
 * @param {Visibility} visibility Is the value PUBLIC or PRIVATE
 *   (defaults to PUBLIC)
 * @returns {ValueDefinition} A value definition tuple to be used
 * internally by ZenModel
 */
export function derived<T, Model: ZenModel>(
  valueType: ReactPropsCheckType,
  shouldRecomputeFunc: ShouldRecomputeFn<Model>,
  computeFunc: ComputeDerivedValueFn<T, Model>,
): DerivedValueDefinition<T, Model> {
  return { valueType, shouldRecomputeFunc, computeFunc };
}

/**
 * Helper function to flag a function as a stateful derived calculation.
 * This is necessary if a derived calculation needs access to the prevModel.
 * If you don't wrap it with `statefulCompute` then the function cannot
 * take a `prevModel` as an argument.
 */
export function statefulCompute<T, Model: ZenModel>(
  computeFunc: {
    (curr: Model, prev: Model): T,
    isStatefulCompute: boolean,
  },
): StatefulComputeDerivedValueFn<T, Model> {
  // eslint-disable-next-line no-param-reassign
  computeFunc.isStatefulCompute = true;
  return (computeFunc: any); // force Flow to accept the type
}

/**
 * Helper function that returns a function to easily compare two models
 * to see if any of the `valueKeys` have changed.
 * E.g. {
 *   fullName: derived(PropTypes.string, hasChanged('name', 'lastName'), ...)
 * }
 * ^ This will create a derived property that recomputes when `name` or
 * `lastName` changes.
 * A key can also be a path (in case you have deeply nested models), e.g.
 * 'user.role.name'
 * @param {...Array<string>} valueKeys The keys to compare
 * @returns {(Model, Model) => boolean} Function that compares the `valueKeys`
 * of two models and returns true if they have changed.
 */
export function hasChanged<Model: ZenModel>(
  ...valueKeys: Array<string>
): (Model, Model) => boolean {
  return (prevModel: Model, nextModel: Model) =>
    valueKeys.some(key => {
      const [prevVal, nextVal] = key
        .split('.')
        .reduce(([p, n], k) => [p[k](), n[k]()], [prevModel, nextModel]);
      return prevVal !== nextVal;
    });
}

// given a value, convert all ZenModels within it into objects.
// if the value is not a ZenModel, leave it as is
/**
 * Given a value, convert all ZenModels within it into objects.
 * If the value is not a ZenModel, leave it as is.
 *
 * NOTE(pablo): calling this function loses type safety. So you will
 * have to annotate the result yourself, there is no way to infer it.
 */
export function convertZenModels(value: any): any {
  if (value && value.serialize && typeof value.serialize === 'function') {
    return value.serialize();
  }
  if (Array.isArray(value)) {
    return value.map(convertZenModels);
  }
  if (value !== null && typeof value === 'object') {
    const newValue = {};
    Object.keys(value).forEach(key => {
      newValue[key] = convertZenModels(value[key]);
    });
    return newValue;
  }
  return value;
}

const ZenModelUtil = {
  /**
   * Turn an array of models into an object mapping the result of an
   * accessor to the model.
   *
   * Examples:
   *   ZenModelUtil.modelArrayToObject(fields, 'id')
   *     This will take the array of all fields, and return an object mapping
   *     field.id() to the field model.
   *
   *   ZenModelUtil.modelArrayToObject(people, person => person.getFullName())
   *     This will take the array of people, and return an object mapping
   *     person.getFullName() to the person model
   *
   * @param {Array<ZenModel>} models
   * @param {string | Function<ZenModel> => string} accessor
   *   The accessor must either be a string named after a value in the model
   *   (e.g. 'id'), or must be a function that takes in the model and returns a
   *   string. The accessor is what's used to hash a model into an object key.
   *
   * @return {Object<String, ZenModel>}
   *
   */
  modelArrayToObject(
    models: ForEachable<ZenModel>,
    accessor: string | ((model: ZenModel) => string),
  ): { [string]: ZenModel } {
    const result = {};
    if (typeof accessor !== 'string' && typeof accessor !== 'function') {
      throw new Error(
        '[ZenModelUtil] Accessor must be either a string or function',
      );
    }

    models.forEach(model => {
      if (typeof accessor === 'string') {
        result[model[accessor]()] = model;
      } else {
        result[accessor(model)] = model;
      }
    });
    return result;
  },
};

export default ZenModelUtil;
