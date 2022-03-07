// @flow
import type { DataDescriptor, AccessorDescriptor } from 'types/jsCore';

/**
 * Auto-bind any function to the class instance:
 * Example:
 *   class SomeComponent extends React.Component {
 *     @autobind
 *     onClick() { }
 *   }
 *
 * Code based heavily on the core-decorators and auto-bind repos:
 * https://github.com/jayphelps/core-decorators/blob/master/src/autobind.js
 * https://github.com/andreypopp/autobind-decorator/blob/master/src/index.js
 *
 * NOTE: this may break in IE due to an infinite recursion bug. If we add
 * IE support add the fix that's included in the autobind-decorator repo.
 */
export default function autobind<Func: () => mixed>(
  target: $AllowAny,
  funcName: string,
  descriptor: DataDescriptor<Func>,
): AccessorDescriptor<Func> {
  const func = descriptor.value;
  if (typeof func !== 'function') {
    throw new SyntaxError('@autobind can only be used on functions');
  }

  return {
    configurable: descriptor.configurable,
    enumerable: descriptor.enumerable,
    get() {
      if (
        // accessing func directly on the prototype, so no need to bind
        this === target ||
        // accessing func directly on a prototype, but it was found up the
        // chain, not defined directly on it. Also no need to bind.
        (this.constructor !== target.constructor &&
          Object.getPrototypeOf(this).constructor === constructor)
      ) {
        return func;
      }

      const boundFunc = func.bind(this);
      Object.defineProperty(this, funcName, {
        value: boundFunc,
        configurable: true,
        writable: true,
        enumerable: false, // not enumerable when it's a bound method
      });

      // $FlowIssue[incompatible-return] boundFunc is still of same type as func
      return boundFunc;
    },
    set(newFunc) {
      Object.defineProperty(this, funcName, {
        value: newFunc,
        configurable: true,
        writable: true,
        enumerable: true, // is enumerable when assigned
      });
    },
  };
}
