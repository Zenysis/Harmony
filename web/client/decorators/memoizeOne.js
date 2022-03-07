// @flow
import memoize from 'memoize-one';

import type {
  AccessorDescriptor,
  FieldDecoratorDescriptor,
  PropertyDescriptor,
} from 'types/jsCore';

type FuncDecorator<Func: () => mixed> = (
  target: $AllowAny,
  funcName: string,
  descriptor: FieldDecoratorDescriptor<Func>,
) => PropertyDescriptor<Func>;

type EqualityFunc = (
  newArgs: $ReadOnlyArray<mixed>,
  prevArgs: $ReadOnlyArray<mixed>,
) => boolean;

function memoizeDecorator<Func: () => mixed>(
  equalityFn: EqualityFunc | void,
  target: $AllowAny,
  funcName: string,
  descriptor: FieldDecoratorDescriptor<Func>,
): AccessorDescriptor<Func> {
  // get the function from the descriptor
  let func;
  if (descriptor.value) {
    // if the decorator was on a class function, then
    // the function will be in descriptor.value
    func = descriptor.value;
  } else if (descriptor.initializer) {
    // if the decorator was on a class field, then the
    // function is retrieved by calling descriptor.initializer()

    func = descriptor.initializer();
  } else {
    throw new SyntaxError(
      '@memoizeOne decorator must be applied to a valid descriptor',
    );
  }

  // check that what we got from the descriptor is actually a function
  if (typeof func !== 'function') {
    throw new SyntaxError('@memoizeOne can only be used on functions');
  }

  // create the new descriptor
  return {
    configurable: descriptor.configurable,
    enumerable: descriptor.enumerable,
    get() {
      // memoize the function
      const memoizedFunc =
        equalityFn === undefined ? memoize(func) : memoize(func, equalityFn);

      // set the memoized function as the new value for this descriptor
      Object.defineProperty(this, funcName, {
        value: memoizedFunc,
        configurable: true,
        writable: true,
        enumerable: true,
      });
      return memoizedFunc;
    },
  };
}

/**
 * Add simple memoization to any function. This decorator uses the memoize-one
 * library, which means it will only memoize the *last* result.
 *
 * This decorator can be used on both class fields and class functions.
 * Usage:
 *   import { objKeyCompare } from 'util/objUtil';
 *
 *   class SomeComponent extends React.Component {
 *     @memoizeOne myFunc = SomeUtil.myFunc;
 *
 *     @memoizeOne
 *     getSomethingExpensive(someArg) {
 *       return expensiveComputation();
 *     }
 *
 *     @memoizeOne(objKeyCompare('name', 'age', 'somethingElse'))
 *     getOtherExpensiveThing(someObj) {
 *     }
 *   }
 *
 * Sometimes you need your memoization to use something more complicated
 * than === to evaluate if the arguments changed. You're allowed to pass
 * your own custom equality function to @memoizeOne().
 * If you want to compare keys in an object, we've created an `objKeyCompare`
 * utility function to easily check if the keys in an object have changed.
 */
export default function memoizeOne<Func: () => mixed>(
  targetOrEqualityFunc: EqualityFunc | void | $AllowAny,
  funcName: string,
  descriptor: FieldDecoratorDescriptor<Func>,
): PropertyDescriptor<Func> | FuncDecorator<Func> {
  // inspect the arguments to see if the decorator was used standalone
  // (i.e. `@memoizeOne`) or as a function (i.e. `@memoizeOne()`)

  // This is a functional decorator. i.e. its usage was
  // `@memoizeOne()` or `@memoizeOne(equalityFn)`
  if (
    targetOrEqualityFunc === undefined ||
    typeof targetOrEqualityFunc === 'function'
  ) {
    const equalityFuncArg: EqualityFunc | void = targetOrEqualityFunc;
    return (
      target: $AllowAny,
      fnName: string,
      propertyDescriptor: FieldDecoratorDescriptor<Func>,
    ): PropertyDescriptor<Func> =>
      memoizeDecorator(equalityFuncArg, target, fnName, propertyDescriptor);
  }

  // This is a standalone decorator, i.e. its usage was `@memoizeOne`
  const target: $AllowAny = targetOrEqualityFunc;
  return memoizeDecorator(undefined, target, funcName, descriptor);
}
