// @flow
import type ZenModel, { AnyModel } from 'lib/Zen/ZenModel';

type _RequiredValuesExtractor = <RequiredVals>(
  ZenModel<any, RequiredVals, any>,
) => RequiredVals;

type RequiredValues<M: AnyModel> = $Call<_RequiredValuesExtractor, M>;

/**
 * Attach all the getter and setter accessors to a ZenModel class.
 * Given that all type definitions now live in type land, the way we
 * figure out what all the keys are is by looking at the required values,
 * default values, and derived config. By combining all of those we can
 * get a set of all keys.
 */
export default function attachAccessors<M: AnyModel>(
  ModelClass: Class<M>,
  values: RequiredValues<M>,
  defaultValues: $PropertyType<Class<M>, 'defaultValues'>,
  derivedConfig: $PropertyType<Class<M>, 'derivedConfig'>,
): void {
  const derivedValueKeys = new Set(Object.keys(derivedConfig));
  const allValueKeys = new Set(derivedValueKeys);
  const nonDerivedValues = { ...values, ...defaultValues };

  // get all the value keys and keep track of which names have collisions
  const collidedTypes = new Set();
  Object.keys(nonDerivedValues).forEach(key => {
    if (derivedValueKeys.has(key)) {
      collidedTypes.add(key);
    }
    allValueKeys.add(key);
  });

  if (collidedTypes.size > 0) {
    const names = Array.from(collidedTypes).join(', ');
    throw new Error(
      `[ZenModel] Your model cannot have values and derived values of the same name. These names have collisions: ${names}`,
    );
  }

  // now create all the accessor methods and attach to the ModelClass
  allValueKeys.forEach(valueKey => {
    // intentionally using `function` keyword instead of an arrow function,
    // because an arrow function would maintain the wrong `this`
    function accessor(val) {
      // getter
      if (arguments.length === 0) {
        return this.get(valueKey);
      }

      // setter
      if (derivedValueKeys.has(valueKey)) {
        const className = this.constructor.classDisplayName();
        throw new Error(
          `[${className}] Cannot set '${valueKey}' because it is a derived value. Derived values cannot be set.`,
        );
      }
      return this.set(valueKey, val);
    }

    Object.defineProperty(accessor, 'name', {
      value: valueKey,
      configurable: true,
    });
    Object.defineProperty(ModelClass.prototype, valueKey, { value: accessor });
  });
}
