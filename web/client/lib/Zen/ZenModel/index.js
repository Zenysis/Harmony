// @flow
/* eslint-disable no-use-before-define */
import PropTypes from 'prop-types';

import attachAccessors from 'lib/Zen/ZenModel/attachAccessors';
import cast from 'lib/Zen/util/cast';
import deepUpdate from 'util/ZenModel/deepUpdate';
import {
  hasChanged,
  hasChangedDeep,
  statefulCompute,
} from 'lib/Zen/ZenModel/coreHelpers';
import type ZenArray, { DeepUpdateZenArrayAPI } from 'util/ZenModel/ZenArray';
import type ZenMap, { DeepUpdateZenMapAPI } from 'util/ZenModel/ZenMap';

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
 *   // USAGE NOTE: you *must* export your class by wrapping with our
 *   // Zen.Model<> utility type
 *   export default ((Dog: any): Class<Zen.Model<Dog>>);
 *
 *   ^ This creates a Dog model with two value types: `name` and `dogdad`
 *
 *   We can make things more interesting by using Zen.ReadOnly<> types and
 *   derived values:
 *
 *   type RequiredValues = {
 *     name: string,
 *   };
 *
 *   type DefaultValues = {
 *     livesLeft: Zen.ReadOnly<number>,
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
 *     static defaultValues = {
 *       livesLeft: 9,
 *     };
 *
 *     static derivedConfig = {
 *       properName: [
 *         Zen.hasChanged<Cat>('name'),
 *         cat => `Your Royal Highness ${cat.name()}`
 *        ],
 *     };
 *   }
 *   export default ((Cat: any): Class<Zen.Model<Cat>>);
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
 *   const fullName = cat.properName(); // 'Your Royal Highness Cookie'
 *
 *   // Can't set a readOnly value after initialization! Throws a type error.
 *   const errCat = newCat.livesLeft(8); // TYPE ERROR. This cat lives forever.
 *
 */

// Wrapper type to annotate a value on a ZenModel as ReadOnly
export opaque type ReadOnly<T>: T = T;

// Helper type to make all keys in an object optional.
// $Shape<> should do the same thing but for some reason it wasn't working
// the way we expected in the `static create` function.
type _Optional<Obj: {}> = { ...$Rest<Obj, {}> };

// Helper type to merge two objects into a new one. This is different from
// using the intersection operator `&`. We use the spread operator to create
// an entirely new object type.
type _Merge<A: {}, B: {}> = { ...$Exact<A>, ...$Exact<B> };

type _AllValuesExtractor = <RequiredVals, DefaultVals, DerivedVals>(
  ZenModel<any, RequiredVals, DefaultVals, DerivedVals>,
) => {
  ...$Exact<RequiredVals>,
  ...$Exact<DefaultVals>,
  ...$Exact<DerivedVals>,
};

// Open up all the values from a given Values object (meaning if there are any
// `ReadOnly<T>` wrappers we extract the wrapped type)
type Open<Vals> = $ObjMap<Vals, (<V>(ReadOnly<V>) => V) & (<V>(V) => V)>;

// All the value types of a ZenModel merged together
export type AllValues<M: AnyModel> = $Call<_AllValuesExtractor, M>;

type _SettableValuesExtractor = <RequiredVals, DefaultVals, DerivedVals>(
  ZenModel<any, RequiredVals, DefaultVals, DerivedVals>,
) => _Merge<RequiredVals, DefaultVals>;

export type SettableValues<M: AnyModel> = $Call<_SettableValuesExtractor, M>;

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
type ModelCreationValues<RequiredValues, DefaultValues> = $Exact<
  Open<_Merge<RequiredValues, _Optional<DefaultValues>>>,
>;

type _RequiredValuesExtractor = <RequiredVals>(
  ZenModel<any, RequiredVals, any, any>,
) => RequiredVals;

type _DefaultValuesExtractor = <DefaultVals>(
  ZenModel<any, any, DefaultVals, any>,
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
  SettableValues<M>,
  <K, V>(K, V) => Getter<M, K> & Setter<M, K>,
>;

// Helper type to create all the accessor functions on a model.
// NOTE: we wanted to just intersect getters with setters, the way we do for
// DeepUpdate<>, but for some reason that wasn't working well. So we went
// with this merged object approach instead.
type AttachAccessors<M: AnyModel> = _Merge<
  _AttachGetters<M>,
  _AttachGettersAndSetters<M>,
>;

// Helper type to represent a model of any type
export type AnyModel = ZenModel<any, any, any, any>;

// Magic wrapper type to allow ZenModels to access their values using accessor
// methods. e.g. `model.name()` instead of `model.get('name')`
// export type Model<M: AnyModel> = M & AttachAccessors<M>;
export type Model<M: AnyModel> = M & AttachAccessors<M>;

// Helper type to extract all value keys from a model (values and
// derived values)
export type ModelValueKeys<M: AnyModel> = $Keys<
  $PropertyType<M, '_modelValues'> & $PropertyType<M, '_derivedValues'>,
>;

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

type DerivedConfig<
  M: AnyModel,
  DerivedValueTypes: { +[string]: mixed },
> = $ObjMap<DerivedValueTypes, <V>(V) => DerivedConfigElementValue<M, V>>;

type DeepUpdateGetters<M: AnyModel, FinalReturn: AnyModel> = $ObjMapi<
  SettableValues<M>,
  <K, ChildModel: AnyModel | ZenArray<any> | ZenMap<any>>(
    K,
    ChildModel,
  ) => () => DeepUpdate<ChildModel, FinalReturn>,
>;

type DeepUpdateSetters<
  M: AnyModel | ZenArray<any> | ZenMap<any>,
  FinalReturn: AnyModel,
> = $Call<
  (<T>(ZenArray<T>) => DeepUpdateZenArrayAPI<T, FinalReturn>) &
    (<T>(ZenMap<T>) => DeepUpdateZenMapAPI<T, FinalReturn>) &
    (AnyModel => $ObjMapi<
      SettableValues<M>,
      <K, V>(K, V) => ($ElementType<SettableValues<M>, K>) => FinalReturn,
    >),
  M,
>;

type DeepUpdate<
  M: AnyModel | ZenArray<any> | ZenMap<any>,
  FinalReturn: AnyModel,
> = $Call<
  ((ZenArray<any>) => DeepUpdateSetters<M, FinalReturn>) &
    ((ZenMap<any>) => DeepUpdateSetters<M, FinalReturn>) &
    (AnyModel => DeepUpdateGetters<M, FinalReturn> &
      DeepUpdateSetters<M, FinalReturn>),
  M,
>;

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
  return (thunk: any);
}

export default class ZenModel<
  Self: AnyModel,
  RequiredValueTypes: any = {},
  DefaultValueTypes: any = {},
  DerivedValueTypes: any = {},
> {
  static defaultValues: $ReadOnly<
    $Exact<Open<DefaultValueTypes>>,
  > | void = undefined;

  static derivedConfig: DerivedConfig<Self, DerivedValueTypes> = {};
  static displayName: string | void = undefined;

  // boolean flag to notify us if a model spec has been fully built (meaning
  // that it has had all its getter and setter accessors attached)
  static _isFullyBuilt: boolean = false;

  _modelValues: RequiredValueTypes & DefaultValueTypes;
  _derivedValues: InternalDerivedValues<DerivedValueTypes, Self>;

  // hacky way for a model to refer to its fully built model internally
  +_: Model<Self> = (this: any);

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
    return (new this(values): any);
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
    values: $Shape<RequiredValueTypes & DefaultValueTypes>,
  ): Model<Self> {
    const newVals = { ...this._modelValues, ...values };
    const output = new this.constructor(newVals, this);
    return ((output: any): Model<Self>);
  }

  _setupModelValues(
    values: ModelCreationValues<RequiredValueTypes, DefaultValueTypes>,
  ): RequiredValueTypes & DefaultValueTypes {
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
    if (!derivedConfig) {
      return {};
    }

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

  constructError(msg: string): Error {
    const name = this.constructor.classDisplayName();
    return new Error(`[${name}] ${msg}`);
  }

  set<K: $Keys<RequiredValueTypes & DefaultValueTypes>>(
    key: K,
    value: $ElementType<RequiredValueTypes & DefaultValueTypes, K>,
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
    values: $Exact<_Optional<_Merge<RequiredValueTypes, DefaultValueTypes>>>,
  ) => Model<Self>) &
    (() => RequiredValueTypes & DefaultValueTypes & DerivedValueTypes);
  */
  modelValues(
    values?: $Exact<_Optional<_Merge<RequiredValueTypes, DefaultValueTypes>>>,
  ):
    | Model<Self>
    | (RequiredValueTypes & DefaultValueTypes & DerivedValueTypes) {
    if (arguments.length === 0) {
      // collect all the values and return them
      const { derivedConfig } = this.constructor;
      const result = { ...this._modelValues };
      Object.keys(derivedConfig).forEach(key => {
        result[key] = this.get(key);
      });
      return ((result: any): RequiredValueTypes &
        DefaultValueTypes &
        DerivedValueTypes);
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
  deepUpdate(): DeepUpdate<Model<Self>, Model<Self>> {
    return deepUpdate(this);
  }
}

export { hasChanged, hasChangedDeep, statefulCompute };
