/**
 * The deepUpdate library provides a way to bubble the setter call of a nested
 * ZenModel up to its parent instance.
 *
 * Usage:
 *   const newZenModelInstance = zenModelInstance.deepUpdate()
 *     .outerGetter()
 *     .middleGetter()
 *     .innerGetter()
 *     .property('value');
 *
 *  Right now, the deepUpdate library allows you to call a single setter at the
 *  end of the method chain. On its own, the result of this setter will be a new
 *  ZenModel instance that the setter applies to. The deepUpdate library will
 *  then bubble that new instance up, passing it into the parent method call
 *  (now being used as a setter), and this result is passed up to its parent,
 *  etc.
 *
 *  Requirements: All calls in the chain must be on a ZenModel instance. The
 *  last method call must set a value and return a new instance. All other
 *  method calls along the way must operate on a method that handles both
 *  get/set within the same method.
 */

// Proxy any function calls that are getters. If we reach a setter, assume we
// have reached the end of the chain and bubble up the changes.
function buildApplyHandler(getHandler) {
  // Keep track of the getter methods that are called
  const methodChain = [];

  return function apply(target, that, args) {
    // Call the outer function and let any calls within the function go
    // unproxied.
    const result = target.apply(that, args);

    // If a getter is being called, proxy the call so we can
    // bubble the final setter upwards.
    if (args.length === 0) {
      methodChain.push({ target, that });
      return new Proxy(result, getHandler);
    }

    // Call the setters in reverse order as we bubble the changes
    // up to the first method call.
    let output = result;
    for (let i = methodChain.length - 1; i >= 0; i--) {
      output = methodChain[i].target(output);
    }

    return output;
  };
}

// Proxy any function calls with the handler provided.
function buildGetHandler(applyHandler) {
  return function get(target, property) {
    const result = target[property];
    // Trap the next function call with our applyHandler
    if (typeof result === 'function') {
      // Bind target (aka target's this) to the method so we don't need to track
      // this/that along the way.
      return new Proxy(result.bind(target), applyHandler);
    }
    return result;
  };
}

// Hook into the instance passed in and apply our custom Proxy.
function deepUpdate(instance) {
  // Predefine the handlers since they have a circular dependency.
  const applyHandler = {};
  const getHandler = {};

  applyHandler.apply = buildApplyHandler(getHandler);
  getHandler.get = buildGetHandler(applyHandler);

  // Proxy the methods called on the instance. Using the getHandler first
  // since function name lookups count as a "get" call on the class.
  return new Proxy(instance, getHandler);
}

export default deepUpdate;
