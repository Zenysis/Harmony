import PropTypes from 'prop-types';

import Serializable from 'util/Serializable';
import ZenArray from 'util/ZenModel/ZenArray';
import ZenMap from 'util/ZenModel/ZenMap';
import {
  VISIBILITIES,
  convertZenModels,
  def,
  derived,
  hasChanged,
  statefulCompute,
} from 'util/ZenModel/ZenModelUtil';
import deepUpdate from 'util/ZenModel/deepUpdate';
import { capitalize } from 'util/stringUtil';
import { isEmpty, pick, omit } from 'util/util';

/**
 * NOTE(pablo): This file is now deprecated!
 * Use lib/ZenModel instead.
 *
 *  ____                                _           _
 * |  _ \  ___ _ __  _ __ ___  ___ __ _| |_ ___  __| |
 * | | | |/ _ \ '_ \| '__/ _ \/ __/ _` | __/ _ \/ _` |
 * | |_| |  __/ |_) | | |  __/ (_| (_| | ||  __/ (_| |
 * |____/ \___| .__/|_|  \___|\___\__,_|\__\___|\__,_|
 *            |_|
 *
 */

/**
 * ZenModel represents an immutable data model. It is immutable intentionally so
 * that it is easy to pass around in React, which prefers state and props to be
 * immutable. Any setter call will return a new instance, which can be passed
 * into component.setState to trigger a re-render (making it very easy to work
 * with React.PureComponent)
 *
 * ZenModel is written so that it is as similar to React as possible:
 *   - Models are described using valueTypes and defaultValues
 *     (similar to propTypes and defaultProps).
 *   - You should not modify this._modelValues directly (just like in React
 *     where you shouldn't modify this.props or this.state directly). Use setter
 *     methods.
 *
 * All ZenModel instances will have setter and getter methods created
 * automatically with the same name as the value key. For example:
 *   model.myValue('new value'); // sets myValue to 'new value'
 *   model.myValue(); // returns myValue
 *
 * Examples:
 *     class Animal extends ZenModel.withTypes({
 *       name: def(PropTypes.string.isRequired),
 *       debugMode: def(PropTypes.bool, false, ZenModel.PRIVATE),
 *     }) {
 *       speak() {
 *         throw new Error('Needs overriding');
 *       }
 *     }
 *
 *     We just created an Animal model with two value types. Any PRIVATE value
 *     types cannot be changed once the object is initialized.
 *
 *     class Cat extends Animal {
 *       speak() {
 *         console.log(`My name is ${this.name()}`);
 *       }
 *     }
 *
 *     class Dog extends Animal.withTypes({
 *       owner: def(PropTypes.string, 'Pablo'),
 *     }) {
 *       speak() {
 *         console.log(
 *           `My name is ${this.name()} and my owner is ${this.owner()}`
 *         );
 *       }
 *
 *       // override the default getter so we always capitalize the owner name
 *       _getOwner() {
 *         return capitalize(this._get('owner'));
 *       }
 *     }
 *
 *     const dog = Dog.create({
 *       name: 'Luna',
 *       owner: 'pablo',
 *     });
 *     dog.speak(); // logs 'My name is Luna and my owner is Pablo'
 *
 *     const cat = Cat.create({
 *       name: 'Meow Meow FuzzyFace'
 *     });
 *     const newCat = cat.name('Cookie');
 *
 *     // Can't set a private value after initialization
 *     const errorCat = newCat.debugMode(true);
 *
 */

// Populated after the ZenModel class definition
const RESERVED_KEYWORDS = new Set();

/**
 * ZenModelFactory is a ZenModel class factory.
 * Arguments:
 *   BaseModel: ZenModel class (or subclass)
 *   modelSpec: object
 *     a map of valueKey => { valueType, defaultValue, visibility } tuples
 *   derivedValueSpec: object (optional)
 *     a map of valueKey => { valueType, shouldRecomputeFunc, computeFunc }
 *     tuples. This is optional and only needed if the model has derived values
 *
 * Returns:
 *   new Model class extending the BaseModel
 */
function ZenModelFactory(BaseModel, modelSpec, derivedValueSpec = undefined) {
  const privateValueTypes = new Set();

  // compute the class level variables for this model
  const valueTypes = {};
  const defaultValues = {};
  Object.keys(modelSpec).forEach(valueKey => {
    const { valueType, defaultValue, visibility } = modelSpec[valueKey];
    valueTypes[valueKey] = valueType;
    defaultValues[valueKey] = defaultValue;

    if (visibility === VISIBILITIES.PRIVATE) {
      privateValueTypes.add(valueKey);
    }
  });

  // if we passed a derived value spec, then gather the value types
  let derivedValueTypes;
  if (derivedValueSpec) {
    derivedValueTypes = {};
    Object.keys(derivedValueSpec).forEach(valueKey => {
      derivedValueTypes[valueKey] = derivedValueSpec[valueKey].valueType;
    });
  }

  // create the enhanced model class
  class Model extends BaseModel {
    static modelSpec = modelSpec;
    static valueTypes = valueTypes;
    static defaultValues = defaultValues;
    static derivedValueSpec = derivedValueSpec;
    static derivedValueTypes = derivedValueTypes;

    // eslint-disable-next-line class-methods-use-this
    _privateValueTypes() {
      return privateValueTypes;
    }
  }

  // Create the new setter/getter methods and add them to the model prototype
  // This includes any derived values as well
  const newBaseTypes = omit(modelSpec, BaseModel.valueTypes);
  let newDerivedTypes = {};
  if (derivedValueSpec) {
    newDerivedTypes = omit(derivedValueSpec, BaseModel.derivedValueTypes);
  }
  const collidedTypes = pick(newBaseTypes, newDerivedTypes);
  if (!isEmpty(collidedTypes)) {
    const names = Object.keys(collidedTypes);
    const nameStr = names.join(', ');
    // prettier-ignore
    throw new Error(`[ZenModel] Your model cannot have values and derived values of the same name. These names have collisions: ${nameStr}`);
  }
  const allNewTypes = Object.assign(newBaseTypes, newDerivedTypes);

  Object.keys(allNewTypes).forEach(valueKey => {
    const ValueKey = capitalize(valueKey, false);
    const setValueKey = `_set${ValueKey}`;
    const getValueKey = `_get${ValueKey}`;

    let gettersAndSetters = [];
    if (valueKey in newBaseTypes) {
      // only add overrideable getters and setters if this is a base value
      // type. We should not expose these if they are derived types.
      gettersAndSetters = [
        {
          name: getValueKey,
          func: function _getValueKey() {
            return this._get(valueKey);
          },
        },
        {
          name: setValueKey,
          func: function _setValueKey(val) {
            return this._set(valueKey, val);
          },
        },
      ];
    }

    gettersAndSetters.push({
      name: valueKey,
      func: function _valueKey(val) {
        // getter
        if (arguments.length === 0) {
          if (valueKey in newDerivedTypes) {
            return this._get(valueKey);
          }
          return this[getValueKey]();
        }

        // setter
        if (valueKey in newDerivedTypes) {
          const className = this.constructor.classDisplayName();
          // prettier-ignore
          throw new Error(`[${className}] Cannot set '${valueKey}' because it is a derived value. Derived values cannot be set.`);
        }
        return this[setValueKey](val);
      },
    });
    gettersAndSetters.forEach(({ name, func }) => {
      Object.defineProperty(func, 'name', { value: name, configurable: true });
      Object.defineProperty(Model.prototype, name, { value: func });
    });
  });

  return Model;
}

// Make sure none of the keys of the given spec are a reserved keyword
function _checkSpecForReservedKeywords(Model, spec) {
  Object.keys(spec).forEach(keyName => {
    if (RESERVED_KEYWORDS.has(keyName)) {
      // prettier-ignore
      throw new Error(`[${Model.classDisplayName()}] '${keyName}' is a reserved keyword and cannot be set as a value type`);
    }
  });
}

/**
 * Wrap a stateful calculation around a thunk so as to defer the evaluation.
 * @param {StatefulComputeDerivedValueFn<V>} statefulCalculation
 * @param {ZenModel} thisModel
 * @param {ZenModel} prevModel
 * @returns {() => V)} a thunk wrapping the calculation evaluation
 */
function _createDerivedCalculationThunk(
  statefulCalculation,
  thisModel,
  prevModel,
) {
  const thunk = () => statefulCalculation(thisModel, prevModel);
  thunk.isDerivedCalculation = true;
  return thunk;
}

export default class ZenModel extends Serializable {
  static create(values = {}) {
    return new this(values);
  }

  /**
   * Convert a backend representation of this model to an instantiated model.
   * By default this just calls the `create` function, but if you need to do any
   * translating from backend to frontend representation, this is the function
   * you'd want to override.
   * Sometimes deserialization requires extra values (that are not part of the
   * backend representation) to be passed, which can be passed in the
   * `extraConfig` argument.
   * @param {Object<any>} values The backend representation of this model
   * @param {Object<any>} extraConfig Extra values to pass for deserialization
   */
  // eslint-disable-next-line no-unused-vars
  static deserialize(values = {}, extraConfig = {}) {
    return this.create(values);
  }

  // Create a new class by merging the passed modelSpec with the existing
  // model spec. That way we can add new value types, or override existing ones
  static withTypes(modelSpec = {}) {
    _checkSpecForReservedKeywords(this, modelSpec);
    const newModelSpec = Object.assign({}, this.modelSpec, modelSpec);
    return ZenModelFactory(this, newModelSpec, this.derivedValueSpec);
  }

  static withDerivedValues(derivedValueSpec = {}) {
    _checkSpecForReservedKeywords(this, derivedValueSpec);
    const newDerivedValueSpec = Object.assign(
      {},
      this.derivedValueSpec,
      derivedValueSpec,
    );
    return ZenModelFactory(this, this.modelSpec, newDerivedValueSpec);
  }

  /**
   * Deserialize an array of objects by calling `deserialize` on each one.
   * You can also pass an `extraConfig` to be passed to each `deserialize`
   * call. If you need a different extraConfig per model, you can use a function
   * instead that will take the model's index and return a config object.
   * @param {Array<Object<any>>} modelObjects Array of objects to deserialize
   * @param {Object | (idx) => Object} extraConfig An object with extra
   * information to pass, or a function that takes a model's index and returns
   * an object.
   * @returns {Array<ZenModel>}
   */
  static deserializeArray(modelObjects = [], extraConfig = {}) {
    if (typeof extraConfig === 'function') {
      return modelObjects.map((obj, i) =>
        this.deserialize(obj, extraConfig(i)),
      );
    }
    return modelObjects.map(obj => this.deserialize(obj, extraConfig));
  }

  /**
   * Deserialize an array of objects by calling `deserialize` on each one.
   * You can also pass an `extraConfig` to be passed to each `deserialize`
   * call. If you need a different extraConfig per model, you can use a function
   * instead that will take the model's index and return a config object.
   * @param {Array<Object<any>>} modelObjects Array of objects to deserialize
   * @param {Object | (idx) => Object} extraConfig An object with extra
   * information to pass, or a function that takes a model's index and returns
   * an object.
   * @returns {ZenArray<ZenModel>}
   */
  static deserializeArrayAsZen(modelObjects = [], extraConfig = {}) {
    return ZenArray.create(this.deserializeArray(modelObjects, extraConfig));
  }

  /**
   * Deserialize a map of objects by calling `deserialize` on each one.
   * You can also pass an `extraConfig` to be passed to each `deserialize`
   * call. If you need a different extraConfig per model, you can use a function
   * instead that will take the model's key and return a config object.
   * @param {Object<Object<any>>} modelObjects Map of objects to deserialize
   * @param {Object | (key) => Object} extraConfig An object with extra
   * information to pass, or a function that takes a model's key and returns
   * an object.
   * @returns {Object<ZenModel>}
   */
  static deserializeMap(modelObjects = {}, extraConfig = {}) {
    const deserializedObj = {};
    if (typeof extraConfig === 'function') {
      Object.keys(modelObjects).forEach(key => {
        deserializedObj[key] = this.deserialize(
          modelObjects[key],
          extraConfig(key),
        );
      });
    } else {
      Object.keys(modelObjects).forEach(key => {
        deserializedObj[key] = this.deserialize(modelObjects[key], extraConfig);
      });
    }
    return deserializedObj;
  }

  /**
   * Deserialize a map of objects by calling `deserialize` on each one.
   * You can also pass an `extraConfig` to be passed to each `deserialize`
   * call. If you need a different extraConfig per model, you can use a function
   * instead that will take the model's key and return a config object.
   * @param {Object<Object<any>>} modelObjects Map of objects to deserialize
   * @param {Object | (key) => Object} extraConfig An object with extra
   * information to pass, or a function that takes a model's key and returns
   * an object.
   * @returns {ZenMap<ZenModel>}
   */
  static deserializeMapAsZen(modelObjects = {}, extraConfig = {}) {
    return ZenMap.create(this.deserializeMap(modelObjects, extraConfig));
  }

  constructor(values = {}, prevModel = undefined) {
    super();

    // in case `values` was null, we need to force it to be an empty object
    const vals = values || {};
    this._modelValues = this._setupModelValues(vals);
    this._derivedValues = this._setupDerivedValues(prevModel);

    if (__DEV__) {
      this._validate();
    }
  }

  _cloneWith(constructorArgs) {
    const newArgs = Object.assign({}, this._modelValues, constructorArgs);
    return new this.constructor(newArgs, this);
  }

  // eslint-disable-next-line class-methods-use-this
  _privateValueTypes() {
    return new Set();
  }

  _setupModelValues(values) {
    const { valueTypes, defaultValues } = this.constructor;
    const modelValues = Object.assign({}, defaultValues);
    Object.keys(valueTypes).forEach(key => {
      // we do not want to set undefined values, an undefined
      // value should fall back to the defaultValue
      if (values[key] !== undefined) {
        modelValues[key] = values[key];
      }
    });
    return modelValues;
  }

  /**
   * Check if a `valueKey` corresponds to a derived value that has
   * yet to be calculated.
   */
  _isUncalculatedDerivedValue(valueKey) {
    if (!(valueKey in this._derivedValues)) {
      return true;
    }

    const val = this._derivedValues[valueKey];
    return typeof val === 'function' && !!val.isDerivedCalculation;
  }

  _setupDerivedValues(prevModel) {
    const { derivedValueSpec } = this.constructor;
    if (!derivedValueSpec) {
      return {};
    }

    const derivedValues = {};
    Object.keys(derivedValueSpec).forEach(valueKey => {
      const { shouldRecomputeFunc, computeFunc } = derivedValueSpec[valueKey];

      // Set up the value for recomputing if:
      // 1. There is no prevModel (meaning nothing has been computed yet)
      // 2. OR there is a previous model and it still didn't compute this value
      // 3. OR there is a previous model and shouldRecomputeFunc is true
      if (
        prevModel === undefined ||
        (prevModel && prevModel._isUncalculatedDerivedValue(valueKey)) ||
        (prevModel && shouldRecomputeFunc(prevModel, this))
      ) {
        // Only set a thunk if we need to preserve prevModel for derived value
        // computation.
        if (computeFunc.isStatefulCompute) {
          derivedValues[valueKey] = _createDerivedCalculationThunk(
            computeFunc,
            this,
            prevModel,
          );
        }
      } else {
        derivedValues[valueKey] = prevModel._derivedValues[valueKey];
      }
    });
    return derivedValues;
  }

  _validate() {
    const { _modelValues, constructor } = this;
    const { valueTypes } = constructor;

    // Validate that all keys that have been set are part of the model.
    Object.keys(_modelValues).forEach(key => {
      if (!(key in valueTypes)) {
        this.throwUndefinedValueTypeError(key);
      }
    });

    // Validate prop types. Derived values are validated lazily.
    const name = constructor.classDisplayName();
    PropTypes.checkPropTypes(valueTypes, _modelValues, 'prop', name);
  }

  // Since derived values are lazily generated, we must validate them as they
  // are created.
  _validateDerivedValue(key) {
    if (__DEV__) {
      const valueTypes = pick(this.constructor.derivedValueTypes, key);
      const name = this.constructor.classDisplayName();
      PropTypes.checkPropTypes(valueTypes, this._derivedValues, 'prop', name);
    }
  }

  _isKeyPrivate(key) {
    return this._privateValueTypes().has(key);
  }

  throwError(msg) {
    const name = this.constructor.classDisplayName();
    throw new Error(`[${name}] ${msg}`);
  }

  throwUndefinedValueTypeError(key) {
    this.throwError(
      `Received invalid key '${key}'. It's not part of this model's valueTypes`,
    );
  }

  throwUngettableValueError(key) {
    this.throwError(
      // prettier-ignore
      `Received invalid key '${key}'. It's not part of this model's valueTypes or derived values`,
    );
  }

  throwPrivateValueError(key) {
    this.throwError(`'${key}' is a private value and cannot be set`);
  }

  _computeDerivedValue(valueKey) {
    const { computeFunc } = this.constructor.derivedValueSpec[valueKey];
    if (computeFunc.isStatefulCompute) {
      return this._derivedValues[valueKey]();
    }

    return computeFunc(this);
  }

  _set(key, value) {
    if (this._isKeyPrivate(key)) {
      this.throwPrivateValueError(key);
    }
    return this._cloneWith({ [key]: value });
  }

  _get(key) {
    const { valueTypes, derivedValueTypes } = this.constructor;
    if (key in valueTypes) {
      return this._modelValues[key];
    }

    if (derivedValueTypes && key in derivedValueTypes) {
      // Lazily evaluate derived values.
      if (this._isUncalculatedDerivedValue(key)) {
        this._derivedValues[key] = this._computeDerivedValue(key);
        this._validateDerivedValue(key);
      }
      return this._derivedValues[key];
    }

    return this.throwUngettableValueError();
  }

  // NOTE(stephen): Public `get` method to stay consistent with new ZenModel.
  // Calling the getter via key indexing instead of `_get` in case the getter
  // was overridden.
  get(key) {
    return this[key]();
  }

  modelValues(values) {
    if (arguments.length === 0) {
      const { valueTypes, derivedValueTypes } = this.constructor;
      const keys = Object.keys(valueTypes);
      if (derivedValueTypes) {
        keys.push(...Object.keys(derivedValueTypes));
      }

      const result = {};
      keys.forEach(key => {
        result[key] = this[key]();
      });
      return result;
    }

    // do nothing if values is undefined or null
    if (values === undefined || values === null) {
      return this;
    }

    // make sure all keys are valid to set
    Object.keys(values).forEach(key => {
      if (this._isKeyPrivate(key)) {
        this.throwPrivateValueError(key);
      }
    });
    return this._cloneWith(values);
  }

  // @override
  // convert this ZenModel into an object, and recursively convert all internal
  // ZenModels into objects as well
  serialize() {
    return convertZenModels(this.modelValues());
  }

  // This method provides a way to have nested setters bubble up their changes
  // to the parent instances.
  deepUpdate() {
    return deepUpdate(this);
  }
}

// Set the class members for ZenModel
ZenModel.PUBLIC = VISIBILITIES.PUBLIC;
ZenModel.PRIVATE = VISIBILITIES.PRIVATE;
ZenModel.modelSpec = {};
ZenModel.valueTypes = {};
ZenModel.defaultValues = {};

// Iterate over ZenModel's prototype so we can collect all function names
// and make them reserved keywords
Object.getOwnPropertyNames(ZenModel.prototype).forEach(keyName => {
  if (typeof ZenModel.prototype[keyName] === 'function') {
    RESERVED_KEYWORDS.add(keyName);
  }
});

export { def, derived, hasChanged, convertZenModels, statefulCompute };
