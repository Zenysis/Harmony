// @flow
import type { AnyModel } from 'lib/Zen/ZenModel';
import type { ModelValueKeys } from 'lib/Zen/ZenModel/coreHelpers';

interface ForEachable<T> {
  forEach(func: (value: T) => mixed): void;
}

const ZenModelUtil = {
  /**
   * Turn an array of models into an object mapping the result of an
   * accessor to the model.
   *
   * Examples:
   *   Zen.ModelUtil.modelArrayToObject(fields, 'id')
   *     This will take the array of all fields, and return an object mapping
   *     field.id() to the field model.
   *
   *   Zen.ModelUtil.modelArrayToObject(people, person => person.getFullName())
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
  modelArrayToObject<M: AnyModel>(
    models: ForEachable<M>,
    accessor: ModelValueKeys<M> | ((model: M) => string),
  ): { [string]: M, ... } {
    const result = {};
    if (typeof accessor !== 'string' && typeof accessor !== 'function') {
      throw new Error(
        '[ZenModelUtil] Accessor must be either a string or function',
      );
    }

    models.forEach(model => {
      if (typeof accessor === 'string') {
        // $FlowExpectedError[incompatible-use]
        result[model[accessor]()] = model;
      } else {
        result[accessor(model)] = model;
      }
    });
    return result;
  },
};

export default ZenModelUtil;
