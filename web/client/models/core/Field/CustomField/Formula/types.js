// @flow

/**
 * Map field id or dimension id to value. E.g. `num_malaria: 10`,
 * or `RegionName: Amhara`
 */
export type DataFrameRow = {
  +[fieldOrDimensionId: string]: string | number | void,
  ...,
};

/**
 * The full dataframe that a custom calculation has access to.
 * Every query result data type must have a way of being represented
 * as a dataframe so that custom calculations can have a common interface
 * to operate with the data.
 *
 * NOTE(pablo): The DataFrame type very intentionally uses `void` (undefined)
 * instead of `null`. The reason is because `undefined` is handled the way we'd
 * want in mathematical calculations, whereas `null` gets treated as 0 which
 * is not what we want. For example, `null / 0` is 0, but `undefined / 0` is
 * NaN. We want the treatment that results in NaN.
 *
 */
export type DataFrame = {
  /**
   * The full dataframe specified as rows. Each row includes all fields and
   * group bys. If the row has a date it is accessible via the 'timestamp' key.
   */
  rows: $ReadOnlyArray<DataFrameRow>,

  /**
   * A simplified version of the dataframe which drops dimensions, and converts
   * it to a map of indicator ids to their full array of values. This allows
   * users to easily do stuff like:
   *   `sum(data.values.some_indicator)`
   */
  values: {
    [fieldId: string]: Array<number | void>,
    ...,
  },
};

/**
 * The environment used to prepare the JS interpreter for the evaluation of
 * a custom calculation's formula.
 * An environment maps JavaScript identifiers to number values. Think of it
 * as a lookup dict for variable names used when calculating a formula.
 */
export type Environment = {
  /** The current row number being processed */
  rowNum: number,

  /**
   * The current row being processed. This is an object with keys representing a
   * field or dimension id, and the values are strings, numbers, or null.
   *
   * NOTE(pablo): we intentionally use `void` here instead of `null`. Read
   * the comment in the `DataFrame` type to understand why.
   */
  row: {
    [fieldOrDimensionId: string]: string | number | void,
  },

  /** The full dataframe available */
  dataFrame: DataFrame,
};

// the type of an internal InterpreterObject. We should never need to create
// or mutate these directly
export type InterpreterObject<T: { ... }> = {
  getter: {},
  nativeFunc?: (...args: $ReadOnlyArray<empty>) => mixed,
  parentScope?: InterpreterObject<mixed> | null,
  properties: T,
  proto: InterpreterObject<mixed>,
  setter: {},
  strict?: boolean,
};

export type InterpreterArray<+T> = {
  ...InterpreterObject<{ ... }>,
  class: 'Array',
  properties: {
    length: number,
    [number]: T,
  },
};

type InterpreterState = {
  done: boolean,
  n_: number,
  node: mixed,
  scope: InterpreterObject<mixed>,
};

// recursive helper type to convert a value to a type consumable by our
// Interpreter
type NativeToPseudo = (<T: { ... }>(
  obj: T,
) => InterpreterObject<$ObjMap<T, NativeToPseudo>>) &
  (<T>(arr: $ReadOnlyArray<T>) => InterpreterArray<$Call<NativeToPseudo, T>>) &
  (<T: mixed>(val: T) => T);

// The type of the JS Interpreter
export type Interpreter = {
  +run: () => void,

  /**
   * Convert a native JS function to a function that can be used inside the
   * JS Interpreter
   */
  +createNativeFunction: (
    fn: (...args: $ReadOnlyArray<empty>) => mixed,
  ) => InterpreterObject<mixed>,
  +getScope: () => InterpreterObject<mixed>,

  /**
   * Convert a native JS object or array to an object/array that can be used
   * inside the JS Interpreter
   */
  +nativeToPseudo: <T>(val: T) => $Call<NativeToPseudo, T>,

  +setProperty: (
    scope: InterpreterObject<mixed>,
    identifier: string,
    value: mixed,
  ) => void,
  value: mixed,
  stateStack: Array<InterpreterState>,
};
