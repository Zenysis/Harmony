// All polyfills and stdlib extensions are hosted here. Most code is straight
// from MDN with attribution.

// ****************************************************************************
// ****************************************************************************
// ****************************************************************************
// DO NOT use es6 keywords or fat arrows - this script is included directly!
// ****************************************************************************
// ****************************************************************************
// ****************************************************************************

/* eslint-disable no-extend-native */
(function polyfill() {
  if (typeof Object.assign !== 'function') {
    // Object.prototype.assign() polyfill from:
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign#Polyfill
    Object.assign = function assign(target, varArgs) {
      // eslint-disable-line no-unused-vars
      'use strict';
      if (target === null) {
        // TypeError if undefined or null
        throw new TypeError('Cannot convert undefined or null to object');
      }

      var to = Object(target);

      for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index];

        if (nextSource !== null) {
          // Skip over if undefined or null
          for (var nextKey in nextSource) {
            // Avoid bugs when hasOwnProperty is shadowed
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    };
  }

  // Array.prototype.fill() polyfill from:
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/fill#Polyfill
  if (!Array.prototype.fill) {
    Object.defineProperty(Array.prototype, 'fill', {
      value: function fill(value) {
        // Steps 1-2.
        if (this === null) {
          throw new TypeError('this is null or not defined');
        }

        var O = Object(this);

        // Steps 3-5.
        var len = O.length >>> 0;

        // Steps 6-7.
        var start = arguments[1];
        var relativeStart = start >> 0;

        // Step 8.
        var k =
          relativeStart < 0
            ? Math.max(len + relativeStart, 0)
            : Math.min(relativeStart, len);

        // Steps 9-10.
        var end = arguments[2];
        var relativeEnd = end === undefined ? len : end >> 0;

        // Step 11.
        var final =
          relativeEnd < 0
            ? Math.max(len + relativeEnd, 0)
            : Math.min(relativeEnd, len);

        // Step 12.
        while (k < final) {
          O[k] = value;
          k++;
        }

        // Step 13.
        return O;
      },
    });
  }

  // Array.prototype.find() polyfill from:
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find#Polyfill
  // https://tc39.github.io/ecma262/#sec-array.prototype.find
  if (!Array.prototype.find) {
    Object.defineProperty(Array.prototype, 'find', {
      value: function find(predicate) {
        // 1. var O be ? ToObject(this value).
        if (this === null) {
          throw new TypeError('"this" is null or not defined');
        }

        var o = Object(this);

        // 2. var len be ? ToLength(? Get(O, "length")).
        var len = o.length >>> 0;

        // 3. If IsCallable(predicate) is false, throw a TypeError exception.
        if (typeof predicate !== 'function') {
          throw new TypeError('predicate must be a function');
        }

        // 4. If thisArg was supplied, var T be thisArg; else var T be undefined.
        var thisArg = arguments[1];

        // 5. var k be 0.
        var k = 0;

        // 6. Repeat, while k < len
        while (k < len) {
          // a. var Pk be ! ToString(k).
          // b. var kValue be ? Get(O, Pk).
          // c. var testResult be ToBoolean(? Call(predicate, T, kValue, k, O)).
          // d. If testResult is true, return kValue.
          var kValue = o[k];
          if (predicate.call(thisArg, kValue, k, o)) {
            return kValue;
          }
          // e. Increase k by 1.
          k++;
        }

        // 7. Return undefined.
        return undefined;
      },
    });
  }

  // Array.prototype.findIndex() polyfill from:
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex#Polyfill
  // https://tc39.github.io/ecma262/#sec-array.prototype.findIndex
  if (!Array.prototype.findIndex) {
    Object.defineProperty(Array.prototype, 'findIndex', {
      value: function findIndex(predicate) {
        // 1. var O be ? ToObject(this value).
        if (this === null) {
          throw new TypeError('"this" is null or not defined');
        }

        var o = Object(this);

        // 2. var len be ? ToLength(? Get(O, "length")).
        var len = o.length >>> 0;

        // 3. If IsCallable(predicate) is false, throw a TypeError exception.
        if (typeof predicate !== 'function') {
          throw new TypeError('predicate must be a function');
        }

        // 4. If thisArg was supplied, var T be thisArg; else var T be undefined.
        var thisArg = arguments[1];

        // 5. var k be 0.
        var k = 0;

        // 6. Repeat, while k < len
        while (k < len) {
          // a. var Pk be ! ToString(k).
          // b. var kValue be ? Get(O, Pk).
          // c. var testResult be ToBoolean(? Call(predicate, T, kValue, k, O)).
          // d. If testResult is true, return k.
          var kValue = o[k];
          if (predicate.call(thisArg, kValue, k, o)) {
            return k;
          }
          // e. Increase k by 1.
          k++;
        }

        // 7. Return -1.
        return -1;
      },
    });
  }

  // Basic set operations from:
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set#Implementing_basic_set_operations
  // NOTE(stephen): The reference implementation has been modified to use
  // Set.forEach instead of `for .. of` in case the Set object itself was
  // polyfilled into an older browser.
  // NOTE(stephen): The reference implementation was also modified to not
  // use the new Set([iterable]) constructor, since that is not supported
  // on IE. This may come with a performance cost, so it might be worth it
  // to support two versions of the polyfill.
  // NOTE(stephen): We actually accept any array-like object that has a
  // forEach method for looping over values.
  if (!Set.prototype.union) {
    Set.prototype.union = function union(arrayLikeObject) {
      var output = new Set();
      this.forEach(function(v) {
        output.add(v);
      });
      arrayLikeObject.forEach(function(v) {
        output.add(v);
      });
      return output;
    };
  }

  if (!Set.prototype.intersection) {
    Set.prototype.intersection = function intersection(arrayLikeObject) {
      var output = new Set();
      arrayLikeObject.forEach(function(v) {
        if (this.has(v)) {
          output.add(v);
        }
      });
      return output;
    };
  }

  if (!Set.prototype.difference) {
    Set.prototype.difference = function difference(arrayLikeObject) {
      var output = new Set();
      this.forEach(function(v) {
        output.add(v);
      });
      arrayLikeObject.forEach(function(v) {
        output.delete(v);
      });
      return output;
    };
  }

  // Production steps of ECMA-262, Edition 6, 22.1.2.1
  if (!Array.from) {
    Array.from = (function() {
      var toStr = Object.prototype.toString;
      var isCallable = function(fn) {
        return (
          typeof fn === 'function' || toStr.call(fn) === '[object Function]'
        );
      };
      var toInteger = function(value) {
        var number = Number(value);
        if (isNaN(number)) {
          return 0;
        }
        if (number === 0 || !isFinite(number)) {
          return number;
        }
        return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
      };
      var maxSafeInteger = Math.pow(2, 53) - 1;
      var toLength = function(value) {
        var len = toInteger(value);
        return Math.min(Math.max(len, 0), maxSafeInteger);
      };

      // The length property of the from method is 1.
      return function from(arrayLike /*, mapFn, thisArg */) {
        // 1. var C be the this value.
        var C = this;

        // 2. var items be ToObject(arrayLike).
        var items = Object(arrayLike);

        // 3. ReturnIfAbrupt(items).
        if (arrayLike == null) {
          throw new TypeError(
            'Array.from requires an array-like object - not null or undefined',
          );
        }

        // 4. If mapfn is undefined, then var mapping be false.
        var mapFn = arguments.length > 1 ? arguments[1] : void undefined;
        var T;
        if (typeof mapFn !== 'undefined') {
          // 5. else
          // 5. a If IsCallable(mapfn) is false, throw a TypeError exception.
          if (!isCallable(mapFn)) {
            throw new TypeError(
              'Array.from: when provided, the second argument must be a function',
            );
          }

          // 5. b. If thisArg was supplied, var T be thisArg; else var T be undefined.
          if (arguments.length > 2) {
            T = arguments[2];
          }
        }

        // 10. var lenValue be Get(items, "length").
        // 11. var len be ToLength(lenValue).
        var len = toLength(items.length);

        // 13. If IsConstructor(C) is true, then
        // 13. a. var A be the result of calling the [[Construct]] internal method
        // of C with an argument list containing the single item len.
        // 14. a. Else, var A be ArrayCreate(len).
        var A = isCallable(C) ? Object(new C(len)) : new Array(len);

        // 16. var k be 0.
        var k = 0;
        // 17. Repeat, while k < len… (also steps a - h)
        var kValue;
        while (k < len) {
          kValue = items[k];
          if (mapFn) {
            A[k] =
              typeof T === 'undefined'
                ? mapFn(kValue, k)
                : mapFn.call(T, kValue, k);
          } else {
            A[k] = kValue;
          }
          k += 1;
        }
        // 18. var putStatus be Put(A, "length", len, true).
        A.length = len;
        // 20. Return A.
        return A;
      };
    })();
  }

  // Number library polyfills for IE
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/
  Number.isFinite =
    Number.isFinite ||
    function(value) {
      return typeof value === 'number' && isFinite(value);
    };

  Number.isInteger =
    Number.isInteger ||
    function(value) {
      return (
        typeof value === 'number' &&
        isFinite(value) &&
        Math.floor(value) === value
      );
    };

  Number.isNaN =
    Number.isNaN ||
    function(value) {
      return value !== value;
    };

  // Object.values and Object.entries polyfills from tc39 proposal
  // (with modifications)
  // https://github.com/tc39/proposal-object-values-entries/blob/master/polyfill.js
  if (!Object.values || !Object.entries) {
    // The tc39 polyfill uses Reflect.ownKeys which is **never** supported by
    // IE. Add a separate polyfill for that here.
    var ownKeys = Object.getOwnPropertyNames; // IE version
    if (Reflect.ownKeys) {
      // Modern version
      ownKeys = Reflect.ownKeys;
    } else if (Object.getOwnPropertySymbols) {
      // Best choice if no Reflect
      ownKeys = function ownKeys(o) {
        return Object.getOwnPropertyNames(o).concat(
          Object.getOwnPropertySymbols(o),
        );
      };
    }

    if (!Object.values) {
      Object.values = function values(o) {
        // Modified original implementation to avoid creating an extra function
        // on each invocation.
        var output = [];
        var keys = ownKeys(o);
        for (var i = 0; i < keys.length; i++) {
          if (o.propertyIsEnumerable(keys[i])) {
            output.push(o[keys[i]]);
          }
        }
        return output;
      };
    }

    if (!Object.entries) {
      Object.entries = function entries(o) {
        // Modified original implementation to avoid creating an extra function
        // on each invocation.
        var output = [];
        var keys = ownKeys(o);
        for (var i = 0; i < keys.length; i++) {
          if (o.propertyIsEnumerable(keys[i])) {
            output.push([keys[i], o[keys[i]]]);
          }
        }
        return output;
      };
    }
  }
})();
