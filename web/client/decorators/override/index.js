// @flow
import OverrideError from 'decorators/override/OverrideError';
import checkDescriptors from 'decorators/override/checkDescriptors';
import type { OverrideErrorOptions } from 'decorators/override/OverrideError';
import type { PropertyDescriptor } from 'types/jsCore';

type FunctionDescriptor = PropertyDescriptor<() => mixed>;

/**
 * NOTE(pablo): This file is now deprecated!
 * Use Flow's interface types instead.
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
 * The @override decorator can be used on any class function (either static or
 * instance) to signal that a function should be overriding a parent's
 * function. An error will be thrown if we are not overriding things correctly.
 *
 * NOTE: @override cannot be used to override non-function members.
 *
 * Example:
 *   class Parent {
 *     something() { }
 *   }
 *
 *   class Child {
 *     @override
 *     @somethingElse() { } // THROWS OverrideError!
 *   }
 *
 *   This will throw an error because somethingElse() is not overriding
 *   anything.
 *
 *   Errors will also be thrown if a function does not match the parent's
 *   function signature (determined only by checking the argument length,
 *   JS cannot check the argument types).
 *
 * This decorator is based very heavily on the core-decorators source code:
 *   https://github.com/jayphelps/core-decorators
 */

export default function override(
  target: Object,
  funcName: string,
  descriptor: FunctionDescriptor,
): $Shape<FunctionDescriptor> {
  if (__DEV__) {
    let parentClass = Object.getPrototypeOf(target);
    let parentDescriptor = Object.getOwnPropertyDescriptor(
      parentClass,
      funcName,
    );

    // If the parent class does not have this function, then keep climbing
    // up the prototype chain looking for it. When there is no parentClass,
    // we break out of the loop because it means we're at the top of the
    // prototype chain
    while (parentDescriptor === undefined && parentClass) {
      parentClass = Object.getPrototypeOf(parentClass);
      parentDescriptor = Object.getOwnPropertyDescriptor(parentClass, funcName);
    }

    const errorOptions: OverrideErrorOptions = {
      funcName,
      parent: parentClass,
      child: target,
    };

    if (parentDescriptor === undefined) {
      throw new OverrideError(
        'No function matching CHILD was found on the prototype chain.',
        errorOptions,
      );
    }

    // The parent class has this function, so let's compare the descriptors
    checkDescriptors(parentDescriptor, descriptor, errorOptions);
  }

  // return descriptor as is, this decorator doesn't change it
  return descriptor;
}
