import hoistNonReactStatic from 'hoist-non-react-statics';

export function noop() {}

export function maybeOpenNewTab(url, metaKey) {
  if (metaKey) {
    window.open(url, '_blank');
  } else {
    document.location = url;
  }
}

export function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}

export function generateIdToObjectMapping(objects, idField = 'id') {
  const output = {};
  if (objects) {
    objects.forEach(object => {
      output[object[idField]] = object;
    });
  }
  return output;
}

// Composes key:value pairs into &key=value
export function composeQueryParams(queryParamDict) {
  return Object.keys(queryParamDict)
    .map(key => `${key}=${encodeURIComponent(queryParamDict[key])}`)
    .join('&');
}

export const DATE_FORMAT = 'YYYY-MM-DD';

export function scrollWindowTo(scrollPx, smooth = false, animateOptions) {
  if (smooth) {
    return $('html, body')
      .animate(
        {
          scrollTop: scrollPx,
        },
        animateOptions,
      )
      .promise();
  }
  return $('html, body')
    .scrollTop(scrollPx)
    .promise();
}

export function smoothScrollIntoView(elt) {
  const $elt = $(elt);
  const offset = $elt.offset();
  return scrollWindowTo(offset.top - 45, true);
}

export function sortNumeric(a, b, reverse = false) {
  // TODO(stephen): Find out if we can switch this to Number.isFinite
  /* eslint-disable no-restricted-globals */
  const aIsFinite = isFinite(a);
  const bIsFinite = isFinite(b);
  /* eslint-enable no-restricted-globals */

  if (!aIsFinite && !bIsFinite) {
    return 0;
  }
  if (!aIsFinite) {
    return 1;
  }
  if (!bIsFinite) {
    return -1;
  }

  if (reverse) {
    return b - a;
  }
  return a - b;
}

export function sortAlphabetic(str1, str2, reverse = false) {
  const result = str1.localeCompare(str2);
  return reverse ? result * -1 : result;
}

// Check ~3 times a second.
const DEFINITION_CHECK_INTERVAL_MS = 300;

// 5 minutes timeout.
const DEFINITION_CHECK_TIMEOUT_MS = 1000 * 60 * 5;

export function waitUntilMaybeDefined(windowVarName, callback) {
  // Caller should handle a potential failure case!
  // Invokes callback when window.windowVarName becomes defined. Callback args
  // are of the form (err, someVar).
  let count = 0;
  const t = setInterval(() => {
    if (++count * DEFINITION_CHECK_INTERVAL_MS > DEFINITION_CHECK_TIMEOUT_MS) {
      // We've checked too many times.
      clearInterval(t);
      callback(true, null);
    } else if (typeof window[windowVarName] !== 'undefined') {
      // It's loaded!
      clearInterval(t);
      callback(false, window[windowVarName]);
    }
  }, DEFINITION_CHECK_INTERVAL_MS);
  return t;
}

let idCounter = 0;
// Generates a uniqueId for this browser session, basically in the same
// way that lodash does
export function uniqueId() {
  return ++idCounter;
}

// Given an object and keys, creates a new object with those keys picked
// from the original object.
// This has the same functionality as the lodash 'pick' function (except
// that we only allow top-level keys to be picked, and not object paths).
// If 'keys' is an object, this is equivalent to doing pick(obj, Object.keys(o))
// If 'keys' is a string, pick that single string
export function pick(obj, keys) {
  const res = {};
  if (keys === undefined || keys === null) {
    return res;
  }

  const pickKey = key => {
    if (key in obj) {
      res[key] = obj[key];
    }
  };

  if (Array.isArray(keys)) {
    keys.forEach(pickKey);
  } else if (typeof keys === 'object') {
    Object.keys(keys).forEach(pickKey);
  } else if (typeof keys === 'string') {
    pickKey(keys);
  }

  return res;
}

// Given an object and keys, creates a new object with those keys omitted
// from the original object.
// This has the same functionality as the lodash 'omit' function (except
// that we only allow top-level keys to be picked, and not object paths).
// If 'keys' is an object, this is equivalent to omit(obj, Object.keys(o))
// If 'keys' is a string, omit that single string
export function omit(obj, keys) {
  if (keys === undefined || keys === null) {
    return obj;
  }

  let rawKeys = [];
  if (Array.isArray(keys)) {
    rawKeys = keys;
  } else if (typeof keys === 'object') {
    rawKeys = Object.keys(keys);
  } else if (typeof keys === 'string') {
    rawKeys.push(keys);
  }

  const keysToOmit = new Set(rawKeys);
  const res = {};
  Object.keys(obj).forEach(key => {
    if (!keysToOmit.has(key)) {
      res[key] = obj[key];
    }
  });
  return res;
}

/** Checks if two arrays are equal, uses a hashFunc to transform an array item
 * into a value comparable with ===
 *  E.g.:
 *  arrayEquality([1, 3, 2], [1, 2, 3], (i) => i, true) -> returns false,
 *     because order matters, so the arrays are not equal.
 *  arrayEquality(
 *    [{key: 'a', content: 'aaa'}, {key: 'b', content: 'bbb'}],
 *    [{key: 'b', content: 'bbbbbb'}, {key: 'a', content: 'aaaaa'}],
 *    (obj) => obj.key
 *  ) -> returns true
 *    Order doesn't matter, and our hash function makes items comparable only
 *    by their 'key', so in this case the arrays are equal.
 */
export function arrayEquality(
  arr1,
  arr2,
  hashFunc = x => x,
  orderMatters = false,
) {
  if (arr1.length !== arr2.length) {
    return false;
  }
  if (arr1.length === 0) {
    return true;
  }

  if (orderMatters) {
    for (let i = 0; i < arr1.length; i++) {
      if (hashFunc(arr1[i]) !== hashFunc(arr2[i])) {
        return false;
      }
    }
    return true;
  }

  // if order doesn't matter
  const hashes = {};
  arr1.forEach(elt => {
    hashes[hashFunc(elt)] = true;
  });
  for (let i = 0; i < arr2.length; i++) {
    if (!(hashFunc(arr2[i]) in hashes)) {
      return false;
    }
  }
  return true;
}

/**
 * Similar to the python range function, create an array between two integers
 * [start, end). (includes start, excludes end)
 * If only a single argument is passed, this argument is used as the end, and
 * start is 0.
 * Example:
 *   range(5): [0, 1, 2, 3, 4]
 *   range(1, 6): [1, 2, 3, 4, 5]
 */
export function range(start, end) {
  if (start < 0 || end < 0 || end < start) {
    throw new Error('[util] Invalid start and end range');
  }

  const newStart = !end ? 0 : start;
  const newEnd = !end ? start : end;
  const numbers = [];
  for (let i = newStart; i < newEnd; i++) {
    numbers.push(i);
  }
  return numbers;
}

// Functions to add and subtract lists as vectors, element by element.
export function addArrays(ar1, ar2) {
  if (ar1.length !== ar2.length) {
    throw new Error('[util] Arrays must be of equal length');
  }
  return ar1.map((a, i) => a + ar2[i]);
}

export function subArrays(ar1, ar2) {
  if (ar1.length !== ar2.length) {
    throw new Error('[util] Arrays must be of equal length');
  }
  return ar1.map((a, i) => a - ar2[i]);
}

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
export function debounce(func, wait, immediate) {
  let timeout;
  return function debounced(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
}

// Generate a UUID4 unique identifier.
export function uuid() {
  // Build a 128-bit random number to use as the UUID.
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);

  // Unpack the random numbers and store as hex strings.
  const pieces = arr.reduce((acc, v, i) => {
    // Unpack an 8-bit number into two 4-bit pieces to convert to hex.
    let top = v >> 4; // eslint-disable-line no-bitwise
    const bottom = v & 0xf; // eslint-disable-line no-bitwise

    // Set the version number. This will set the value at position 13 of the
    // UUID.
    if (i === 6) {
      top = 0x4;
    } else if (i === 8) {
      // Set the variant bits at position 17 of the UUID.
      top = (top & 0x3) | 0x8; // eslint-disable-line no-bitwise
    }

    // Add the UUID's hyphens in the appropriate cadence.
    if (i === 4 || i === 6 || i === 8 || i === 10) {
      acc.push('-');
    }

    acc.push(top.toString(16));
    acc.push(bottom.toString(16));
    return acc;
  }, []);

  return pieces.join('');
}

/**
 * Returns a function that composes the passed functions
 * It is equivalent to:  compose(f, g)(x) = f(g(x))
 *
 * This is useful in React state transitions to easily compose multiple
 * state functions together:
 *   this.setState(compose(
 *     addNewRow(rowToAdd),
 *     removeRow(rowToRemove)
 *   ));
 * @param {Array<Function>} fns - functions to pass in as individual arguments
 * @return {Function} Single function that composes the passed functions
 */
export function compose(...fns) {
  return fns.reduce((f, g) => (...args) => f(g(...args)));
}

/**
 * Prevent the event from bubbling up and ignore the default action for the
 * event.
 */
export function blockEvent(event) {
  event.preventDefault();
  event.stopPropagation();

  // In case the event handler is used by jQuery.
  return false;
}

/**
 * Get the difference between two sets
 */
export function difference(setA, setB) {
  const output = new Set();
  setA.forEach(v => output.add(v));
  setB.forEach(v => output.delete(v));
  return output;
}

/**
 * Common setup for a HOC (Higher Order Component).
 * This function involves several side effects to set up the `EnhancedComponent`
 * static members according to correct HOC conventions.
 *
 * 1. Set a name prefix for the Enhanced Component's display name
 *   e.g. 'withWindowResizeSubscription'
 *   That way in the console, the component's display name will show up as:
 *   'withWindowResizeSubscription(wrappedComponentName)'
 * 2. Hoist the statics from the WrappedComponent to the EnhancedComponent
 */
export function hocSetup(namePrefix, EnhancedComponent, WrappedComponent) {
  const wrappedComponentName =
    WrappedComponent.displayName || WrappedComponent.name || 'Component';
  // eslint-disable-next-line no-param-reassign
  EnhancedComponent.displayName = `${namePrefix}(${wrappedComponentName})`;
  hoistNonReactStatic(EnhancedComponent, WrappedComponent);
}

function unloadHandler(event) {
  // eslint-disable-next-line no-param-reassign
  event.returnValue =
    'Are you sure you want to leave this page? Your changes will not be saved.';
}

export function registerUnloadHandler() {
  if (!window.__JSON_FROM_BACKEND.IS_TEST) {
    window.addEventListener('beforeunload', unloadHandler);
  }
}

export function removeUnloadHandler() {
  window.removeEventListener('beforeunload', unloadHandler);
}

export function getQueryParam(queryParam) {
  const params = new URLSearchParams(window.location.search);
  const param = params.get(queryParam);
  return param;
}
