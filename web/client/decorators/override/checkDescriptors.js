// @flow
import OverrideError from 'decorators/override/OverrideError';
import type { DescriptorType, PropertyDescriptor } from 'types/jsCore';
import type { OverrideErrorOptions } from 'decorators/override/OverrideError';

type FunctionDescriptor = PropertyDescriptor<() => mixed>;

function hasOwnProperty(obj: FunctionDescriptor, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

/**
 * Property descriptors are either a value descriptor, or are accessed through
 * a getter or setter. Both are overrideable, but have to be checked in
 * different ways.
 */
function getDescriptorType(descriptor: FunctionDescriptor): DescriptorType {
  if (hasOwnProperty(descriptor, 'get') || hasOwnProperty(descriptor, 'set')) {
    return 'accessor';
  }

  // If there are no accsesor methods, then this is a data descriptor
  return 'data';
}

function checkFunctionSignatures(
  parentFunc: Function,
  childFunc: Function,
  errorOptions: OverrideErrorOptions,
): void {
  // Check the function's length properties. (the length property is how many
  // arguments they take)
  // We don't really have a way of checking a function's argument types at
  // runtime in Javascript, just the number of arguments.
  // It's okay for a child function to have less arguments than the parent,
  // but child function cannot have more arguments.
  if (parentFunc.length < childFunc.length) {
    throw new OverrideError(
      'The function signatures of CHILD and PARENT do not match.',
      errorOptions,
    );
  }
}

function checkDataDescriptors(
  parentDescriptor: FunctionDescriptor,
  childDescriptor: FunctionDescriptor,
  errorOptions: OverrideErrorOptions,
): void {
  // comparing data descriptors is easier, we just have to make sure they are
  // functions and then compare signatures
  const parentValue = parentDescriptor.value;
  const childValue = childDescriptor.value;
  if (typeof childValue !== 'function') {
    throw new OverrideError(
      '@override can only be used on functions. CHILD is not a function',
      errorOptions,
    );
  }

  if (typeof parentValue !== 'function') {
    throw new OverrideError(
      '@override can only be used to override functions. PARENT is not a function.',
      errorOptions,
    );
  }

  checkFunctionSignatures(parentValue, childValue, errorOptions);
}

function checkAccessorDescriptors(
  parentDescriptor: FunctionDescriptor,
  childDescriptor: FunctionDescriptor,
  errorOptions: OverrideErrorOptions,
): void {
  // comparing accessor types is difficult because there's so many ways
  // they can go wrong. We need to check every possibility where one accessor
  // might exist, but not the other
  const parentHasGetter = typeof parentDescriptor.get === 'function';
  const childHasGetter = typeof parentDescriptor.get === 'function';
  const parentHasSetter = typeof childDescriptor.set === 'function';
  const childHasSetter = typeof childDescriptor.set === 'function';

  // check getters if we have any
  if (parentHasGetter || childHasGetter) {
    if (!parentHasGetter && parentHasSetter) {
      throw new OverrideError(
        'PARENT is a setter but CHILD is a getter',
        errorOptions,
      );
    }
    if (!childHasGetter && childHasSetter) {
      throw new OverrideError(
        'PARENT is a getter but CHILD is a setter',
        errorOptions,
      );
    }
    if (parentDescriptor.get && childDescriptor.get) {
      checkFunctionSignatures(
        parentDescriptor.get,
        childDescriptor.get,
        errorOptions,
      );
    }
  }

  // check setters if we have any
  if (parentHasSetter || childHasSetter) {
    if (!parentHasSetter && parentHasGetter) {
      throw new OverrideError(
        'PARENT is a getter but CHILD is a setter',
        errorOptions,
      );
    }
    if (!childHasSetter && childHasGetter) {
      throw new OverrideError(
        'PARENT is a setter but CHILD is a getter',
        errorOptions,
      );
    }
    if (parentDescriptor.set && childDescriptor.set) {
      checkFunctionSignatures(
        parentDescriptor.set,
        childDescriptor.set,
        errorOptions,
      );
    }
  }
}

// Compare two function descriptors and make sure that they are the same type,
// contain function values, and match in function signatures
export default function checkDescriptors(
  parentDescriptor: FunctionDescriptor,
  childDescriptor: FunctionDescriptor,
  errorOptions: OverrideErrorOptions,
): void {
  const parentDescriptorType = getDescriptorType(parentDescriptor);
  const childDescriptorType = getDescriptorType(childDescriptor);

  // first check if the descriptors are of the same type
  // (i.e. data vs. accessor descriptors)
  if (parentDescriptorType !== childDescriptorType) {
    throw new OverrideError(
      `Descriptor types do not match. PARENT is a ${parentDescriptorType} property, but CHILD is a ${childDescriptorType} property.`,
      errorOptions,
    );
  }

  // different descriptor types have to be compared differently, so let's
  // do that
  if (childDescriptorType === 'data') {
    checkDataDescriptors(parentDescriptor, childDescriptor, errorOptions);
  } else {
    checkAccessorDescriptors(parentDescriptor, childDescriptor, errorOptions);
  }
}
