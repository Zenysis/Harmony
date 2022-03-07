// @flow
/* eslint-disable no-use-before-define */
import PropTypes from 'prop-types';

import cast from 'lib/Zen/util/cast';
import deepUpdate from 'lib/Zen/ZenModel/deepUpdate';
import type {
  DeepUpdateGetters,
  DeepUpdateSetters,
} from 'lib/Zen/ZenModel/deepUpdate';

/**
 * ZenModel represents an immutable data model. It is immutable intentionally so
 * that it is easy to pass around in React, which prefers state and props to be
 * immutable. Any setter call will return a new instance, which can be passed
 * into component.setState to trigger a re-render (making it very easy to work
 * with React.PureComponent)
 *
 * ZenModels are defined similarly to how you specify a React component:
 *   - Models are described using Value types (similar to Props)
 *   - Models can have Optional values that are filled in with
 *     `static defaultValues` (similar to `static defaultProps`)
 *   - Extending models is NOT recommended (similar to how you shouldn't be
 *     extending React components).
 *
 * All ZenModel instances will have setter and getter methods created
 * automatically with the same name as the value key. For example:
 *   model.myValue('new value'); // sets myValue to 'new value'
 *   model.myValue(); // returns myValue
 *
 * Examples:
 *   type RequiredValues = {
 *     name: string,
 *   };
 *
 *   type DefaultValues = {
 *     dogdad: string,
 *   };
 *
 *   // USAGE NOTE: when extending Zen.BaseModel, the class itself must ALWAYS
 *   // be the first argument
 *   class Dog extends Zen.BaseModel<Dog, RequiredValues, DefaultValues> {
 *     static defaultValues = {
 *       dogdad: 'Pablo',
 *     }
 *
 *     speak(): string {
 *       // USAGE NOTE:
 *       // use `this._` (with an underscore) if you want to use the accessor
 *       // function shorthand: `this._.value()`. You only need this internally!
 *       // Outside of this class you'll be able to do `myDog.name()`
 *       // Also, using `this.get('name')` (without the _) will still work.
 *       return `I'm ${this._.name()} and ${this._.dogdad()} is my dad`;
 *     }
 *   }
 *
 *   // USAGE NOTE: you *must* export your class by casting it with our
 *   // Zen.Model<> utility type
 *   export default ((Dog: $Cast): Class<Zen.Model<Dog>>);
 *
 *   ^ This creates a Dog model with two value types: `name` and `dogdad`
 *
 *   We can make things more interesting by using derived values:
 *
 *   type RequiredValues = {
 *     name: string,
 *   };
 *
 *   type DefaultValues = {
 *     livesLeft: number,
 *   };
 *
 *   type DerivedValues = {
 *     properName: string,
 *   };
 *
 *   class Cat extends Zen.BaseModel<
 *     Cat,
 *     RequiredValues,
 *     DefaultValues,
 *     DerivedValues,
 *   > {
 *      static defaultValues: DefaultValues = {
 *       livesLeft: 9,
 *     };
 *
 *     static derivedConfig: Zen.DerivedConfig<Cat, DerivedValues> = {
 *       properName: [
 *         Zen.hasChanged('name'),
 *         cat => `Her Royal Highness ${cat.name()}`
 *        ],
 *     };
 *   }
 *   export default ((Cat: $Cast): Class<Zen.Model<Cat>>);
 *
 *   MODEL USAGE:
 *
 *   const dog = Dog.create({
 *     name: 'Luna',
 *     dogdad: 'Pablo',
 *   });
 *   dog.speak(); // logs 'I'm Luna and Pablo is my dad'
 *
 *   const cat = Cat.create({
 *     name: 'Meow Meow FuzzyFace'
 *   });
 *
 *   // resetting the name will cause the derived value `properName` to
 *   // recompute the next time we try to access it
 *   const newCat = cat.name('Cookie');
 *   const fullName = cat.properName(); // 'Her Royal Highness Cookie'
 *
 */

// Helper type to represent a model of any type
export type AnyModel = ZenModel<$AllowAny, $AllowAny, $AllowAny, $AllowAny>;

// Helper type to make all keys in an object optional.
type _Optional<Obj> = $Exact<{ ...$Rest<Obj, { ... }> }>;

type _AllValuesExtractor = <RequiredVals, DefaultVals, DerivedVals>(
  ZenModel<$AllowAny, RequiredVals, DefaultVals, DerivedVals>,
) => {
  ...RequiredVals,
  ...DefaultVals,
  ...DerivedVals,
};

// All the value types of a ZenModel merged together
export type AllValues<M: AnyModel> = $Call<_AllValuesExtractor, M>;

// Object containing all settable values in a ZenModel. This a merge of all
// RequiredValues and DefaultValues.
export type SettableValuesObject<M> = $Call<
  <RequiredVals, DefaultVals>(
    ZenModel<$AllowAny, RequiredVals, DefaultVals, $AllowAny>,
  ) => { ...RequiredVals, ...DefaultVals },
  M,
>;

type DerivedCalculationThunk<V, M: AnyModel> = {
  (): StatefulComputeDerivedValueFn<V, M>,
  isDerivedCalculation: true,
};

// Internal representation of the derived values object. In a ZenModel,
// a derived value may not have been computed yet, or might be a thunk.
type InternalDerivedValues<DerivedValueTypes, M: AnyModel> = $Shape<
  $ObjMap<
    DerivedValueTypes,
    <V: $Values<DerivedValueTypes>>(V) => V | DerivedCalculationThunk<V, M>,
  >,
>;

// Helper type that represents the value types that are expected when
// instantiating a new instance of a model. We do some type magic to
// enforce the required values, while keeping the optional values optional.
type ModelCreationValues<RequiredValues, DefaultValues> = $ReadOnly<{
  ...RequiredValues,
  ..._Optional<DefaultValues>,
}>;

type _RequiredValuesExtractor = <RequiredVals>(
  ZenModel<$AllowAny, RequiredVals, $AllowAny, $AllowAny>,
) => RequiredVals;

type _DefaultValuesExtractor = <DefaultVals>(
  ZenModel<$AllowAny, $AllowAny, DefaultVals, $AllowAny>,
) => DefaultVals;

// Helper type to reconstruct the ModelCreationValues accepted by
// `static create` and `constructor` when all you have is the full model.
export type CreationValues<M: AnyModel> = ModelCreationValues<
  $Call<_RequiredValuesExtractor, M>,
  $Call<_DefaultValuesExtractor, M>,
>;

// Helper types for the getter and setter functions on a model for any key
type Getter<M: AnyModel, K> = () => $ElementType<AllValues<M>, K>;
type Setter<M: AnyModel, K> = (
  Value: $ElementType<AllValues<M>, K>,
) => Model<M>;

// Helper type to create all the getters for all value keys on a model
type _AttachGetters<M: AnyModel> = $ObjMapi<
  AllValues<M>,
  <K, V>(K, V) => Getter<M, K>,
>;

// Helper type to create getters and setters for the values that support both
type _AttachGettersAndSetters<M: AnyModel> = $ObjMapi<
  SettableValuesObject<M>,
  <K, V>(K, V) => Getter<M, K> & Setter<M, K>,
>;

// Helper type to create all the accessor functions on a model.
type AttachAccessors<M: AnyModel> = {
  ..._AttachGetters<M>,
  ..._AttachGettersAndSetters<M>,
};

// Magic wrapper type to allow ZenModels to access their values using accessor
// methods. e.g. `model.name()` instead of `model.get('name')`
export type Model<M: AnyModel> = M & AttachAccessors<M>;

export type ShouldRecomputeFn<M: AnyModel> = (
  prevModel: Model<M>,
  currModel: Model<M>,
) => boolean;

export type StatefulComputeDerivedValueFn<V, M: AnyModel> = {
  computeFunc: (currModel: Model<M>, prevModel: Model<M> | void) => V,
  isStatefulCompute: true,
};

export type ComputeDerivedValueFn<V, M: AnyModel> = (currModel: Model<M>) => V;

type DerivedConfigElementValue<M: AnyModel, V> = [
  ShouldRecomputeFn<M>,
  ComputeDerivedValueFn<V, M> | StatefulComputeDerivedValueFn<V, M>,
];

export type DerivedConfig<
  M: AnyModel,
  DerivedValueTypes: { +[string]: mixed, ... },
> = $ObjMap<DerivedValueTypes, <V>(V) => DerivedConfigElementValue<M, V>>;

/**
 * Attach all the getter and setter accessors to a ZenModel class.
 * Given that all type definitions live in type land, the way we figure out
 * what all the keys are is by looking at the required values, default values
 * and derived config. By merging all of these we can get a set of all keys.
 */
function attachAccessors<M: AnyModel>(
  ModelClass: Class<M>,
  values: $Call<_RequiredValuesExtractor, M>,
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

/**
 * Wrap a stateful calculation around a thunk so as to defer the evaluation.
 * @param {StatefulComputeDerivedValueFn<V>} statefulCalculation
 * @param {ZenModel} thisModel
 * @param {ZenModel} prevModel
 * @returns {() => V)} a thunk wrapping the calculation evaluation
 */
function _createDerivedCalculationThunk<V, M: AnyModel>(
  statefulCalculation: StatefulComputeDerivedValueFn<V, M>,
  thisModel: M,
  prevModel: M | void,
): DerivedCalculationThunk<V, M> {
  const thunk = () => statefulCalculation.computeFunc(thisModel, prevModel);
  thunk.isDerivedCalculation = true;
  return (thunk: $Cast);
}

export default class ZenModel<
  Self: AnyModel,
  RequiredValueTypes: $AllowAny = {},
  DefaultValueTypes: $AllowAny = {},
  DerivedValueTypes: $AllowAny = {},
> {
  static +defaultValues: $ReadOnly<DefaultValueTypes> | void = undefined;
  static +derivedConfig: DerivedConfig<Self, DerivedValueTypes> = {};
  static +displayName: string | void = undefined;

  // boolean flag to notify us if a model spec has been fully built (meaning
  // that it has had all its getter and setter accessors attached)
  static _isFullyBuilt: boolean = false;

  _modelValues: { ...RequiredValueTypes, ...DefaultValueTypes };
  _derivedValues: InternalDerivedValues<DerivedValueTypes, Self>;

  // hacky way for a model to refer to its fully built model internally
  +_: Model<Self> = (this: $Cast);

  static create(
    values: ModelCreationValues<RequiredValueTypes, DefaultValueTypes>,
  ): Model<Self> {
    if (!this._isFullyBuilt) {
      attachAccessors(
        cast<Class<Self>>(this),
        values,
        this.defaultValues,
        this.derivedConfig,
      );
      this._isFullyBuilt = true;
    }
    return (new this(values): $Cast);
  }

  /**
   * Get the display name (either the class default name, or the user-defined
   * class variable displayName) to show in error messages
   */
  static classDisplayName(): string {
    const { name, displayName } = this;
    if (displayName && typeof displayName === 'string') {
      return displayName;
    }
    return name;
  }

  /**
   * Helper function so this instance can be easily included in
   * Component or Model prop types.
   * TODO(pablo): this function is only being added for backward compatibility.
   * Once all components and models are moved to Flow, remove this function.
   * NOTE(stephen): Latest version of flow 0.100.0 has issues with returning
   * a ReactPropsChainableTypeChecker (to give access to isRequired) (flow has
   * the wrong definition for prop-types in its lib). Instead of fixing the
   * issue here, I have just called `PropTypes.instanceOf` directly in the
   * offending sites since this code is deprecated anyways.
   * @deprecated
   * @return {ReactPropsCheckType} function
   */
  static type(): ReactPropsCheckType {
    return PropTypes.instanceOf(this);
  }

  constructor(
    values: ModelCreationValues<RequiredValueTypes, DefaultValueTypes>,
    prevModel?: this | void = undefined,
  ) {
    this._modelValues = this._setupModelValues(values);
    this._derivedValues = this._setupDerivedValues(cast<Self>(prevModel));
  }

  _cloneWith(
    values: $Shape<{ ...RequiredValueTypes, ...DefaultValueTypes }>,
  ): Model<Self> {
    const newVals = { ...this._modelValues, ...values };
    const output = new this.constructor(newVals, this);
    return ((output: $Cast): Model<Self>);
  }

  _setupModelValues(
    values: ModelCreationValues<RequiredValueTypes, DefaultValueTypes>,
  ): { ...RequiredValueTypes, ...DefaultValueTypes } {
    const { defaultValues } = this.constructor;
    const modelValues = { ...values };

    // if no default values are specified, just return the modelValues as is
    if (!defaultValues) {
      return modelValues;
    }

    Object.keys(defaultValues).forEach(key => {
      // any undefined values should get replaced with its corresponding
      // default value
      if (modelValues[key] === undefined) {
        modelValues[key] = defaultValues[key];
      }
    });
    return modelValues;
  }

  /**
   * Check if a `valueKey` corresponds to a derived value that has
   * yet to be calculated.
   */
  _isUncalculatedDerivedValue(valueKey: $Keys<DerivedValueTypes>): boolean {
    if (!(valueKey in this._derivedValues)) {
      return true;
    }

    const val = this._derivedValues[valueKey];
    return typeof val === 'function' && !!val.isDerivedCalculation;
  }

  _setupDerivedValues(
    prevModel?: Self,
  ): InternalDerivedValues<DerivedValueTypes, Self> {
    const { derivedConfig } = this.constructor;
    const castedThis = cast<Self>(this); // to avoid flow errors
    const derivedValues = {};
    Object.keys(derivedConfig).forEach(valueKey => {
      const [shouldRecomputeFunc, computeFunc] = derivedConfig[valueKey];

      // Set up the value for recomputing if:
      // 1. There is no prevModel (meaning nothing has been computed yet)
      // 2. OR there is a previous model and it still didn't compute this value
      // 3. OR there is a previous model and shouldRecomputeFunc is true
      if (
        prevModel === undefined ||
        (prevModel && prevModel._isUncalculatedDerivedValue(valueKey)) ||
        (prevModel && shouldRecomputeFunc(prevModel, castedThis))
      ) {
        // Only set a thunk if we need to preserve prevModel for derived value
        // computation.
        if (typeof computeFunc === 'object' && computeFunc.isStatefulCompute) {
          derivedValues[valueKey] = _createDerivedCalculationThunk(
            computeFunc,
            castedThis,
            prevModel,
          );
        }
      } else {
        derivedValues[valueKey] = prevModel._derivedValues[valueKey];
      }
    });
    return derivedValues;
  }

  _computeDerivedValue<K: $Keys<DerivedValueTypes>>(
    valueKey: K,
  ): $ElementType<DerivedValueTypes, K> {
    const [, computeFunc] = this.constructor.derivedConfig[valueKey];

    // if the computeFunc is a stateful computation, then the derived value
    // should have already been wrapped in a func in _setupDerivedValues
    if (computeFunc.isStatefulCompute) {
      return this._derivedValues[valueKey]();
    }

    return computeFunc(cast<Self>(this));
  }

  clone(): Model<Self> {
    const output = new this.constructor(this._modelValues, this);
    return ((output: $Cast): Model<Self>);
  }

  set<O: SettableValuesObject<Self>, K: $Keys<O>>(
    key: K,
    value: $ElementType<O, K>,
  ): Model<Self> {
    return this._cloneWith({ [key]: value });
  }

  get<K: $Keys<AllValues<Self>>>(key: K): $ElementType<AllValues<Self>, K> {
    if (key in this.constructor.derivedConfig) {
      // Lazily evaluate derived values
      if (this._isUncalculatedDerivedValue(key)) {
        this._derivedValues[key] = this._computeDerivedValue(key);
      }
      return this._derivedValues[key];
    }
    return this._modelValues[key];
  }

  // NOTE(pablo): we specify `modelValues` as a class property so that we can
  // define it with multiple signatures. We need multiple signatures to allow
  // `modelValues()` and `modelValues(vals)` with different return types
  // depending on the argument passed. We need to use Flow's comment annotation
  // because babel cannot parse multiple definitions of the same property.
  /* ::
  +modelValues: ((
    values: _Optional<{ ...RequiredValueTypes, ...DefaultValueTypes }>,
  ) => Model<Self>) &
    (() => {|
      ...RequiredValueTypes,
      ...DefaultValueTypes,
      ...DerivedValueTypes
    |});
  */
  modelValues(
    values?: _Optional<{ ...RequiredValueTypes, ...DefaultValueTypes }>,
  ): mixed {
    if (arguments.length === 0) {
      // collect all the values and return them
      const { derivedConfig } = this.constructor;
      const result = { ...this._modelValues };
      Object.keys(derivedConfig).forEach(key => {
        result[key] = this.get(key);
      });
      return ((result: $Cast): {
        ...RequiredValueTypes,
        ...DefaultValueTypes,
        ...DerivedValueTypes,
      });
    }

    // do nothing if values is undefined or null
    if (values === undefined || values === null) {
      return this._;
    }

    return this._cloneWith(values);
  }

  /**
   * This method provides a way to have nested setters bubble up their changes
   * to the parent instances.
   */
  deepUpdate(): DeepUpdateGetters<Model<Self>, Model<Self>> &
    DeepUpdateSetters<Model<Self>, Model<Self>> {
    return deepUpdate(((this: $Cast): Self));
  }
}
