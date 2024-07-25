// NOTE: Add createReactClass shim directly.
(function webpackUniversalModuleDefinition(root, factory) {
  if(typeof exports === 'object' && typeof module === 'object')
    module.exports = factory(require("react"));
  else if(typeof define === 'function' && define.amd)
    define(["react"], factory);
  else if(typeof exports === 'object')
    exports["createReactClass"] = factory(require("react"));
  else
    root["createReactClass"] = factory(root["React"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_1__) {
return /******/ (function(modules) { // webpackBootstrap
/******/  // The module cache
/******/  var installedModules = {};
/******/
/******/  // The require function
/******/  function __webpack_require__(moduleId) {
/******/
/******/    // Check if module is in cache
/******/    if(installedModules[moduleId]) {
/******/      return installedModules[moduleId].exports;
/******/    }
/******/    // Create a new module (and put it into the cache)
/******/    var module = installedModules[moduleId] = {
/******/      i: moduleId,
/******/      l: false,
/******/      exports: {}
/******/    };
/******/
/******/    // Execute the module function
/******/    modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/    // Flag the module as loaded
/******/    module.l = true;
/******/
/******/    // Return the exports of the module
/******/    return module.exports;
/******/  }
/******/
/******/
/******/  // expose the modules object (__webpack_modules__)
/******/  __webpack_require__.m = modules;
/******/
/******/  // expose the module cache
/******/  __webpack_require__.c = installedModules;
/******/
/******/  // identity function for calling harmony imports with the correct context
/******/  __webpack_require__.i = function(value) { return value; };
/******/
/******/  // define getter function for harmony exports
/******/  __webpack_require__.d = function(exports, name, getter) {
/******/    if(!__webpack_require__.o(exports, name)) {
/******/      Object.defineProperty(exports, name, {
/******/        configurable: false,
/******/        enumerable: true,
/******/        get: getter
/******/      });
/******/    }
/******/  };
/******/
/******/  // getDefaultExport function for compatibility with non-harmony modules
/******/  __webpack_require__.n = function(module) {
/******/    var getter = module && module.__esModule ?
/******/      function getDefault() { return module['default']; } :
/******/      function getModuleExports() { return module; };
/******/    __webpack_require__.d(getter, 'a', getter);
/******/    return getter;
/******/  };
/******/
/******/  // Object.prototype.hasOwnProperty.call
/******/  __webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/  // __webpack_public_path__
/******/  __webpack_require__.p = "";
/******/
/******/  // Load entry module and return exports
/******/  return __webpack_require__(__webpack_require__.s = 2);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */



var _assign = __webpack_require__(7);

var emptyObject = __webpack_require__(4);
var _invariant = __webpack_require__(5);

if (true) {
  var warning = __webpack_require__(6);
}

var MIXINS_KEY = 'mixins';

// Helper function to allow the creation of anonymous functions which do not
// have .name set to the name of the variable being assigned to.
function identity(fn) {
  return fn;
}

var ReactPropTypeLocationNames;
if (true) {
  ReactPropTypeLocationNames = {
    prop: 'prop',
    context: 'context',
    childContext: 'child context'
  };
} else {
  ReactPropTypeLocationNames = {};
}

function factory(ReactComponent, isValidElement, ReactNoopUpdateQueue) {
  /**
   * Policies that describe methods in `ReactClassInterface`.
   */

  var injectedMixins = [];

  /**
   * Composite components are higher-level components that compose other composite
   * or host components.
   *
   * To create a new type of `ReactClass`, pass a specification of
   * your new class to `React.createClass`. The only requirement of your class
   * specification is that you implement a `render` method.
   *
   *   var MyComponent = React.createClass({
   *     render: function() {
   *       return <div>Hello World</div>;
   *     }
   *   });
   *
   * The class specification supports a specific protocol of methods that have
   * special meaning (e.g. `render`). See `ReactClassInterface` for
   * more the comprehensive protocol. Any other properties and methods in the
   * class specification will be available on the prototype.
   *
   * @interface ReactClassInterface
   * @internal
   */
  var ReactClassInterface = {
    /**
     * An array of Mixin objects to include when defining your component.
     *
     * @type {array}
     * @optional
     */
    mixins: 'DEFINE_MANY',

    /**
     * An object containing properties and methods that should be defined on
     * the component's constructor instead of its prototype (static methods).
     *
     * @type {object}
     * @optional
     */
    statics: 'DEFINE_MANY',

    /**
     * Definition of prop types for this component.
     *
     * @type {object}
     * @optional
     */
    propTypes: 'DEFINE_MANY',

    /**
     * Definition of context types for this component.
     *
     * @type {object}
     * @optional
     */
    contextTypes: 'DEFINE_MANY',

    /**
     * Definition of context types this component sets for its children.
     *
     * @type {object}
     * @optional
     */
    childContextTypes: 'DEFINE_MANY',

    // ==== Definition methods ====

    /**
     * Invoked when the component is mounted. Values in the mapping will be set on
     * `this.props` if that prop is not specified (i.e. using an `in` check).
     *
     * This method is invoked before `getInitialState` and therefore cannot rely
     * on `this.state` or use `this.setState`.
     *
     * @return {object}
     * @optional
     */
    getDefaultProps: 'DEFINE_MANY_MERGED',

    /**
     * Invoked once before the component is mounted. The return value will be used
     * as the initial value of `this.state`.
     *
     *   getInitialState: function() {
     *     return {
     *       isOn: false,
     *       fooBaz: new BazFoo()
     *     }
     *   }
     *
     * @return {object}
     * @optional
     */
    getInitialState: 'DEFINE_MANY_MERGED',

    /**
     * @return {object}
     * @optional
     */
    getChildContext: 'DEFINE_MANY_MERGED',

    /**
     * Uses props from `this.props` and state from `this.state` to render the
     * structure of the component.
     *
     * No guarantees are made about when or how often this method is invoked, so
     * it must not have side effects.
     *
     *   render: function() {
     *     var name = this.props.name;
     *     return <div>Hello, {name}!</div>;
     *   }
     *
     * @return {ReactComponent}
     * @required
     */
    render: 'DEFINE_ONCE',

    // ==== Delegate methods ====

    /**
     * Invoked when the component is initially created and about to be mounted.
     * This may have side effects, but any external subscriptions or data created
     * by this method must be cleaned up in `componentWillUnmount`.
     *
     * @optional
     */
    componentWillMount: 'DEFINE_MANY',

    /**
     * Invoked when the component has been mounted and has a DOM representation.
     * However, there is no guarantee that the DOM node is in the document.
     *
     * Use this as an opportunity to operate on the DOM when the component has
     * been mounted (initialized and rendered) for the first time.
     *
     * @param {DOMElement} rootNode DOM element representing the component.
     * @optional
     */
    componentDidMount: 'DEFINE_MANY',

    /**
     * Invoked before the component receives new props.
     *
     * Use this as an opportunity to react to a prop transition by updating the
     * state using `this.setState`. Current props are accessed via `this.props`.
     *
     *   componentWillReceiveProps: function(nextProps, nextContext) {
     *     this.setState({
     *       likesIncreasing: nextProps.likeCount > this.props.likeCount
     *     });
     *   }
     *
     * NOTE: There is no equivalent `componentWillReceiveState`. An incoming prop
     * transition may cause a state change, but the opposite is not true. If you
     * need it, you are probably looking for `componentWillUpdate`.
     *
     * @param {object} nextProps
     * @optional
     */
    componentWillReceiveProps: 'DEFINE_MANY',

    /**
     * Invoked while deciding if the component should be updated as a result of
     * receiving new props, state and/or context.
     *
     * Use this as an opportunity to `return false` when you're certain that the
     * transition to the new props/state/context will not require a component
     * update.
     *
     *   shouldComponentUpdate: function(nextProps, nextState, nextContext) {
     *     return !equal(nextProps, this.props) ||
     *       !equal(nextState, this.state) ||
     *       !equal(nextContext, this.context);
     *   }
     *
     * @param {object} nextProps
     * @param {?object} nextState
     * @param {?object} nextContext
     * @return {boolean} True if the component should update.
     * @optional
     */
    shouldComponentUpdate: 'DEFINE_ONCE',

    /**
     * Invoked when the component is about to update due to a transition from
     * `this.props`, `this.state` and `this.context` to `nextProps`, `nextState`
     * and `nextContext`.
     *
     * Use this as an opportunity to perform preparation before an update occurs.
     *
     * NOTE: You **cannot** use `this.setState()` in this method.
     *
     * @param {object} nextProps
     * @param {?object} nextState
     * @param {?object} nextContext
     * @param {ReactReconcileTransaction} transaction
     * @optional
     */
    componentWillUpdate: 'DEFINE_MANY',

    /**
     * Invoked when the component's DOM representation has been updated.
     *
     * Use this as an opportunity to operate on the DOM when the component has
     * been updated.
     *
     * @param {object} prevProps
     * @param {?object} prevState
     * @param {?object} prevContext
     * @param {DOMElement} rootNode DOM element representing the component.
     * @optional
     */
    componentDidUpdate: 'DEFINE_MANY',

    /**
     * Invoked when the component is about to be removed from its parent and have
     * its DOM representation destroyed.
     *
     * Use this as an opportunity to deallocate any external resources.
     *
     * NOTE: There is no `componentDidUnmount` since your component will have been
     * destroyed by that point.
     *
     * @optional
     */
    componentWillUnmount: 'DEFINE_MANY',

    // ==== Advanced methods ====

    /**
     * Updates the component's currently mounted DOM representation.
     *
     * By default, this implements React's rendering and reconciliation algorithm.
     * Sophisticated clients may wish to override this.
     *
     * @param {ReactReconcileTransaction} transaction
     * @internal
     * @overridable
     */
    updateComponent: 'OVERRIDE_BASE'
  };

  /**
   * Mapping from class specification keys to special processing functions.
   *
   * Although these are declared like instance properties in the specification
   * when defining classes using `React.createClass`, they are actually static
   * and are accessible on the constructor instead of the prototype. Despite
   * being static, they must be defined outside of the "statics" key under
   * which all other static methods are defined.
   */
  var RESERVED_SPEC_KEYS = {
    displayName: function(Constructor, displayName) {
      Constructor.displayName = displayName;
    },
    mixins: function(Constructor, mixins) {
      if (mixins) {
        for (var i = 0; i < mixins.length; i++) {
          mixSpecIntoComponent(Constructor, mixins[i]);
        }
      }
    },
    childContextTypes: function(Constructor, childContextTypes) {
      if (true) {
        validateTypeDef(Constructor, childContextTypes, 'childContext');
      }
      Constructor.childContextTypes = _assign(
        {},
        Constructor.childContextTypes,
        childContextTypes
      );
    },
    contextTypes: function(Constructor, contextTypes) {
      if (true) {
        validateTypeDef(Constructor, contextTypes, 'context');
      }
      Constructor.contextTypes = _assign(
        {},
        Constructor.contextTypes,
        contextTypes
      );
    },
    /**
     * Special case getDefaultProps which should move into statics but requires
     * automatic merging.
     */
    getDefaultProps: function(Constructor, getDefaultProps) {
      if (Constructor.getDefaultProps) {
        Constructor.getDefaultProps = createMergedResultFunction(
          Constructor.getDefaultProps,
          getDefaultProps
        );
      } else {
        Constructor.getDefaultProps = getDefaultProps;
      }
    },
    propTypes: function(Constructor, propTypes) {
      if (true) {
        validateTypeDef(Constructor, propTypes, 'prop');
      }
      Constructor.propTypes = _assign({}, Constructor.propTypes, propTypes);
    },
    statics: function(Constructor, statics) {
      mixStaticSpecIntoComponent(Constructor, statics);
    },
    autobind: function() {}
  };

  function validateTypeDef(Constructor, typeDef, location) {
    for (var propName in typeDef) {
      if (typeDef.hasOwnProperty(propName)) {
        // use a warning instead of an _invariant so components
        // don't show up in prod but only in __DEV__
        if (true) {
          warning(
            typeof typeDef[propName] === 'function',
            '%s: %s type `%s` is invalid; it must be a function, usually from ' +
              'React.PropTypes.',
            Constructor.displayName || 'ReactClass',
            ReactPropTypeLocationNames[location],
            propName
          );
        }
      }
    }
  }

  function validateMethodOverride(isAlreadyDefined, name) {
    var specPolicy = ReactClassInterface.hasOwnProperty(name)
      ? ReactClassInterface[name]
      : null;

    // Disallow overriding of base class methods unless explicitly allowed.
    if (ReactClassMixin.hasOwnProperty(name)) {
      _invariant(
        specPolicy === 'OVERRIDE_BASE',
        'ReactClassInterface: You are attempting to override ' +
          '`%s` from your class specification. Ensure that your method names ' +
          'do not overlap with React methods.',
        name
      );
    }

    // Disallow defining methods more than once unless explicitly allowed.
    if (isAlreadyDefined) {
      _invariant(
        specPolicy === 'DEFINE_MANY' || specPolicy === 'DEFINE_MANY_MERGED',
        'ReactClassInterface: You are attempting to define ' +
          '`%s` on your component more than once. This conflict may be due ' +
          'to a mixin.',
        name
      );
    }
  }

  /**
   * Mixin helper which handles policy validation and reserved
   * specification keys when building React classes.
   */
  function mixSpecIntoComponent(Constructor, spec) {
    if (!spec) {
      if (true) {
        var typeofSpec = typeof spec;
        var isMixinValid = typeofSpec === 'object' && spec !== null;

        if (true) {
          warning(
            isMixinValid,
            "%s: You're attempting to include a mixin that is either null " +
              'or not an object. Check the mixins included by the component, ' +
              'as well as any mixins they include themselves. ' +
              'Expected object but got %s.',
            Constructor.displayName || 'ReactClass',
            spec === null ? null : typeofSpec
          );
        }
      }

      return;
    }

    _invariant(
      typeof spec !== 'function',
      "ReactClass: You're attempting to " +
        'use a component class or function as a mixin. Instead, just use a ' +
        'regular object.'
    );
    _invariant(
      !isValidElement(spec),
      "ReactClass: You're attempting to " +
        'use a component as a mixin. Instead, just use a regular object.'
    );

    var proto = Constructor.prototype;
    var autoBindPairs = proto.__reactAutoBindPairs;

    // By handling mixins before any other properties, we ensure the same
    // chaining order is applied to methods with DEFINE_MANY policy, whether
    // mixins are listed before or after these methods in the spec.
    if (spec.hasOwnProperty(MIXINS_KEY)) {
      RESERVED_SPEC_KEYS.mixins(Constructor, spec.mixins);
    }

    for (var name in spec) {
      if (!spec.hasOwnProperty(name)) {
        continue;
      }

      if (name === MIXINS_KEY) {
        // We have already handled mixins in a special case above.
        continue;
      }

      var property = spec[name];
      var isAlreadyDefined = proto.hasOwnProperty(name);
      validateMethodOverride(isAlreadyDefined, name);

      if (RESERVED_SPEC_KEYS.hasOwnProperty(name)) {
        RESERVED_SPEC_KEYS[name](Constructor, property);
      } else {
        // Setup methods on prototype:
        // The following member methods should not be automatically bound:
        // 1. Expected ReactClass methods (in the "interface").
        // 2. Overridden methods (that were mixed in).
        var isReactClassMethod = ReactClassInterface.hasOwnProperty(name);
        var isFunction = typeof property === 'function';
        var shouldAutoBind =
          isFunction &&
          !isReactClassMethod &&
          !isAlreadyDefined &&
          spec.autobind !== false;

        if (shouldAutoBind) {
          autoBindPairs.push(name, property);
          proto[name] = property;
        } else {
          if (isAlreadyDefined) {
            var specPolicy = ReactClassInterface[name];

            // These cases should already be caught by validateMethodOverride.
            _invariant(
              isReactClassMethod &&
                (specPolicy === 'DEFINE_MANY_MERGED' ||
                  specPolicy === 'DEFINE_MANY'),
              'ReactClass: Unexpected spec policy %s for key %s ' +
                'when mixing in component specs.',
              specPolicy,
              name
            );

            // For methods which are defined more than once, call the existing
            // methods before calling the new property, merging if appropriate.
            if (specPolicy === 'DEFINE_MANY_MERGED') {
              proto[name] = createMergedResultFunction(proto[name], property);
            } else if (specPolicy === 'DEFINE_MANY') {
              proto[name] = createChainedFunction(proto[name], property);
            }
          } else {
            proto[name] = property;
            if (true) {
              // Add verbose displayName to the function, which helps when looking
              // at profiling tools.
              if (typeof property === 'function' && spec.displayName) {
                proto[name].displayName = spec.displayName + '_' + name;
              }
            }
          }
        }
      }
    }
  }

  function mixStaticSpecIntoComponent(Constructor, statics) {
    if (!statics) {
      return;
    }
    for (var name in statics) {
      var property = statics[name];
      if (!statics.hasOwnProperty(name)) {
        continue;
      }

      var isReserved = name in RESERVED_SPEC_KEYS;
      _invariant(
        !isReserved,
        'ReactClass: You are attempting to define a reserved ' +
          'property, `%s`, that shouldn\'t be on the "statics" key. Define it ' +
          'as an instance property instead; it will still be accessible on the ' +
          'constructor.',
        name
      );

      var isInherited = name in Constructor;
      _invariant(
        !isInherited,
        'ReactClass: You are attempting to define ' +
          '`%s` on your component more than once. This conflict may be ' +
          'due to a mixin.',
        name
      );
      Constructor[name] = property;
    }
  }

  /**
   * Merge two objects, but throw if both contain the same key.
   *
   * @param {object} one The first object, which is mutated.
   * @param {object} two The second object
   * @return {object} one after it has been mutated to contain everything in two.
   */
  function mergeIntoWithNoDuplicateKeys(one, two) {
    _invariant(
      one && two && typeof one === 'object' && typeof two === 'object',
      'mergeIntoWithNoDuplicateKeys(): Cannot merge non-objects.'
    );

    for (var key in two) {
      if (two.hasOwnProperty(key)) {
        _invariant(
          one[key] === undefined,
          'mergeIntoWithNoDuplicateKeys(): ' +
            'Tried to merge two objects with the same key: `%s`. This conflict ' +
            'may be due to a mixin; in particular, this may be caused by two ' +
            'getInitialState() or getDefaultProps() methods returning objects ' +
            'with clashing keys.',
          key
        );
        one[key] = two[key];
      }
    }
    return one;
  }

  /**
   * Creates a function that invokes two functions and merges their return values.
   *
   * @param {function} one Function to invoke first.
   * @param {function} two Function to invoke second.
   * @return {function} Function that invokes the two argument functions.
   * @private
   */
  function createMergedResultFunction(one, two) {
    return function mergedResult() {
      var a = one.apply(this, arguments);
      var b = two.apply(this, arguments);
      if (a == null) {
        return b;
      } else if (b == null) {
        return a;
      }
      var c = {};
      mergeIntoWithNoDuplicateKeys(c, a);
      mergeIntoWithNoDuplicateKeys(c, b);
      return c;
    };
  }

  /**
   * Creates a function that invokes two functions and ignores their return vales.
   *
   * @param {function} one Function to invoke first.
   * @param {function} two Function to invoke second.
   * @return {function} Function that invokes the two argument functions.
   * @private
   */
  function createChainedFunction(one, two) {
    return function chainedFunction() {
      one.apply(this, arguments);
      two.apply(this, arguments);
    };
  }

  /**
   * Binds a method to the component.
   *
   * @param {object} component Component whose method is going to be bound.
   * @param {function} method Method to be bound.
   * @return {function} The bound method.
   */
  function bindAutoBindMethod(component, method) {
    var boundMethod = method.bind(component);
    if (true) {
      boundMethod.__reactBoundContext = component;
      boundMethod.__reactBoundMethod = method;
      boundMethod.__reactBoundArguments = null;
      var componentName = component.constructor.displayName;
      var _bind = boundMethod.bind;
      boundMethod.bind = function(newThis) {
        for (
          var _len = arguments.length,
            args = Array(_len > 1 ? _len - 1 : 0),
            _key = 1;
          _key < _len;
          _key++
        ) {
          args[_key - 1] = arguments[_key];
        }

        // User is trying to bind() an autobound method; we effectively will
        // ignore the value of "this" that the user is trying to use, so
        // let's warn.
        if (newThis !== component && newThis !== null) {
          if (true) {
            warning(
              false,
              'bind(): React component methods may only be bound to the ' +
                'component instance. See %s',
              componentName
            );
          }
        } else if (!args.length) {
          if (true) {
            warning(
              false,
              'bind(): You are binding a component method to the component. ' +
                'React does this for you automatically in a high-performance ' +
                'way, so you can safely remove this call. See %s',
              componentName
            );
          }
          return boundMethod;
        }
        var reboundMethod = _bind.apply(boundMethod, arguments);
        reboundMethod.__reactBoundContext = component;
        reboundMethod.__reactBoundMethod = method;
        reboundMethod.__reactBoundArguments = args;
        return reboundMethod;
      };
    }
    return boundMethod;
  }

  /**
   * Binds all auto-bound methods in a component.
   *
   * @param {object} component Component whose method is going to be bound.
   */
  function bindAutoBindMethods(component) {
    var pairs = component.__reactAutoBindPairs;
    for (var i = 0; i < pairs.length; i += 2) {
      var autoBindKey = pairs[i];
      var method = pairs[i + 1];
      component[autoBindKey] = bindAutoBindMethod(component, method);
    }
  }

  var IsMountedPreMixin = {
    componentDidMount: function() {
      this.__isMounted = true;
    }
  };

  var IsMountedPostMixin = {
    componentWillUnmount: function() {
      this.__isMounted = false;
    }
  };

  /**
   * Add more to the ReactClass base class. These are all legacy features and
   * therefore not already part of the modern ReactComponent.
   */
  var ReactClassMixin = {
    /**
     * TODO: This will be deprecated because state should always keep a consistent
     * type signature and the only use case for this, is to avoid that.
     */
    replaceState: function(newState, callback) {
      this.updater.enqueueReplaceState(this, newState, callback);
    },

    /**
     * Checks whether or not this composite component is mounted.
     * @return {boolean} True if mounted, false otherwise.
     * @protected
     * @final
     */
    isMounted: function() {
      if (true) {
        warning(
          this.__didWarnIsMounted,
          '%s: isMounted is deprecated. Instead, make sure to clean up ' +
            'subscriptions and pending requests in componentWillUnmount to ' +
            'prevent memory leaks.',
          (this.constructor && this.constructor.displayName) ||
            this.name ||
            'Component'
        );
        this.__didWarnIsMounted = true;
      }
      return !!this.__isMounted;
    }
  };

  var ReactClassComponent = function() {};
  _assign(
    ReactClassComponent.prototype,
    ReactComponent.prototype,
    ReactClassMixin
  );

  /**
   * Creates a composite component class given a class specification.
   * See https://facebook.github.io/react/docs/top-level-api.html#react.createclass
   *
   * @param {object} spec Class specification (which must define `render`).
   * @return {function} Component constructor function.
   * @public
   */
  function createClass(spec) {
    // To keep our warnings more understandable, we'll use a little hack here to
    // ensure that Constructor.name !== 'Constructor'. This makes sure we don't
    // unnecessarily identify a class without displayName as 'Constructor'.
    var Constructor = identity(function(props, context, updater) {
      // This constructor gets overridden by mocks. The argument is used
      // by mocks to assert on what gets mounted.

      if (true) {
        warning(
          this instanceof Constructor,
          'Something is calling a React component directly. Use a factory or ' +
            'JSX instead. See: https://fb.me/react-legacyfactory'
        );
      }

      // Wire up auto-binding
      if (this.__reactAutoBindPairs.length) {
        bindAutoBindMethods(this);
      }

      this.props = props;
      this.context = context;
      this.refs = emptyObject;
      this.updater = updater || ReactNoopUpdateQueue;

      this.state = null;

      // ReactClasses doesn't have constructors. Instead, they use the
      // getInitialState and componentWillMount methods for initialization.

      var initialState = this.getInitialState ? this.getInitialState() : null;
      if (true) {
        // We allow auto-mocks to proceed as if they're returning null.
        if (
          initialState === undefined &&
          this.getInitialState._isMockFunction
        ) {
          // This is probably bad practice. Consider warning here and
          // deprecating this convenience.
          initialState = null;
        }
      }
      _invariant(
        typeof initialState === 'object' && !Array.isArray(initialState),
        '%s.getInitialState(): must return an object or null',
        Constructor.displayName || 'ReactCompositeComponent'
      );

      this.state = initialState;
    });
    Constructor.prototype = new ReactClassComponent();
    Constructor.prototype.constructor = Constructor;
    Constructor.prototype.__reactAutoBindPairs = [];

    injectedMixins.forEach(mixSpecIntoComponent.bind(null, Constructor));

    mixSpecIntoComponent(Constructor, IsMountedPreMixin);
    mixSpecIntoComponent(Constructor, spec);
    mixSpecIntoComponent(Constructor, IsMountedPostMixin);

    // Initialize the defaultProps property after all mixins have been merged.
    if (Constructor.getDefaultProps) {
      Constructor.defaultProps = Constructor.getDefaultProps();
    }

    if (true) {
      // This is a tag to indicate that the use of these method names is ok,
      // since it's used with createClass. If it's not, then it's likely a
      // mistake so we'll warn you to use the static property, property
      // initializer or constructor respectively.
      if (Constructor.getDefaultProps) {
        Constructor.getDefaultProps.isReactClassApproved = {};
      }
      if (Constructor.prototype.getInitialState) {
        Constructor.prototype.getInitialState.isReactClassApproved = {};
      }
    }

    _invariant(
      Constructor.prototype.render,
      'createClass(...): Class specification must implement a `render` method.'
    );

    if (true) {
      warning(
        !Constructor.prototype.componentShouldUpdate,
        '%s has a method called ' +
          'componentShouldUpdate(). Did you mean shouldComponentUpdate()? ' +
          'The name is phrased as a question because the function is ' +
          'expected to return a value.',
        spec.displayName || 'A component'
      );
      warning(
        !Constructor.prototype.componentWillRecieveProps,
        '%s has a method called ' +
          'componentWillRecieveProps(). Did you mean componentWillReceiveProps()?',
        spec.displayName || 'A component'
      );
    }

    // Reduce time spent doing lookups by setting these on the prototype.
    for (var methodName in ReactClassInterface) {
      if (!Constructor.prototype[methodName]) {
        Constructor.prototype[methodName] = null;
      }
    }

    return Constructor;
  }

  return createClass;
}

module.exports = factory;


/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_1__;

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */



var React = __webpack_require__(1);
var factory = __webpack_require__(0);

if (typeof React === 'undefined') {
  throw Error(
    'create-react-class could not find the React object. If you are using script tags, ' +
      'make sure that React is being loaded before create-react-class.'
  );
}

// Hack to grab NoopUpdateQueue from isomorphic React
var ReactNoopUpdateQueue = new React.Component().updater;

module.exports = factory(
  React.Component,
  React.isValidElement,
  ReactNoopUpdateQueue
);


/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 *
 */

function makeEmptyFunction(arg) {
  return function () {
    return arg;
  };
}

/**
 * This function accepts and discards inputs; it has no side effects. This is
 * primarily useful idiomatically for overridable function endpoints which
 * always need to be callable, since JS lacks a null-call idiom ala Cocoa.
 */
var emptyFunction = function emptyFunction() {};

emptyFunction.thatReturns = makeEmptyFunction;
emptyFunction.thatReturnsFalse = makeEmptyFunction(false);
emptyFunction.thatReturnsTrue = makeEmptyFunction(true);
emptyFunction.thatReturnsNull = makeEmptyFunction(null);
emptyFunction.thatReturnsThis = function () {
  return this;
};
emptyFunction.thatReturnsArgument = function (arg) {
  return arg;
};

module.exports = emptyFunction;

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var emptyObject = {};

if (true) {
  Object.freeze(emptyObject);
}

module.exports = emptyObject;

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



/**
 * Use invariant() to assert state which your program assumes to be true.
 *
 * Provide sprintf-style format (only %s is supported) and arguments
 * to provide information about what broke and what you were
 * expecting.
 *
 * The invariant message will be stripped in production, but the invariant
 * will remain to ensure logic does not differ in production.
 */

var validateFormat = function validateFormat(format) {};

if (true) {
  validateFormat = function validateFormat(format) {
    if (format === undefined) {
      throw new Error('invariant requires an error message argument');
    }
  };
}

function invariant(condition, format, a, b, c, d, e, f) {
  validateFormat(format);

  if (!condition) {
    var error;
    if (format === undefined) {
      error = new Error('Minified exception occurred; use the non-minified dev environment ' + 'for the full error message and additional helpful warnings.');
    } else {
      var args = [a, b, c, d, e, f];
      var argIndex = 0;
      error = new Error(format.replace(/%s/g, function () {
        return args[argIndex++];
      }));
      error.name = 'Invariant Violation';
    }

    error.framesToPop = 1; // we don't care about invariant's own frame
    throw error;
  }
}

module.exports = invariant;

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2014-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var emptyFunction = __webpack_require__(3);

/**
 * Similar to invariant but only logs a warning if the condition is not met.
 * This can be used to log issues in development environments in critical
 * paths. Removing the logging code for production environments will keep the
 * same logic and follow the same code paths.
 */

var warning = emptyFunction;

if (true) {
  (function () {
    var printWarning = function printWarning(format) {
      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      var argIndex = 0;
      var message = 'Warning: ' + format.replace(/%s/g, function () {
        return args[argIndex++];
      });
      if (typeof console !== 'undefined') {
        console.error(message);
      }
      try {
        // --- Welcome to debugging React ---
        // This error was thrown as a convenience so that you can use this stack
        // to find the callsite that caused this warning to fire.
        throw new Error(message);
      } catch (x) {}
    };

    warning = function warning(condition, format) {
      if (format === undefined) {
        throw new Error('`warning(condition, format, ...args)` requires a warning ' + 'message argument');
      }

      if (format.indexOf('Failed Composite propType: ') === 0) {
        return; // Ignore CompositeComponent proptype check.
      }

      if (!condition) {
        for (var _len2 = arguments.length, args = Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
          args[_key2 - 2] = arguments[_key2];
        }

        printWarning.apply(undefined, [format].concat(args));
      }
    };
  })();
}

module.exports = warning;

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/


/* eslint-disable no-unused-vars */
var getOwnPropertySymbols = Object.getOwnPropertySymbols;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
  if (val === null || val === undefined) {
    throw new TypeError('Object.assign cannot be called with null or undefined');
  }

  return Object(val);
}

function shouldUseNative() {
  try {
    if (!Object.assign) {
      return false;
    }

    // Detect buggy property enumeration order in older V8 versions.

    // https://bugs.chromium.org/p/v8/issues/detail?id=4118
    var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
    test1[5] = 'de';
    if (Object.getOwnPropertyNames(test1)[0] === '5') {
      return false;
    }

    // https://bugs.chromium.org/p/v8/issues/detail?id=3056
    var test2 = {};
    for (var i = 0; i < 10; i++) {
      test2['_' + String.fromCharCode(i)] = i;
    }
    var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
      return test2[n];
    });
    if (order2.join('') !== '0123456789') {
      return false;
    }

    // https://bugs.chromium.org/p/v8/issues/detail?id=3056
    var test3 = {};
    'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
      test3[letter] = letter;
    });
    if (Object.keys(Object.assign({}, test3)).join('') !==
        'abcdefghijklmnopqrst') {
      return false;
    }

    return true;
  } catch (err) {
    // We don't expect any of the above to throw, but better to be safe.
    return false;
  }
}

module.exports = shouldUseNative() ? Object.assign : function (target, source) {
  var from;
  var to = toObject(target);
  var symbols;

  for (var s = 1; s < arguments.length; s++) {
    from = Object(arguments[s]);

    for (var key in from) {
      if (hasOwnProperty.call(from, key)) {
        to[key] = from[key];
      }
    }

    if (getOwnPropertySymbols) {
      symbols = getOwnPropertySymbols(from);
      for (var i = 0; i < symbols.length; i++) {
        if (propIsEnumerable.call(from, symbols[i])) {
          to[symbols[i]] = from[symbols[i]];
        }
      }
    }
  }

  return to;
};


/***/ })
/******/ ]);
});

// NOTE: Add react-dom-factories dependency.
'use strict';

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

(function(f) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = f(require('react'));
    /* global define */
  } else if (typeof define === 'function' && define.amd) {
    define(['react'], f);
  } else {
    var g;
    if (typeof window !== 'undefined') {
      g = window;
    } else if (typeof global !== 'undefined') {
      g = global;
    } else if (typeof self !== 'undefined') {
      g = self;
    } else {
      g = this;
    }

    if (typeof g.React === 'undefined') {
      throw Error('React module should be required before ReactDOMFactories');
    }

    g.ReactDOMFactories = f(g.React);
  }
})(function(React) {
  /**
   * Create a factory that creates HTML tag elements.
   */
  function createDOMFactory(type) {
    var factory = React.createElement.bind(null, type);
    // Expose the type on the factory and the prototype so that it can be
    // easily accessed on elements. E.g. `<Foo />.type === Foo`.
    // This should not be named `constructor` since this may not be the function
    // that created the element, and it may not even be a constructor.
    factory.type = type;
    return factory;
  };

  /**
   * Creates a mapping from supported HTML tags to `ReactDOMComponent` classes.
   */
  var ReactDOMFactories = {
    a: createDOMFactory('a'),
    abbr: createDOMFactory('abbr'),
    address: createDOMFactory('address'),
    area: createDOMFactory('area'),
    article: createDOMFactory('article'),
    aside: createDOMFactory('aside'),
    audio: createDOMFactory('audio'),
    b: createDOMFactory('b'),
    base: createDOMFactory('base'),
    bdi: createDOMFactory('bdi'),
    bdo: createDOMFactory('bdo'),
    big: createDOMFactory('big'),
    blockquote: createDOMFactory('blockquote'),
    body: createDOMFactory('body'),
    br: createDOMFactory('br'),
    button: createDOMFactory('button'),
    canvas: createDOMFactory('canvas'),
    caption: createDOMFactory('caption'),
    cite: createDOMFactory('cite'),
    code: createDOMFactory('code'),
    col: createDOMFactory('col'),
    colgroup: createDOMFactory('colgroup'),
    data: createDOMFactory('data'),
    datalist: createDOMFactory('datalist'),
    dd: createDOMFactory('dd'),
    del: createDOMFactory('del'),
    details: createDOMFactory('details'),
    dfn: createDOMFactory('dfn'),
    dialog: createDOMFactory('dialog'),
    div: createDOMFactory('div'),
    dl: createDOMFactory('dl'),
    dt: createDOMFactory('dt'),
    em: createDOMFactory('em'),
    embed: createDOMFactory('embed'),
    fieldset: createDOMFactory('fieldset'),
    figcaption: createDOMFactory('figcaption'),
    figure: createDOMFactory('figure'),
    footer: createDOMFactory('footer'),
    form: createDOMFactory('form'),
    h1: createDOMFactory('h1'),
    h2: createDOMFactory('h2'),
    h3: createDOMFactory('h3'),
    h4: createDOMFactory('h4'),
    h5: createDOMFactory('h5'),
    h6: createDOMFactory('h6'),
    head: createDOMFactory('head'),
    header: createDOMFactory('header'),
    hgroup: createDOMFactory('hgroup'),
    hr: createDOMFactory('hr'),
    html: createDOMFactory('html'),
    i: createDOMFactory('i'),
    iframe: createDOMFactory('iframe'),
    img: createDOMFactory('img'),
    input: createDOMFactory('input'),
    ins: createDOMFactory('ins'),
    kbd: createDOMFactory('kbd'),
    keygen: createDOMFactory('keygen'),
    label: createDOMFactory('label'),
    legend: createDOMFactory('legend'),
    li: createDOMFactory('li'),
    link: createDOMFactory('link'),
    main: createDOMFactory('main'),
    map: createDOMFactory('map'),
    mark: createDOMFactory('mark'),
    menu: createDOMFactory('menu'),
    menuitem: createDOMFactory('menuitem'),
    meta: createDOMFactory('meta'),
    meter: createDOMFactory('meter'),
    nav: createDOMFactory('nav'),
    noscript: createDOMFactory('noscript'),
    object: createDOMFactory('object'),
    ol: createDOMFactory('ol'),
    optgroup: createDOMFactory('optgroup'),
    option: createDOMFactory('option'),
    output: createDOMFactory('output'),
    p: createDOMFactory('p'),
    param: createDOMFactory('param'),
    picture: createDOMFactory('picture'),
    pre: createDOMFactory('pre'),
    progress: createDOMFactory('progress'),
    q: createDOMFactory('q'),
    rp: createDOMFactory('rp'),
    rt: createDOMFactory('rt'),
    ruby: createDOMFactory('ruby'),
    s: createDOMFactory('s'),
    samp: createDOMFactory('samp'),
    script: createDOMFactory('script'),
    section: createDOMFactory('section'),
    select: createDOMFactory('select'),
    small: createDOMFactory('small'),
    source: createDOMFactory('source'),
    span: createDOMFactory('span'),
    strong: createDOMFactory('strong'),
    style: createDOMFactory('style'),
    sub: createDOMFactory('sub'),
    summary: createDOMFactory('summary'),
    sup: createDOMFactory('sup'),
    table: createDOMFactory('table'),
    tbody: createDOMFactory('tbody'),
    td: createDOMFactory('td'),
    textarea: createDOMFactory('textarea'),
    tfoot: createDOMFactory('tfoot'),
    th: createDOMFactory('th'),
    thead: createDOMFactory('thead'),
    time: createDOMFactory('time'),
    title: createDOMFactory('title'),
    tr: createDOMFactory('tr'),
    track: createDOMFactory('track'),
    u: createDOMFactory('u'),
    ul: createDOMFactory('ul'),
    var: createDOMFactory('var'),
    video: createDOMFactory('video'),
    wbr: createDOMFactory('wbr'),

    // SVG
    circle: createDOMFactory('circle'),
    clipPath: createDOMFactory('clipPath'),
    defs: createDOMFactory('defs'),
    ellipse: createDOMFactory('ellipse'),
    g: createDOMFactory('g'),
    image: createDOMFactory('image'),
    line: createDOMFactory('line'),
    linearGradient: createDOMFactory('linearGradient'),
    mask: createDOMFactory('mask'),
    path: createDOMFactory('path'),
    pattern: createDOMFactory('pattern'),
    polygon: createDOMFactory('polygon'),
    polyline: createDOMFactory('polyline'),
    radialGradient: createDOMFactory('radialGradient'),
    rect: createDOMFactory('rect'),
    stop: createDOMFactory('stop'),
    svg: createDOMFactory('svg'),
    text: createDOMFactory('text'),
    tspan: createDOMFactory('tspan'),
  };

  // due to wrapper and conditionals at the top, this will either become
  // `module.exports ReactDOMFactories` if that is available,
  // otherwise it will be defined via `define(['react'], ReactDOMFactories)`
  // if that is available,
  // otherwise it will be defined as global variable.
  return ReactDOMFactories;
});


(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.LC = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @typechecks
 *
 */

/*eslint-disable no-self-compare */

'use strict';

var hasOwnProperty = Object.prototype.hasOwnProperty;

/**
 * inlined Object.is polyfill to avoid requiring consumers ship their own
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
 */
function is(x, y) {
  // SameValue algorithm
  if (x === y) {
    // Steps 1-5, 7-10
    // Steps 6.b-6.e: +0 != -0
    // Added the nonzero y check to make Flow happy, but it is redundant
    return x !== 0 || y !== 0 || 1 / x === 1 / y;
  } else {
    // Step 6.a: NaN == NaN
    return x !== x && y !== y;
  }
}

/**
 * Performs equality by iterating through keys on an object and returning false
 * when any key has values which are not strictly equal between the arguments.
 * Returns true when the values of all keys are strictly equal.
 */
function shallowEqual(objA, objB) {
  if (is(objA, objB)) {
    return true;
  }

  if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
    return false;
  }

  var keysA = Object.keys(objA);
  var keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) {
    return false;
  }

  // Test for A's keys different from B.
  for (var i = 0; i < keysA.length; i++) {
    if (!hasOwnProperty.call(objB, keysA[i]) || !is(objA[keysA[i]], objB[keysA[i]])) {
      return false;
    }
  }

  return true;
}

module.exports = shallowEqual;
},{}],2:[function(require,module,exports){
/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

var shallowEqual = require('fbjs/lib/shallowEqual');

module.exports = {
  shouldComponentUpdate: function(nextProps, nextState) {
    return (
      !shallowEqual(this.props, nextProps) ||
      !shallowEqual(this.state, nextState)
    );
  }
};

},{"fbjs/lib/shallowEqual":1}],3:[function(require,module,exports){
var INFINITE, JSONToShape, LiterallyCanvas, Pencil, actions, bindEvents, createShape, math, ref, renderShapeToContext, renderShapeToSVG, renderSnapshotToImage, renderSnapshotToSVG, shapeToJSON, util,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  slice = [].slice,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

actions = require('./actions');

bindEvents = require('./bindEvents');

math = require('./math');

ref = require('./shapes'), createShape = ref.createShape, shapeToJSON = ref.shapeToJSON, JSONToShape = ref.JSONToShape;

renderShapeToContext = require('./canvasRenderer').renderShapeToContext;

renderShapeToSVG = require('./svgRenderer').renderShapeToSVG;

renderSnapshotToImage = require('./renderSnapshotToImage');

renderSnapshotToSVG = require('./renderSnapshotToSVG');

Pencil = require('../tools/Pencil');

util = require('./util');

INFINITE = 'infinite';

module.exports = LiterallyCanvas = (function() {
  function LiterallyCanvas(arg1, arg2) {
    this.setImageSize = bind(this.setImageSize, this);
    var containerEl, opts;
    opts = null;
    containerEl = null;
    if (arg1 instanceof HTMLElement) {
      containerEl = arg1;
      opts = arg2;
    } else {
      opts = arg1;
    }
    this.opts = opts || {};
    this.config = {
      zoomMin: opts.zoomMin || 0.2,
      zoomMax: opts.zoomMax || 4.0,
      zoomStep: opts.zoomStep || 0.2
    };
    this.colors = {
      primary: opts.primaryColor || '#000',
      secondary: opts.secondaryColor || '#fff',
      background: opts.backgroundColor || 'transparent'
    };
    this.watermarkImage = opts.watermarkImage;
    this.watermarkScale = opts.watermarkScale || 1;
    this.backgroundCanvas = document.createElement('canvas');
    this.backgroundCtx = this.backgroundCanvas.getContext('2d');
    this.canvas = document.createElement('canvas');
    this.canvas.style['background-color'] = 'transparent';
    this.buffer = document.createElement('canvas');
    this.buffer.style['background-color'] = 'transparent';
    this.ctx = this.canvas.getContext('2d');
    this.bufferCtx = this.buffer.getContext('2d');
    this.backingScale = util.getBackingScale(this.ctx);
    this.backgroundShapes = opts.backgroundShapes || [];
    this._shapesInProgress = [];
    this.shapes = [];
    this.undoStack = [];
    this.redoStack = [];
    this.isDragging = false;
    this.position = {
      x: 0,
      y: 0
    };
    this.scale = 1.0;
    this.setTool(new this.opts.tools[0](this));
    this.width = opts.imageSize.width || INFINITE;
    this.height = opts.imageSize.height || INFINITE;
    this.setZoom(this.scale);
    if (opts.snapshot) {
      this.loadSnapshot(opts.snapshot);
    }
    this.isBound = false;
    if (containerEl) {
      this.bindToElement(containerEl);
    }
    this.respondToSizeChange = function() {};
  }

  LiterallyCanvas.prototype.bindToElement = function(containerEl) {
    var ref1, repaintAll;
    if (this.containerEl) {
      console.warn("Trying to bind Literally Canvas to a DOM element more than once is unsupported.");
      return;
    }
    this.containerEl = containerEl;
    this._unsubscribeEvents = bindEvents(this, this.containerEl, this.opts.keyboardShortcuts);
    this.containerEl.style['background-color'] = this.colors.background;
    this.containerEl.appendChild(this.backgroundCanvas);
    this.containerEl.appendChild(this.canvas);
    this.isBound = true;
    repaintAll = (function(_this) {
      return function() {
        _this.keepPanInImageBounds();
        return _this.repaintAllLayers();
      };
    })(this);
    this.respondToSizeChange = util.matchElementSize(this.containerEl, [this.backgroundCanvas, this.canvas], this.backingScale, repaintAll);
    if (this.watermarkImage) {
      this.watermarkImage.onload = (function(_this) {
        return function() {
          return _this.repaintLayer('background');
        };
      })(this);
    }
    if ((ref1 = this.tool) != null) {
      ref1.didBecomeActive(this);
    }
    return repaintAll();
  };

  LiterallyCanvas.prototype._teardown = function() {
    var ref1;
    if ((ref1 = this.tool) != null) {
      ref1.willBecomeInactive(this);
    }
    if (typeof this._unsubscribeEvents === "function") {
      this._unsubscribeEvents();
    }
    this.tool = null;
    this.containerEl = null;
    return this.isBound = false;
  };

  LiterallyCanvas.prototype.trigger = function(name, data) {
    this.canvas.dispatchEvent(new CustomEvent(name, {
      detail: data
    }));
    return null;
  };

  LiterallyCanvas.prototype.on = function(name, fn) {
    var wrapper;
    wrapper = function(e) {
      return fn(e.detail);
    };
    this.canvas.addEventListener(name, wrapper);
    return (function(_this) {
      return function() {
        return _this.canvas.removeEventListener(name, wrapper);
      };
    })(this);
  };

  LiterallyCanvas.prototype.getRenderScale = function() {
    return this.scale * this.backingScale;
  };

  LiterallyCanvas.prototype.clientCoordsToDrawingCoords = function(x, y) {
    return {
      x: (x * this.backingScale - this.position.x) / this.getRenderScale(),
      y: (y * this.backingScale - this.position.y) / this.getRenderScale()
    };
  };

  LiterallyCanvas.prototype.drawingCoordsToClientCoords = function(x, y) {
    return {
      x: x * this.getRenderScale() + this.position.x,
      y: y * this.getRenderScale() + this.position.y
    };
  };

  LiterallyCanvas.prototype.setImageSize = function(width, height) {
    this.width = width || INFINITE;
    this.height = height || INFINITE;
    this.keepPanInImageBounds();
    this.repaintAllLayers();
    return this.trigger('imageSizeChange', {
      width: this.width,
      height: this.height
    });
  };

  LiterallyCanvas.prototype.setTool = function(tool) {
    var ref1;
    if (this.isBound) {
      if ((ref1 = this.tool) != null) {
        ref1.willBecomeInactive(this);
      }
    }
    this.tool = tool;
    this.trigger('toolChange', {
      tool: tool
    });
    if (this.isBound) {
      return this.tool.didBecomeActive(this);
    }
  };

  LiterallyCanvas.prototype.setShapesInProgress = function(newVal) {
    return this._shapesInProgress = newVal;
  };

  LiterallyCanvas.prototype.pointerDown = function(x, y) {
    var p;
    p = this.clientCoordsToDrawingCoords(x, y);
    if (this.tool.usesSimpleAPI) {
      this.tool.begin(p.x, p.y, this);
      this.isDragging = true;
      return this.trigger("drawStart", {
        tool: this.tool
      });
    } else {
      this.isDragging = true;
      return this.trigger("lc-pointerdown", {
        tool: this.tool,
        x: p.x,
        y: p.y,
        rawX: x,
        rawY: y
      });
    }
  };

  LiterallyCanvas.prototype.pointerMove = function(x, y) {
    return util.requestAnimationFrame((function(_this) {
      return function() {
        var p, ref1;
        p = _this.clientCoordsToDrawingCoords(x, y);
        if ((ref1 = _this.tool) != null ? ref1.usesSimpleAPI : void 0) {
          if (_this.isDragging) {
            _this.tool["continue"](p.x, p.y, _this);
            return _this.trigger("drawContinue", {
              tool: _this.tool
            });
          }
        } else {
          if (_this.isDragging) {
            return _this.trigger("lc-pointerdrag", {
              tool: _this.tool,
              x: p.x,
              y: p.y,
              rawX: x,
              rawY: y
            });
          } else {
            return _this.trigger("lc-pointermove", {
              tool: _this.tool,
              x: p.x,
              y: p.y,
              rawX: x,
              rawY: y
            });
          }
        }
      };
    })(this));
  };

  LiterallyCanvas.prototype.pointerUp = function(x, y) {
    var p;
    p = this.clientCoordsToDrawingCoords(x, y);
    if (this.tool.usesSimpleAPI) {
      if (this.isDragging) {
        this.tool.end(p.x, p.y, this);
        this.isDragging = false;
        return this.trigger("drawEnd", {
          tool: this.tool
        });
      }
    } else {
      this.isDragging = false;
      return this.trigger("lc-pointerup", {
        tool: this.tool,
        x: p.x,
        y: p.y,
        rawX: x,
        rawY: y
      });
    }
  };

  LiterallyCanvas.prototype.setColor = function(name, color) {
    this.colors[name] = color;
    if (!this.isBound) {
      return;
    }
    switch (name) {
      case 'background':
        this.containerEl.style.backgroundColor = this.colors.background;
        this.repaintLayer('background');
        break;
      case 'primary':
        this.repaintLayer('main');
        break;
      case 'secondary':
        this.repaintLayer('main');
    }
    this.trigger(name + "ColorChange", this.colors[name]);
    if (name === 'background') {
      return this.trigger("drawingChange");
    }
  };

  LiterallyCanvas.prototype.getColor = function(name) {
    return this.colors[name];
  };

  LiterallyCanvas.prototype.saveShape = function(shape, triggerShapeSaveEvent, previousShapeId) {
    if (triggerShapeSaveEvent == null) {
      triggerShapeSaveEvent = true;
    }
    if (previousShapeId == null) {
      previousShapeId = null;
    }
    if (!previousShapeId) {
      previousShapeId = this.shapes.length ? this.shapes[this.shapes.length - 1].id : null;
    }
    this.execute(new actions.AddShapeAction(this, shape, previousShapeId));
    if (triggerShapeSaveEvent) {
      this.trigger('shapeSave', {
        shape: shape,
        previousShapeId: previousShapeId
      });
    }
    return this.trigger('drawingChange');
  };

  LiterallyCanvas.prototype.pan = function(x, y) {
    return this.setPan(this.position.x - x, this.position.y - y);
  };

  LiterallyCanvas.prototype.keepPanInImageBounds = function() {
    var ref1, renderScale, x, y;
    renderScale = this.getRenderScale();
    ref1 = this.position, x = ref1.x, y = ref1.y;
    if (this.width !== INFINITE) {
      if (this.canvas.width > this.width * renderScale) {
        x = (this.canvas.width - this.width * renderScale) / 2;
      } else {
        x = Math.max(Math.min(0, x), this.canvas.width - this.width * renderScale);
      }
    }
    if (this.height !== INFINITE) {
      if (this.canvas.height > this.height * renderScale) {
        y = (this.canvas.height - this.height * renderScale) / 2;
      } else {
        y = Math.max(Math.min(0, y), this.canvas.height - this.height * renderScale);
      }
    }
    return this.position = {
      x: x,
      y: y
    };
  };

  LiterallyCanvas.prototype.setPan = function(x, y) {
    this.position = {
      x: x,
      y: y
    };
    this.keepPanInImageBounds();
    this.repaintAllLayers();
    return this.trigger('pan', {
      x: this.position.x,
      y: this.position.y
    });
  };

  LiterallyCanvas.prototype.zoom = function(factor) {
    var newScale;
    newScale = this.scale + factor;
    newScale = Math.max(newScale, this.config.zoomMin);
    newScale = Math.min(newScale, this.config.zoomMax);
    newScale = Math.round(newScale * 100) / 100;
    return this.setZoom(newScale);
  };

  LiterallyCanvas.prototype.setZoom = function(scale) {
    var center, oldScale;
    center = this.clientCoordsToDrawingCoords(this.canvas.width / 2, this.canvas.height / 2);
    oldScale = this.scale;
    this.scale = scale;
    this.position.x = this.canvas.width / 2 * this.backingScale - center.x * this.getRenderScale();
    this.position.y = this.canvas.height / 2 * this.backingScale - center.y * this.getRenderScale();
    this.keepPanInImageBounds();
    this.repaintAllLayers();
    return this.trigger('zoom', {
      oldScale: oldScale,
      newScale: this.scale
    });
  };

  LiterallyCanvas.prototype.setWatermarkImage = function(newImage) {
    this.watermarkImage = newImage;
    util.addImageOnload(newImage, (function(_this) {
      return function() {
        return _this.repaintLayer('background');
      };
    })(this));
    if (newImage.width) {
      return this.repaintLayer('background');
    }
  };

  LiterallyCanvas.prototype.repaintAllLayers = function() {
    var i, key, len, ref1;
    ref1 = ['background', 'main'];
    for (i = 0, len = ref1.length; i < len; i++) {
      key = ref1[i];
      this.repaintLayer(key);
    }
    return null;
  };

  LiterallyCanvas.prototype.repaintLayer = function(repaintLayerKey, dirty) {
    var retryCallback;
    if (dirty == null) {
      dirty = repaintLayerKey === 'main';
    }
    if (!this.isBound) {
      return;
    }
    switch (repaintLayerKey) {
      case 'background':
        this.backgroundCtx.clearRect(0, 0, this.backgroundCanvas.width, this.backgroundCanvas.height);
        retryCallback = (function(_this) {
          return function() {
            return _this.repaintLayer('background');
          };
        })(this);
        if (this.watermarkImage) {
          this._renderWatermark(this.backgroundCtx, true, retryCallback);
        }
        this.draw(this.backgroundShapes, this.backgroundCtx, retryCallback);
        break;
      case 'main':
        retryCallback = (function(_this) {
          return function() {
            return _this.repaintLayer('main', true);
          };
        })(this);
        if (dirty) {
          this.buffer.width = this.canvas.width;
          this.buffer.height = this.canvas.height;
          this.bufferCtx.clearRect(0, 0, this.buffer.width, this.buffer.height);
          this.draw(this.shapes, this.bufferCtx, retryCallback);
        }
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.canvas.width > 0 && this.canvas.height > 0) {
          this.ctx.fillStyle = '#ccc';
          this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
          this.clipped(((function(_this) {
            return function() {
              _this.ctx.clearRect(0, 0, _this.canvas.width, _this.canvas.height);
              return _this.ctx.drawImage(_this.buffer, 0, 0);
            };
          })(this)), this.ctx);
          this.clipped(((function(_this) {
            return function() {
              return _this.transformed((function() {
                var i, len, ref1, results, shape;
                ref1 = _this._shapesInProgress;
                results = [];
                for (i = 0, len = ref1.length; i < len; i++) {
                  shape = ref1[i];
                  results.push(renderShapeToContext(_this.ctx, shape, {
                    bufferCtx: _this.bufferCtx,
                    shouldOnlyDrawLatest: true
                  }));
                }
                return results;
              }), _this.ctx, _this.bufferCtx);
            };
          })(this)), this.ctx, this.bufferCtx);
        }
    }
    return this.trigger('repaint', {
      layerKey: repaintLayerKey
    });
  };

  LiterallyCanvas.prototype._renderWatermark = function(ctx, worryAboutRetina, retryCallback) {
    if (worryAboutRetina == null) {
      worryAboutRetina = true;
    }
    if (!this.watermarkImage.width) {
      this.watermarkImage.onload = retryCallback;
      return;
    }
    ctx.save();
    ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
    ctx.scale(this.watermarkScale, this.watermarkScale);
    if (worryAboutRetina) {
      ctx.scale(this.backingScale, this.backingScale);
    }
    ctx.drawImage(this.watermarkImage, -this.watermarkImage.width / 2, -this.watermarkImage.height / 2);
    return ctx.restore();
  };

  LiterallyCanvas.prototype.drawShapeInProgress = function(shape) {
    this.repaintLayer('main', false);
    return this.clipped(((function(_this) {
      return function() {
        return _this.transformed((function() {
          return renderShapeToContext(_this.ctx, shape, {
            bufferCtx: _this.bufferCtx,
            shouldOnlyDrawLatest: true
          });
        }), _this.ctx, _this.bufferCtx);
      };
    })(this)), this.ctx, this.bufferCtx);
  };

  LiterallyCanvas.prototype.draw = function(shapes, ctx, retryCallback) {
    var drawShapes;
    if (!shapes.length) {
      return;
    }
    drawShapes = (function(_this) {
      return function() {
        var i, len, results, shape;
        results = [];
        for (i = 0, len = shapes.length; i < len; i++) {
          shape = shapes[i];
          results.push(renderShapeToContext(ctx, shape, {
            retryCallback: retryCallback
          }));
        }
        return results;
      };
    })(this);
    return this.clipped(((function(_this) {
      return function() {
        return _this.transformed(drawShapes, ctx);
      };
    })(this)), ctx);
  };

  LiterallyCanvas.prototype.clipped = function() {
    var contexts, ctx, fn, height, i, j, len, len1, results, width, x, y;
    fn = arguments[0], contexts = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    x = this.width === INFINITE ? 0 : this.position.x;
    y = this.height === INFINITE ? 0 : this.position.y;
    width = (function() {
      switch (this.width) {
        case INFINITE:
          return this.canvas.width;
        default:
          return this.width * this.getRenderScale();
      }
    }).call(this);
    height = (function() {
      switch (this.height) {
        case INFINITE:
          return this.canvas.height;
        default:
          return this.height * this.getRenderScale();
      }
    }).call(this);
    for (i = 0, len = contexts.length; i < len; i++) {
      ctx = contexts[i];
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, width, height);
      ctx.clip();
    }
    fn();
    results = [];
    for (j = 0, len1 = contexts.length; j < len1; j++) {
      ctx = contexts[j];
      results.push(ctx.restore());
    }
    return results;
  };

  LiterallyCanvas.prototype.transformed = function() {
    var contexts, ctx, fn, i, j, len, len1, results, scale;
    fn = arguments[0], contexts = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    for (i = 0, len = contexts.length; i < len; i++) {
      ctx = contexts[i];
      ctx.save();
      ctx.translate(Math.floor(this.position.x), Math.floor(this.position.y));
      scale = this.getRenderScale();
      ctx.scale(scale, scale);
    }
    fn();
    results = [];
    for (j = 0, len1 = contexts.length; j < len1; j++) {
      ctx = contexts[j];
      results.push(ctx.restore());
    }
    return results;
  };

  LiterallyCanvas.prototype.clear = function(triggerClearEvent) {
    var newShapes, oldShapes;
    if (triggerClearEvent == null) {
      triggerClearEvent = true;
    }
    oldShapes = this.shapes;
    newShapes = [];
    this.setShapesInProgress([]);
    this.execute(new actions.ClearAction(this, oldShapes, newShapes));
    this.repaintLayer('main');
    if (triggerClearEvent) {
      this.trigger('clear', null);
    }
    return this.trigger('drawingChange', {});
  };

  LiterallyCanvas.prototype.execute = function(action) {
    this.undoStack.push(action);
    action["do"]();
    return this.redoStack = [];
  };

  LiterallyCanvas.prototype.undo = function() {
    var action;
    if (!this.undoStack.length) {
      return;
    }
    action = this.undoStack.pop();
    action.undo();
    this.redoStack.push(action);
    this.trigger('undo', {
      action: action
    });
    return this.trigger('drawingChange', {});
  };

  LiterallyCanvas.prototype.redo = function() {
    var action;
    if (!this.redoStack.length) {
      return;
    }
    action = this.redoStack.pop();
    this.undoStack.push(action);
    action["do"]();
    this.trigger('redo', {
      action: action
    });
    return this.trigger('drawingChange', {});
  };

  LiterallyCanvas.prototype.canUndo = function() {
    return !!this.undoStack.length;
  };

  LiterallyCanvas.prototype.canRedo = function() {
    return !!this.redoStack.length;
  };

  LiterallyCanvas.prototype.getPixel = function(x, y) {
    var p, pixel;
    p = this.drawingCoordsToClientCoords(x, y);
    pixel = this.ctx.getImageData(p.x, p.y, 1, 1).data;
    if (pixel[3]) {
      return "rgb(" + pixel[0] + ", " + pixel[1] + ", " + pixel[2] + ")";
    } else {
      return null;
    }
  };

  LiterallyCanvas.prototype.getContentBounds = function() {
    return util.getBoundingRect((this.shapes.concat(this.backgroundShapes)).map(function(s) {
      return s.getBoundingRect();
    }), this.width === INFINITE ? 0 : this.width, this.height === INFINITE ? 0 : this.height);
  };

  LiterallyCanvas.prototype.getDefaultImageRect = function(explicitSize, margin) {
    var s;
    if (explicitSize == null) {
      explicitSize = {
        width: 0,
        height: 0
      };
    }
    if (margin == null) {
      margin = {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      };
    }
    return util.getDefaultImageRect((function() {
      var i, len, ref1, results;
      ref1 = this.shapes.concat(this.backgroundShapes);
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        s = ref1[i];
        results.push(s.getBoundingRect(this.ctx));
      }
      return results;
    }).call(this), explicitSize, margin);
  };

  LiterallyCanvas.prototype.getImage = function(opts) {
    if (opts == null) {
      opts = {};
    }
    if (opts.includeWatermark == null) {
      opts.includeWatermark = true;
    }
    if (opts.scaleDownRetina == null) {
      opts.scaleDownRetina = true;
    }
    if (opts.scale == null) {
      opts.scale = 1;
    }
    if (!opts.scaleDownRetina) {
      opts.scale *= this.backingScale;
    }
    if (opts.includeWatermark) {
      opts.watermarkImage = this.watermarkImage;
      opts.watermarkScale = this.watermarkScale;
      if (!opts.scaleDownRetina) {
        opts.watermarkScale *= this.backingScale;
      }
    }
    return renderSnapshotToImage(this.getSnapshot(), opts);
  };

  LiterallyCanvas.prototype.canvasForExport = function() {
    this.repaintAllLayers();
    return util.combineCanvases(this.backgroundCanvas, this.canvas);
  };

  LiterallyCanvas.prototype.canvasWithBackground = function(backgroundImageOrCanvas) {
    return util.combineCanvases(backgroundImageOrCanvas, this.canvasForExport());
  };

  LiterallyCanvas.prototype.getSnapshot = function(keys) {
    var i, k, len, ref1, shape, snapshot;
    if (keys == null) {
      keys = null;
    }
    if (keys == null) {
      keys = ['shapes', 'imageSize', 'colors', 'position', 'scale', 'backgroundShapes'];
    }
    snapshot = {};
    ref1 = ['colors', 'position', 'scale'];
    for (i = 0, len = ref1.length; i < len; i++) {
      k = ref1[i];
      if (indexOf.call(keys, k) >= 0) {
        snapshot[k] = this[k];
      }
    }
    if (indexOf.call(keys, 'shapes') >= 0) {
      snapshot.shapes = (function() {
        var j, len1, ref2, results;
        ref2 = this.shapes;
        results = [];
        for (j = 0, len1 = ref2.length; j < len1; j++) {
          shape = ref2[j];
          results.push(shapeToJSON(shape));
        }
        return results;
      }).call(this);
    }
    if (indexOf.call(keys, 'backgroundShapes') >= 0) {
      snapshot.backgroundShapes = (function() {
        var j, len1, ref2, results;
        ref2 = this.backgroundShapes;
        results = [];
        for (j = 0, len1 = ref2.length; j < len1; j++) {
          shape = ref2[j];
          results.push(shapeToJSON(shape));
        }
        return results;
      }).call(this);
    }
    if (indexOf.call(keys, 'imageSize') >= 0) {
      snapshot.imageSize = {
        width: this.width,
        height: this.height
      };
    }
    return snapshot;
  };

  LiterallyCanvas.prototype.getSnapshotJSON = function() {
    console.warn("lc.getSnapshotJSON() is deprecated. use JSON.stringify(lc.getSnapshot()) instead.");
    return JSON.stringify(this.getSnapshot());
  };

  LiterallyCanvas.prototype.getSVGString = function(opts) {
    if (opts == null) {
      opts = {};
    }
    return renderSnapshotToSVG(this.getSnapshot(), opts);
  };

  LiterallyCanvas.prototype.loadSnapshot = function(snapshot) {
    var i, j, k, len, len1, ref1, ref2, s, shape, shapeRepr;
    if (!snapshot) {
      return;
    }
    if (snapshot.colors) {
      ref1 = ['primary', 'secondary', 'background'];
      for (i = 0, len = ref1.length; i < len; i++) {
        k = ref1[i];
        this.setColor(k, snapshot.colors[k]);
      }
    }
    if (snapshot.shapes) {
      this.shapes = [];
      ref2 = snapshot.shapes;
      for (j = 0, len1 = ref2.length; j < len1; j++) {
        shapeRepr = ref2[j];
        shape = JSONToShape(shapeRepr);
        if (shape) {
          this.execute(new actions.AddShapeAction(this, shape));
        }
      }
    }
    if (snapshot.backgroundShapes) {
      this.backgroundShapes = (function() {
        var l, len2, ref3, results;
        ref3 = snapshot.backgroundShapes;
        results = [];
        for (l = 0, len2 = ref3.length; l < len2; l++) {
          s = ref3[l];
          results.push(JSONToShape(s));
        }
        return results;
      })();
    }
    if (snapshot.imageSize) {
      this.width = snapshot.imageSize.width;
      this.height = snapshot.imageSize.height;
    }
    if (snapshot.position) {
      this.position = snapshot.position;
    }
    if (snapshot.scale) {
      this.scale = snapshot.scale;
    }
    this.repaintAllLayers();
    this.trigger('snapshotLoad');
    return this.trigger('drawingChange', {});
  };

  LiterallyCanvas.prototype.loadSnapshotJSON = function(str) {
    console.warn("lc.loadSnapshotJSON() is deprecated. use lc.loadSnapshot(JSON.parse(snapshot)) instead.");
    return this.loadSnapshot(JSON.parse(str));
  };

  return LiterallyCanvas;

})();


},{"../tools/Pencil":48,"./actions":5,"./bindEvents":6,"./canvasRenderer":7,"./math":12,"./renderSnapshotToImage":13,"./renderSnapshotToSVG":14,"./shapes":15,"./svgRenderer":16,"./util":17}],4:[function(require,module,exports){
var TextRenderer, getLinesToRender, getNextLine, parseFontString;

require('./fontmetrics.js');

parseFontString = function(font) {
  var fontFamily, fontItems, fontSize, item, j, len, maybeSize, remainingFontString;
  fontItems = font.split(' ');
  fontSize = 0;
  for (j = 0, len = fontItems.length; j < len; j++) {
    item = fontItems[j];
    maybeSize = parseInt(item.replace("px", ""), 10);
    if (!isNaN(maybeSize)) {
      fontSize = maybeSize;
    }
  }
  if (!fontSize) {
    throw "Font size not found";
  }
  remainingFontString = font.substring(fontItems[0].length + 1).replace('bold ', '').replace('italic ', '').replace('underline ', '');
  fontFamily = remainingFontString;
  return {
    fontSize: fontSize,
    fontFamily: fontFamily
  };
};

getNextLine = function(ctx, text, forcedWidth) {
  var doesSubstringFit, endIndex, isEndOfString, isNonWord, isWhitespace, lastGoodIndex, lastOkayIndex, nextWordStartIndex, textToHere, wasInWord;
  if (!text.length) {
    return ['', ''];
  }
  endIndex = 0;
  lastGoodIndex = 0;
  lastOkayIndex = 0;
  wasInWord = false;
  while (true) {
    endIndex += 1;
    isEndOfString = endIndex >= text.length;
    isWhitespace = (!isEndOfString) && text[endIndex].match(/\s/);
    isNonWord = isWhitespace || isEndOfString;
    textToHere = text.substring(0, endIndex);
    doesSubstringFit = forcedWidth ? ctx.measureTextWidth(textToHere).width <= forcedWidth : true;
    if (doesSubstringFit) {
      lastOkayIndex = endIndex;
    }
    if (isNonWord && wasInWord) {
      wasInWord = false;
      if (doesSubstringFit) {
        lastGoodIndex = endIndex;
      }
    }
    wasInWord = !isWhitespace;
    if (isEndOfString || !doesSubstringFit) {
      if (doesSubstringFit) {
        return [text, ''];
      } else if (lastGoodIndex > 0) {
        nextWordStartIndex = lastGoodIndex + 1;
        while (nextWordStartIndex < text.length && text[nextWordStartIndex].match('/\s/')) {
          nextWordStartIndex += 1;
        }
        return [text.substring(0, lastGoodIndex), text.substring(nextWordStartIndex)];
      } else {
        return [text.substring(0, lastOkayIndex), text.substring(lastOkayIndex)];
      }
    }
  }
};

getLinesToRender = function(ctx, text, forcedWidth) {
  var j, len, lines, nextLine, ref, ref1, remainingText, textLine, textSplitOnLines;
  textSplitOnLines = text.split(/\r\n|\r|\n/g);
  lines = [];
  for (j = 0, len = textSplitOnLines.length; j < len; j++) {
    textLine = textSplitOnLines[j];
    ref = getNextLine(ctx, textLine, forcedWidth), nextLine = ref[0], remainingText = ref[1];
    if (nextLine) {
      while (nextLine) {
        lines.push(nextLine);
        ref1 = getNextLine(ctx, remainingText, forcedWidth), nextLine = ref1[0], remainingText = ref1[1];
      }
    } else {
      lines.push(textLine);
    }
  }
  return lines;
};

TextRenderer = (function() {
  function TextRenderer(ctx, text1, font1, forcedWidth1, forcedHeight) {
    var fontFamily, fontSize, ref;
    this.text = text1;
    this.font = font1;
    this.forcedWidth = forcedWidth1;
    this.forcedHeight = forcedHeight;
    ref = parseFontString(this.font), fontFamily = ref.fontFamily, fontSize = ref.fontSize;
    ctx.font = this.font;
    ctx.textBaseline = 'baseline';
    this.emDashWidth = ctx.measureTextWidth('—', fontSize, fontFamily).width;
    this.caratWidth = ctx.measureTextWidth('|', fontSize, fontFamily).width;
    this.lines = getLinesToRender(ctx, this.text, this.forcedWidth);
    this.metricses = this.lines.map((function(_this) {
      return function(line) {
        return ctx.measureText2(line || 'X', fontSize, _this.font);
      };
    })(this));
    this.metrics = {
      ascent: Math.max.apply(Math, this.metricses.map(function(arg) {
        var ascent;
        ascent = arg.ascent;
        return ascent;
      })),
      descent: Math.max.apply(Math, this.metricses.map(function(arg) {
        var descent;
        descent = arg.descent;
        return descent;
      })),
      fontsize: Math.max.apply(Math, this.metricses.map(function(arg) {
        var fontsize;
        fontsize = arg.fontsize;
        return fontsize;
      })),
      leading: Math.max.apply(Math, this.metricses.map(function(arg) {
        var leading;
        leading = arg.leading;
        return leading;
      })),
      width: Math.max.apply(Math, this.metricses.map(function(arg) {
        var width;
        width = arg.width;
        return width;
      })),
      height: Math.max.apply(Math, this.metricses.map(function(arg) {
        var height;
        height = arg.height;
        return height;
      })),
      bounds: {
        minx: Math.min.apply(Math, this.metricses.map(function(arg) {
          var bounds;
          bounds = arg.bounds;
          return bounds.minx;
        })),
        miny: Math.min.apply(Math, this.metricses.map(function(arg) {
          var bounds;
          bounds = arg.bounds;
          return bounds.miny;
        })),
        maxx: Math.max.apply(Math, this.metricses.map(function(arg) {
          var bounds;
          bounds = arg.bounds;
          return bounds.maxx;
        })),
        maxy: Math.max.apply(Math, this.metricses.map(function(arg) {
          var bounds;
          bounds = arg.bounds;
          return bounds.maxy;
        }))
      }
    };
    this.boundingBoxWidth = Math.ceil(this.metrics.width);
  }

  TextRenderer.prototype.draw = function(ctx, x, y) {
    var i, j, len, line, ref, results;
    ctx.textBaseline = 'top';
    ctx.font = this.font;
    i = 0;
    ref = this.lines;
    results = [];
    for (j = 0, len = ref.length; j < len; j++) {
      line = ref[j];
      ctx.fillText(line, x, y + i * this.metrics.leading);
      results.push(i += 1);
    }
    return results;
  };

  TextRenderer.prototype.getWidth = function(isEditing) {
    if (isEditing == null) {
      isEditing = false;
    }
    if (this.forcedWidth) {
      return this.forcedWidth;
    } else {
      if (isEditing) {
        return this.metrics.bounds.maxx + this.caratWidth;
      } else {
        return this.metrics.bounds.maxx;
      }
    }
  };

  TextRenderer.prototype.getHeight = function() {
    return this.forcedHeight || (this.metrics.leading * this.lines.length);
  };

  return TextRenderer;

})();

module.exports = TextRenderer;


},{"./fontmetrics.js":9}],5:[function(require,module,exports){
var AddShapeAction, ClearAction;

ClearAction = (function() {
  function ClearAction(lc1, oldShapes, newShapes1) {
    this.lc = lc1;
    this.oldShapes = oldShapes;
    this.newShapes = newShapes1;
  }

  ClearAction.prototype["do"] = function() {
    this.lc.shapes = this.newShapes;
    return this.lc.repaintLayer('main');
  };

  ClearAction.prototype.undo = function() {
    this.lc.shapes = this.oldShapes;
    return this.lc.repaintLayer('main');
  };

  return ClearAction;

})();

AddShapeAction = (function() {
  function AddShapeAction(lc1, shape1, previousShapeId) {
    this.lc = lc1;
    this.shape = shape1;
    this.previousShapeId = previousShapeId != null ? previousShapeId : null;
  }

  AddShapeAction.prototype["do"] = function() {
    var found, i, len, newShapes, ref, shape;
    if (!this.lc.shapes.length || this.lc.shapes[this.lc.shapes.length - 1].id === this.previousShapeId || this.previousShapeId === null) {
      this.lc.shapes.push(this.shape);
    } else {
      newShapes = [];
      found = false;
      ref = this.lc.shapes;
      for (i = 0, len = ref.length; i < len; i++) {
        shape = ref[i];
        newShapes.push(shape);
        if (shape.id === this.previousShapeId) {
          newShapes.push(this.shape);
          found = true;
        }
      }
      if (!found) {
        newShapes.push(this.shape);
      }
      this.lc.shapes = newShapes;
    }
    return this.lc.repaintLayer('main');
  };

  AddShapeAction.prototype.undo = function() {
    var i, len, newShapes, ref, shape;
    if (this.lc.shapes[this.lc.shapes.length - 1].id === this.shape.id) {
      this.lc.shapes.pop();
    } else {
      newShapes = [];
      ref = this.lc.shapes;
      for (i = 0, len = ref.length; i < len; i++) {
        shape = ref[i];
        if (shape.id !== this.shape.id) {
          newShapes.push(shape);
        }
      }
      lc.shapes = newShapes;
    }
    return this.lc.repaintLayer('main');
  };

  return AddShapeAction;

})();

module.exports = {
  ClearAction: ClearAction,
  AddShapeAction: AddShapeAction
};


},{}],6:[function(require,module,exports){
var bindEvents, buttonIsDown, coordsForTouchEvent, position;

coordsForTouchEvent = function(el, e) {
  var p, tx, ty;
  tx = e.changedTouches[0].clientX;
  ty = e.changedTouches[0].clientY;
  p = el.getBoundingClientRect();
  return [tx - p.left, ty - p.top];
};

position = function(el, e) {
  var p;
  p = el.getBoundingClientRect();
  return {
    left: e.clientX - p.left,
    top: e.clientY - p.top
  };
};

buttonIsDown = function(e) {
  if (e.buttons != null) {
    return e.buttons === 1;
  } else {
    return e.which > 0;
  }
};

module.exports = bindEvents = function(lc, canvas, panWithKeyboard) {
  var listener, mouseMoveListener, mouseUpListener, touchEndListener, touchMoveListener, unsubs;
  if (panWithKeyboard == null) {
    panWithKeyboard = false;
  }
  unsubs = [];
  mouseMoveListener = (function(_this) {
    return function(e) {
      var p;
      e.preventDefault();
      p = position(canvas, e);
      return lc.pointerMove(p.left, p.top);
    };
  })(this);
  mouseUpListener = (function(_this) {
    return function(e) {
      var p;
      e.preventDefault();
      canvas.onselectstart = function() {
        return true;
      };
      p = position(canvas, e);
      lc.pointerUp(p.left, p.top);
      document.removeEventListener('mousemove', mouseMoveListener);
      document.removeEventListener('mouseup', mouseUpListener);
      return canvas.addEventListener('mousemove', mouseMoveListener);
    };
  })(this);
  canvas.addEventListener('mousedown', (function(_this) {
    return function(e) {
      var down, p;
      if (e.target.tagName.toLowerCase() !== 'canvas') {
        return;
      }
      down = true;
      e.preventDefault();
      canvas.onselectstart = function() {
        return false;
      };
      p = position(canvas, e);
      lc.pointerDown(p.left, p.top);
      canvas.removeEventListener('mousemove', mouseMoveListener);
      document.addEventListener('mousemove', mouseMoveListener);
      return document.addEventListener('mouseup', mouseUpListener);
    };
  })(this));
  touchMoveListener = function(e) {
    e.preventDefault();
    return lc.pointerMove.apply(lc, coordsForTouchEvent(canvas, e));
  };
  touchEndListener = function(e) {
    e.preventDefault();
    lc.pointerUp.apply(lc, coordsForTouchEvent(canvas, e));
    document.removeEventListener('touchmove', touchMoveListener);
    document.removeEventListener('touchend', touchEndListener);
    return document.removeEventListener('touchcancel', touchEndListener);
  };
  canvas.addEventListener('touchstart', function(e) {
    if (e.target.tagName.toLowerCase() !== 'canvas') {
      return;
    }
    e.preventDefault();
    if (e.touches.length === 1) {
      lc.pointerDown.apply(lc, coordsForTouchEvent(canvas, e));
      document.addEventListener('touchmove', touchMoveListener);
      document.addEventListener('touchend', touchEndListener);
      return document.addEventListener('touchcancel', touchEndListener);
    } else {
      return lc.pointerMove.apply(lc, coordsForTouchEvent(canvas, e));
    }
  });
  if (panWithKeyboard) {
    console.warn("Keyboard panning is deprecated.");
    listener = function(e) {
      switch (e.keyCode) {
        case 37:
          lc.pan(-10, 0);
          break;
        case 38:
          lc.pan(0, -10);
          break;
        case 39:
          lc.pan(10, 0);
          break;
        case 40:
          lc.pan(0, 10);
      }
      return lc.repaintAllLayers();
    };
    document.addEventListener('keydown', listener);
    unsubs.push(function() {
      return document.removeEventListener(listener);
    });
  }
  return function() {
    var f, i, len, results;
    results = [];
    for (i = 0, len = unsubs.length; i < len; i++) {
      f = unsubs[i];
      results.push(f());
    }
    return results;
  };
};


},{}],7:[function(require,module,exports){
var _drawRawLinePath, defineCanvasRenderer, drawErasedLinePath, drawErasedLinePathLatest, drawLinePath, drawLinePathLatest, lineEndCapShapes, noop, renderShapeToCanvas, renderShapeToContext, renderers;

lineEndCapShapes = require('./lineEndCapShapes');

renderers = {};

defineCanvasRenderer = function(shapeName, drawFunc, drawLatestFunc) {
  return renderers[shapeName] = {
    drawFunc: drawFunc,
    drawLatestFunc: drawLatestFunc
  };
};

noop = function() {};

renderShapeToContext = function(ctx, shape, opts) {
  var bufferCtx;
  if (opts == null) {
    opts = {};
  }
  if (opts.shouldIgnoreUnsupportedShapes == null) {
    opts.shouldIgnoreUnsupportedShapes = false;
  }
  if (opts.retryCallback == null) {
    opts.retryCallback = noop;
  }
  if (opts.shouldOnlyDrawLatest == null) {
    opts.shouldOnlyDrawLatest = false;
  }
  if (opts.bufferCtx == null) {
    opts.bufferCtx = null;
  }
  bufferCtx = opts.bufferCtx;
  if (renderers[shape.className]) {
    if (opts.shouldOnlyDrawLatest && renderers[shape.className].drawLatestFunc) {
      return renderers[shape.className].drawLatestFunc(ctx, bufferCtx, shape, opts.retryCallback);
    } else {
      return renderers[shape.className].drawFunc(ctx, shape, opts.retryCallback);
    }
  } else if (opts.shouldIgnoreUnsupportedShapes) {
    return console.warn("Can't render shape of type " + shape.className + " to canvas");
  } else {
    throw "Can't render shape of type " + shape.className + " to canvas";
  }
};

renderShapeToCanvas = function(canvas, shape, opts) {
  return renderShapeToContext(canvas.getContext('2d'), shape, opts);
};

defineCanvasRenderer('Rectangle', function(ctx, shape) {
  var x, y;
  x = shape.x;
  y = shape.y;
  if (shape.strokeWidth % 2 !== 0) {
    x += 0.5;
    y += 0.5;
  }
  ctx.fillStyle = shape.fillColor;
  ctx.fillRect(x, y, shape.width, shape.height);
  ctx.lineWidth = shape.strokeWidth;
  ctx.strokeStyle = shape.strokeColor;
  return ctx.strokeRect(x, y, shape.width, shape.height);
});

defineCanvasRenderer('Ellipse', function(ctx, shape) {
  var centerX, centerY, halfHeight, halfWidth;
  ctx.save();
  halfWidth = Math.floor(shape.width / 2);
  halfHeight = Math.floor(shape.height / 2);
  centerX = shape.x + halfWidth;
  centerY = shape.y + halfHeight;
  ctx.translate(centerX, centerY);
  ctx.scale(1, Math.abs(shape.height / shape.width));
  ctx.beginPath();
  ctx.arc(0, 0, Math.abs(halfWidth), 0, Math.PI * 2);
  ctx.closePath();
  ctx.restore();
  ctx.fillStyle = shape.fillColor;
  ctx.fill();
  ctx.lineWidth = shape.strokeWidth;
  ctx.strokeStyle = shape.strokeColor;
  return ctx.stroke();
});

defineCanvasRenderer('SelectionBox', (function() {
  var _drawHandle;
  _drawHandle = function(ctx, arg, handleSize) {
    var x, y;
    x = arg.x, y = arg.y;
    if (handleSize === 0) {
      return;
    }
    ctx.fillStyle = '#fff';
    ctx.fillRect(x, y, handleSize, handleSize);
    ctx.strokeStyle = '#000';
    return ctx.strokeRect(x, y, handleSize, handleSize);
  };
  return function(ctx, shape) {
    _drawHandle(ctx, shape.getTopLeftHandleRect(), shape.handleSize);
    _drawHandle(ctx, shape.getTopRightHandleRect(), shape.handleSize);
    _drawHandle(ctx, shape.getBottomLeftHandleRect(), shape.handleSize);
    _drawHandle(ctx, shape.getBottomRightHandleRect(), shape.handleSize);
    if (shape.backgroundColor) {
      ctx.fillStyle = shape.backgroundColor;
      ctx.fillRect(shape._br.x - shape.margin, shape._br.y - shape.margin, shape._br.width + shape.margin * 2, shape._br.height + shape.margin * 2);
    }
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#000';
    ctx.setLineDash([2, 4]);
    ctx.strokeRect(shape._br.x - shape.margin, shape._br.y - shape.margin, shape._br.width + shape.margin * 2, shape._br.height + shape.margin * 2);
    return ctx.setLineDash([]);
  };
})());

defineCanvasRenderer('Image', function(ctx, shape, retryCallback) {
  if (shape.image.width) {
    if (shape.scale === 1) {
      return ctx.drawImage(shape.image, shape.x, shape.y);
    } else {
      return ctx.drawImage(shape.image, shape.x, shape.y, shape.image.width * shape.scale, shape.image.height * shape.scale);
    }
  } else if (retryCallback) {
    return shape.image.onload = retryCallback;
  }
});

defineCanvasRenderer('Line', function(ctx, shape) {
  var arrowWidth, x1, x2, y1, y2;
  if (shape.x1 === shape.x2 && shape.y1 === shape.y2) {
    return;
  }
  x1 = shape.x1;
  x2 = shape.x2;
  y1 = shape.y1;
  y2 = shape.y2;
  if (shape.strokeWidth % 2 !== 0) {
    x1 += 0.5;
    x2 += 0.5;
    y1 += 0.5;
    y2 += 0.5;
  }
  ctx.lineWidth = shape.strokeWidth;
  ctx.strokeStyle = shape.color;
  ctx.lineCap = shape.capStyle;
  if (shape.dash) {
    ctx.setLineDash(shape.dash);
  }
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  if (shape.dash) {
    ctx.setLineDash([]);
  }
  arrowWidth = Math.max(shape.strokeWidth * 2.2, 5);
  if (shape.endCapShapes[0]) {
    lineEndCapShapes[shape.endCapShapes[0]].drawToCanvas(ctx, x1, y1, Math.atan2(y1 - y2, x1 - x2), arrowWidth, shape.color);
  }
  if (shape.endCapShapes[1]) {
    return lineEndCapShapes[shape.endCapShapes[1]].drawToCanvas(ctx, x2, y2, Math.atan2(y2 - y1, x2 - x1), arrowWidth, shape.color);
  }
});

_drawRawLinePath = function(ctx, points, close, lineCap) {
  var i, len, point, ref;
  if (close == null) {
    close = false;
  }
  if (lineCap == null) {
    lineCap = 'round';
  }
  if (!points.length) {
    return;
  }
  ctx.lineCap = lineCap;
  ctx.strokeStyle = points[0].color;
  ctx.lineWidth = points[0].size;
  ctx.beginPath();
  if (points[0].size % 2 === 0) {
    ctx.moveTo(points[0].x, points[0].y);
  } else {
    ctx.moveTo(points[0].x + 0.5, points[0].y + 0.5);
  }
  ref = points.slice(1);
  for (i = 0, len = ref.length; i < len; i++) {
    point = ref[i];
    if (points[0].size % 2 === 0) {
      ctx.lineTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x + 0.5, point.y + 0.5);
    }
  }
  if (close) {
    return ctx.closePath();
  }
};

drawLinePath = function(ctx, shape) {
  _drawRawLinePath(ctx, shape.smoothedPoints);
  return ctx.stroke();
};

drawLinePathLatest = function(ctx, bufferCtx, shape) {
  var drawEnd, drawStart, segmentStart;
  if (shape.tail) {
    segmentStart = shape.smoothedPoints.length - shape.segmentSize * shape.tailSize;
    drawStart = segmentStart < shape.segmentSize * 2 ? 0 : segmentStart;
    drawEnd = segmentStart + shape.segmentSize + 1;
    _drawRawLinePath(bufferCtx, shape.smoothedPoints.slice(drawStart, drawEnd));
    return bufferCtx.stroke();
  } else {
    _drawRawLinePath(bufferCtx, shape.smoothedPoints);
    return bufferCtx.stroke();
  }
};

defineCanvasRenderer('LinePath', drawLinePath, drawLinePathLatest);

drawErasedLinePath = function(ctx, shape) {
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  drawLinePath(ctx, shape);
  return ctx.restore();
};

drawErasedLinePathLatest = function(ctx, bufferCtx, shape) {
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  bufferCtx.save();
  bufferCtx.globalCompositeOperation = "destination-out";
  drawLinePathLatest(ctx, bufferCtx, shape);
  ctx.restore();
  return bufferCtx.restore();
};

defineCanvasRenderer('ErasedLinePath', drawErasedLinePath, drawErasedLinePathLatest);

defineCanvasRenderer('Text', function(ctx, shape) {
  if (!shape.renderer) {
    shape._makeRenderer(ctx);
  }
  ctx.fillStyle = shape.color;
  return shape.renderer.draw(ctx, shape.x, shape.y);
});

defineCanvasRenderer('Polygon', function(ctx, shape) {
  ctx.fillStyle = shape.fillColor;
  _drawRawLinePath(ctx, shape.points, shape.isClosed, 'butt');
  ctx.fill();
  return ctx.stroke();
});

module.exports = {
  defineCanvasRenderer: defineCanvasRenderer,
  renderShapeToCanvas: renderShapeToCanvas,
  renderShapeToContext: renderShapeToContext
};


},{"./lineEndCapShapes":10}],8:[function(require,module,exports){
'use strict';

module.exports = {
  imageURLPrefix: 'lib/img',
  primaryColor: 'hsla(0, 0%, 0%, 1)',
  secondaryColor: 'hsla(0, 0%, 100%, 1)',
  backgroundColor: 'transparent',
  strokeWidths: [1, 2, 5, 10, 20, 30],
  defaultStrokeWidth: 5,
  toolbarPosition: 'top',
  keyboardShortcuts: false,
  imageSize: { width: 'infinite', height: 'infinite' },
  backgroundShapes: [],
  watermarkImage: null,
  watermarkScale: 1,
  zoomMin: 0.2,
  zoomMax: 4.0,
  zoomStep: 0.2,
  snapshot: null,
  onInit: function onInit() {},
  tools: [require('../tools/Pencil'), require('../tools/Eraser'), require('../tools/Line'), require('../tools/Rectangle'), require('../tools/Ellipse'), require('../tools/Text'), require('../tools/Polygon'), require('../tools/Pan'), require('../tools/Eyedropper')]
};

},{"../tools/Ellipse":43,"../tools/Eraser":44,"../tools/Eyedropper":45,"../tools/Line":46,"../tools/Pan":47,"../tools/Pencil":48,"../tools/Polygon":49,"../tools/Rectangle":50,"../tools/Text":52}],9:[function(require,module,exports){
"use strict";

/**
  This library rewrites the Canvas2D "measureText" function
  so that it returns a more complete metrics object.
  This library is licensed under the MIT (Expat) license,
  the text for which is included below.

** -----------------------------------------------------------------------------

  CHANGELOG:

    2012-01-21 - Whitespace handling added by Joe Turner
                 (https://github.com/oampo)

    2015-06-08 - Various hacks added by Steve Johnson

** -----------------------------------------------------------------------------

  Copyright (C) 2011 by Mike "Pomax" Kamermans

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.
**/
(function () {
  var NAME = "FontMetrics Library";
  var VERSION = "1-2012.0121.1300";

  var entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };

  function escapeHTML(string) {
    return String(string).replace(/[&<>"'`=\/]/g, function (s) {
      return entityMap[s];
    });
  }

  // if there is no getComputedStyle, this library won't work.
  if (!document.defaultView.getComputedStyle) {
    throw "ERROR: 'document.defaultView.getComputedStyle' not found. This library only works in browsers that can report computed CSS values.";
  }

  // store the old text metrics function on the Canvas2D prototype
  CanvasRenderingContext2D.prototype.measureTextWidth = CanvasRenderingContext2D.prototype.measureText;

  /**
   *  shortcut function for getting computed CSS values
   */
  var getCSSValue = function getCSSValue(element, property) {
    return document.defaultView.getComputedStyle(element, null).getPropertyValue(property);
  };

  // debug function
  var show = function show(canvas, ctx, xstart, w, h, metrics) {
    document.body.appendChild(canvas);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';

    ctx.beginPath();
    ctx.moveTo(xstart, 0);
    ctx.lineTo(xstart, h);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(xstart + metrics.bounds.maxx, 0);
    ctx.lineTo(xstart + metrics.bounds.maxx, h);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, h / 2 - metrics.ascent);
    ctx.lineTo(w, h / 2 - metrics.ascent);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, h / 2 + metrics.descent);
    ctx.lineTo(w, h / 2 + metrics.descent);
    ctx.closePath();
    ctx.stroke();
  };

  /**
   * The new text metrics function
   */
  CanvasRenderingContext2D.prototype.measureText2 = function (textstring, fontSize, fontString) {
    var metrics = this.measureTextWidth(textstring),
        isSpace = !/\S/.test(textstring);
    metrics.fontsize = fontSize;

    // for text lead values, we meaure a multiline text container.
    var leadDiv = document.createElement("div");
    leadDiv.style.position = "absolute";
    leadDiv.style.opacity = 0;
    leadDiv.style.font = fontString;
    leadDiv.innerHTML = escapeHTML(textstring) + "<br/>" + escapeHTML(textstring);
    document.body.appendChild(leadDiv);

    // make some initial guess at the text leading (using the standard TeX ratio)
    metrics.leading = 1.2 * fontSize;

    // then we try to get the real value from the browser
    var leadDivHeight = getCSSValue(leadDiv, "height");
    leadDivHeight = leadDivHeight.replace("px", "");
    if (leadDivHeight >= fontSize * 2) {
      metrics.leading = leadDivHeight / 2 | 0;
    }
    document.body.removeChild(leadDiv);

    // if we're not dealing with white space, we can compute metrics
    if (!isSpace) {
      // Have characters, so measure the text
      var canvas = document.createElement("canvas");
      var padding = 100;
      canvas.width = metrics.width + padding;
      canvas.height = 3 * fontSize;
      canvas.style.opacity = 1;
      canvas.style.font = fontString;
      var ctx = canvas.getContext("2d");
      ctx.font = fontString;

      var w = canvas.width,
          h = canvas.height,
          baseline = h / 2;

      // Set all canvas pixeldata values to 255, with all the content
      // data being 0. This lets us scan for data[i] != 255.
      ctx.fillStyle = "white";
      ctx.fillRect(-1, -1, w + 2, h + 2);
      ctx.fillStyle = "black";
      ctx.fillText(textstring, padding / 2, baseline);
      var pixelData = ctx.getImageData(0, 0, w, h).data;

      // canvas pixel data is w*4 by h*4, because R, G, B and A are separate,
      // consecutive values in the array, rather than stored as 32 bit ints.
      var i = 0,
          w4 = w * 4,
          len = pixelData.length;

      // Finding the ascent uses a normal, forward scanline
      while (++i < len && pixelData[i] === 255) {}
      var ascent = i / w4 | 0;

      // Finding the descent uses a reverse scanline
      i = len - 1;
      while (--i > 0 && pixelData[i] === 255) {}
      var descent = i / w4 | 0;

      // find the min-x coordinate
      for (i = 0; i < len && pixelData[i] === 255;) {
        i += w4;
        if (i >= len) {
          i = i - len + 4;
        }
      }
      var minx = i % w4 / 4 | 0;

      // find the max-x coordinate
      var step = 1;
      for (i = len - 3; i >= 0 && pixelData[i] === 255;) {
        i -= w4;
        if (i < 0) {
          i = len - 3 - step++ * 4;
        }
      }
      var maxx = i % w4 / 4 + 1 | 0;

      // set font metrics
      metrics.ascent = baseline - ascent;
      metrics.descent = descent - baseline;
      metrics.bounds = { minx: minx - padding / 2,
        maxx: maxx - padding / 2,
        miny: 0,
        maxy: descent - ascent };
      metrics.height = 1 + (descent - ascent);
    }

    // if we ARE dealing with whitespace, most values will just be zero.
    else {
        // Only whitespace, so we can't measure the text
        metrics.ascent = 0;
        metrics.descent = 0;
        metrics.bounds = { minx: 0,
          maxx: metrics.width, // Best guess
          miny: 0,
          maxy: 0 };
        metrics.height = 0;
      }
    return metrics;
  };
})();

},{}],10:[function(require,module,exports){
module.exports = {
  arrow: (function() {
    var getPoints;
    getPoints = function(x, y, angle, width, length) {
      return [
        {
          x: x + Math.cos(angle + Math.PI / 2) * width / 2,
          y: y + Math.sin(angle + Math.PI / 2) * width / 2
        }, {
          x: x + Math.cos(angle) * length,
          y: y + Math.sin(angle) * length
        }, {
          x: x + Math.cos(angle - Math.PI / 2) * width / 2,
          y: y + Math.sin(angle - Math.PI / 2) * width / 2
        }
      ];
    };
    return {
      drawToCanvas: function(ctx, x, y, angle, width, color, length) {
        var points;
        if (length == null) {
          length = 0;
        }
        length = length || width;
        ctx.fillStyle = color;
        ctx.lineWidth = 0;
        ctx.strokeStyle = 'transparent';
        ctx.beginPath();
        points = getPoints(x, y, angle, width, length);
        ctx.moveTo(points[0].x, points[0].y);
        ctx.lineTo(points[1].x, points[1].y);
        ctx.lineTo(points[2].x, points[2].y);
        return ctx.fill();
      },
      svg: function(x, y, angle, width, color, length) {
        var points;
        if (length == null) {
          length = 0;
        }
        length = length || width;
        points = getPoints(x, y, angle, width, length);
        return "<polygon fill='" + color + "' stroke='none' points='" + (points.map(function(p) {
          return p.x + "," + p.y;
        })) + "' />";
      }
    };
  })()
};


},{}],11:[function(require,module,exports){
var _, localize, strings;

strings = {};

localize = function(localStrings) {
  return strings = localStrings;
};

_ = function(string) {
  var translation;
  translation = strings[string];
  return translation || string;
};

module.exports = {
  localize: localize,
  _: _
};


},{}],12:[function(require,module,exports){
var Point, _slope, math, normals, unit, util;

Point = require('./shapes').Point;

util = require('./util');

math = {};

math.toPoly = function(line) {
  var i, index, len, n, point, polyLeft, polyRight;
  polyLeft = [];
  polyRight = [];
  index = 0;
  for (i = 0, len = line.length; i < len; i++) {
    point = line[i];
    n = normals(point, _slope(line, index));
    polyLeft = polyLeft.concat([n[0]]);
    polyRight = [n[1]].concat(polyRight);
    index += 1;
  }
  return polyLeft.concat(polyRight);
};

_slope = function(line, index) {
  var point;
  if (line.length < 3) {
    point = {
      x: 0,
      y: 0
    };
  }
  if (index === 0) {
    point = _slope(line, index + 1);
  } else if (index === line.length - 1) {
    point = _slope(line, index - 1);
  } else {
    point = math.diff(line[index - 1], line[index + 1]);
  }
  return point;
};

math.diff = function(a, b) {
  return {
    x: b.x - a.x,
    y: b.y - a.y
  };
};

unit = function(vector) {
  var length;
  length = math.len(vector);
  return {
    x: vector.x / length,
    y: vector.y / length
  };
};

normals = function(p, slope) {
  slope = unit(slope);
  slope.x = slope.x * p.size / 2;
  slope.y = slope.y * p.size / 2;
  return [
    {
      x: p.x - slope.y,
      y: p.y + slope.x,
      color: p.color
    }, {
      x: p.x + slope.y,
      y: p.y - slope.x,
      color: p.color
    }
  ];
};

math.len = function(vector) {
  return Math.sqrt(Math.pow(vector.x, 2) + Math.pow(vector.y, 2));
};

math.scalePositionScalar = function(val, viewportSize, oldScale, newScale) {
  var newSize, oldSize;
  oldSize = viewportSize * oldScale;
  newSize = viewportSize * newScale;
  return val + (oldSize - newSize) / 2;
};

module.exports = math;


},{"./shapes":15,"./util":17}],13:[function(require,module,exports){
var INFINITE, JSONToShape, renderWatermark, util;

util = require('./util');

JSONToShape = require('./shapes').JSONToShape;

INFINITE = 'infinite';

renderWatermark = function(ctx, image, scale) {
  if (!image.width) {
    return;
  }
  ctx.save();
  ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
  ctx.scale(scale, scale);
  ctx.drawImage(image, -image.width / 2, -image.height / 2);
  return ctx.restore();
};

module.exports = function(snapshot, opts) {
  var allShapes, backgroundShapes, colors, imageSize, s, shapes, watermarkCanvas, watermarkCtx;
  if (opts == null) {
    opts = {};
  }
  if (opts.scale == null) {
    opts.scale = 1;
  }
  shapes = (function() {
    var i, len, ref, results;
    ref = snapshot.shapes;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      s = ref[i];
      results.push(JSONToShape(s));
    }
    return results;
  })();
  backgroundShapes = [];
  if (snapshot.backgroundShapes) {
    backgroundShapes = (function() {
      var i, len, ref, results;
      ref = snapshot.backgroundShapes;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        s = ref[i];
        results.push(JSONToShape(s));
      }
      return results;
    })();
  }
  if (opts.margin == null) {
    opts.margin = {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    };
  }
  imageSize = snapshot.imageSize || {
    width: INFINITE,
    height: INFINITE
  };
  colors = snapshot.colors || {
    background: 'transparent'
  };
  allShapes = shapes.concat(backgroundShapes);
  watermarkCanvas = document.createElement('canvas');
  watermarkCtx = watermarkCanvas.getContext('2d');
  if (opts.rect) {
    opts.rect.x -= opts.margin.left;
    opts.rect.y -= opts.margin.top;
    opts.rect.width += opts.margin.left + opts.margin.right;
    opts.rect.height += opts.margin.top + opts.margin.bottom;
  } else {
    opts.rect = util.getDefaultImageRect((function() {
      var i, len, results;
      results = [];
      for (i = 0, len = allShapes.length; i < len; i++) {
        s = allShapes[i];
        results.push(s.getBoundingRect(watermarkCtx));
      }
      return results;
    })(), imageSize, opts.margin);
  }
  watermarkCanvas.width = opts.rect.width * opts.scale;
  watermarkCanvas.height = opts.rect.height * opts.scale;
  watermarkCtx.fillStyle = colors.background;
  watermarkCtx.fillRect(0, 0, watermarkCanvas.width, watermarkCanvas.height);
  if (!(opts.rect.width && opts.rect.height)) {
    return null;
  }
  if (opts.watermarkImage) {
    renderWatermark(watermarkCtx, opts.watermarkImage, opts.watermarkScale);
  }
  return util.combineCanvases(watermarkCanvas, util.renderShapes(backgroundShapes, opts.rect, opts.scale), util.renderShapes(shapes, opts.rect, opts.scale));
};


},{"./shapes":15,"./util":17}],14:[function(require,module,exports){
var INFINITE, JSONToShape, util;

util = require('./util');

JSONToShape = require('./shapes').JSONToShape;

INFINITE = 'infinite';

module.exports = function(snapshot, opts) {
  var allShapes, backgroundShapes, colors, ctx, dummyCanvas, imageSize, s, shapes;
  if (opts == null) {
    opts = {};
  }
  shapes = (function() {
    var i, len, ref, results;
    ref = snapshot.shapes;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      s = ref[i];
      results.push(JSONToShape(s));
    }
    return results;
  })();
  backgroundShapes = [];
  if (snapshot.backgroundShapes) {
    backgroundShapes = (function() {
      var i, len, ref, results;
      ref = snapshot.backgroundShapes;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        s = ref[i];
        results.push(JSONToShape(s));
      }
      return results;
    })();
  }
  if (opts.margin == null) {
    opts.margin = {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    };
  }
  imageSize = snapshot.imageSize || {
    width: INFINITE,
    height: INFINITE
  };
  colors = snapshot.colors || {
    background: 'transparent'
  };
  allShapes = shapes.concat(backgroundShapes);
  dummyCanvas = document.createElement('canvas');
  ctx = dummyCanvas.getContext('2d');
  if (opts.rect) {
    opts.rect.x -= opts.margin.left;
    opts.rect.y -= opts.margin.top;
    opts.rect.width += opts.margin.left + opts.margin.right;
    opts.rect.height += opts.margin.top + opts.margin.bottom;
  } else {
    opts.rect = util.getDefaultImageRect((function() {
      var i, len, results;
      results = [];
      for (i = 0, len = allShapes.length; i < len; i++) {
        s = allShapes[i];
        results.push(s.getBoundingRect(ctx));
      }
      return results;
    })(), imageSize, opts.margin);
  }
  return util.renderShapesToSVG(backgroundShapes.concat(shapes), opts.rect, colors.background);
};


},{"./shapes":15,"./util":17}],15:[function(require,module,exports){
var JSONToShape, LinePath, TextRenderer, _createLinePathFromData, _doAllPointsShareStyle, _dual, _mid, _refine, bspline, createShape, defineCanvasRenderer, defineSVGRenderer, defineShape, lineEndCapShapes, linePathFuncs, ref, ref1, renderShapeToContext, renderShapeToSVG, shapeToJSON, shapes, util;

util = require('./util');

TextRenderer = require('./TextRenderer');

lineEndCapShapes = require('./lineEndCapShapes');

ref = require('./canvasRenderer'), defineCanvasRenderer = ref.defineCanvasRenderer, renderShapeToContext = ref.renderShapeToContext;

ref1 = require('./svgRenderer'), defineSVGRenderer = ref1.defineSVGRenderer, renderShapeToSVG = ref1.renderShapeToSVG;

shapes = {};

defineShape = function(name, props) {
  var Shape, drawFunc, drawLatestFunc, k, legacyDrawFunc, legacyDrawLatestFunc, legacySVGFunc, svgFunc;
  Shape = function(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    props.constructor.call(this, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
    return this;
  };
  Shape.prototype.className = name;
  Shape.fromJSON = props.fromJSON;
  if (props.draw) {
    legacyDrawFunc = props.draw;
    legacyDrawLatestFunc = props.draw || function(ctx, bufferCtx, retryCallback) {
      return this.draw(ctx, bufferCtx, retryCallback);
    };
    drawFunc = function(ctx, shape, retryCallback) {
      return legacyDrawFunc.call(shape, ctx, retryCallback);
    };
    drawLatestFunc = function(ctx, bufferCtx, shape, retryCallback) {
      return legacyDrawLatestFunc.call(shape, ctx, bufferCtx, retryCallback);
    };
    delete props.draw;
    if (props.drawLatest) {
      delete props.drawLatest;
    }
    defineCanvasRenderer(name, drawFunc, drawLatestFunc);
  }
  if (props.toSVG) {
    legacySVGFunc = props.toSVG;
    svgFunc = function(shape) {
      return legacySVGFunc.call(shape);
    };
    delete props.toSVG;
    defineSVGRenderer(name, svgFunc);
  }
  Shape.prototype.draw = function(ctx, retryCallback) {
    return renderShapeToContext(ctx, this, {
      retryCallback: retryCallback
    });
  };
  Shape.prototype.drawLatest = function(ctx, bufferCtx, retryCallback) {
    return renderShapeToContext(ctx, this, {
      retryCallback: retryCallback,
      bufferCtx: bufferCtx,
      shouldOnlyDrawLatest: true
    });
  };
  Shape.prototype.toSVG = function() {
    return renderShapeToSVG(this);
  };
  for (k in props) {
    if (k !== 'fromJSON') {
      Shape.prototype[k] = props[k];
    }
  }
  shapes[name] = Shape;
  return Shape;
};

createShape = function(name, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
  var s;
  s = new shapes[name](a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
  s.id = util.getGUID();
  return s;
};

JSONToShape = function(arg) {
  var className, data, id, shape;
  className = arg.className, data = arg.data, id = arg.id;
  if (className in shapes) {
    shape = shapes[className].fromJSON(data);
    if (shape) {
      if (id) {
        shape.id = id;
      }
      return shape;
    } else {
      console.log('Unreadable shape:', className, data);
      return null;
    }
  } else {
    console.log("Unknown shape:", className, data);
    return null;
  }
};

shapeToJSON = function(shape) {
  return {
    className: shape.className,
    data: shape.toJSON(),
    id: shape.id
  };
};

bspline = function(points, order) {
  if (!order) {
    return points;
  }
  return bspline(_dual(_dual(_refine(points))), order - 1);
};

_refine = function(points) {
  var index, len, point, q, refined;
  points = [points[0]].concat(points).concat(util.last(points));
  refined = [];
  index = 0;
  for (q = 0, len = points.length; q < len; q++) {
    point = points[q];
    refined[index * 2] = point;
    if (points[index + 1]) {
      refined[index * 2 + 1] = _mid(point, points[index + 1]);
    }
    index += 1;
  }
  return refined;
};

_dual = function(points) {
  var dualed, index, len, point, q;
  dualed = [];
  index = 0;
  for (q = 0, len = points.length; q < len; q++) {
    point = points[q];
    if (points[index + 1]) {
      dualed[index] = _mid(point, points[index + 1]);
    }
    index += 1;
  }
  return dualed;
};

_mid = function(a, b) {
  return createShape('Point', {
    x: a.x + ((b.x - a.x) / 2),
    y: a.y + ((b.y - a.y) / 2),
    size: a.size + ((b.size - a.size) / 2),
    color: a.color
  });
};

defineShape('Image', {
  constructor: function(args) {
    if (args == null) {
      args = {};
    }
    this.x = args.x || 0;
    this.y = args.y || 0;
    this.scale = args.scale || 1;
    return this.image = args.image || null;
  },
  getBoundingRect: function() {
    return {
      x: this.x,
      y: this.y,
      width: this.image.width * this.scale,
      height: this.image.height * this.scale
    };
  },
  toJSON: function() {
    return {
      x: this.x,
      y: this.y,
      imageSrc: this.image.src,
      imageObject: this.image,
      scale: this.scale
    };
  },
  fromJSON: function(data) {
    var img, ref2;
    img = null;
    if ((ref2 = data.imageObject) != null ? ref2.width : void 0) {
      img = data.imageObject;
    } else {
      img = new Image();
      img.src = data.imageSrc;
    }
    return createShape('Image', {
      x: data.x,
      y: data.y,
      image: img,
      scale: data.scale
    });
  },
  move: function(moveInfo) {
    if (moveInfo == null) {
      moveInfo = {};
    }
    this.x = this.x - moveInfo.xDiff;
    return this.y = this.y - moveInfo.yDiff;
  },
  setUpperLeft: function(upperLeft) {
    if (upperLeft == null) {
      upperLeft = {};
    }
    this.x = upperLeft.x;
    return this.y = upperLeft.y;
  }
});

defineShape('Rectangle', {
  constructor: function(args) {
    if (args == null) {
      args = {};
    }
    this.x = args.x || 0;
    this.y = args.y || 0;
    this.width = args.width || 0;
    this.height = args.height || 0;
    this.strokeWidth = args.strokeWidth || 1;
    this.strokeColor = args.strokeColor || 'black';
    return this.fillColor = args.fillColor || 'transparent';
  },
  getBoundingRect: function() {
    return {
      x: this.x - this.strokeWidth / 2,
      y: this.y - this.strokeWidth / 2,
      width: this.width + this.strokeWidth,
      height: this.height + this.strokeWidth
    };
  },
  toJSON: function() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      strokeWidth: this.strokeWidth,
      strokeColor: this.strokeColor,
      fillColor: this.fillColor
    };
  },
  fromJSON: function(data) {
    return createShape('Rectangle', data);
  },
  move: function(moveInfo) {
    if (moveInfo == null) {
      moveInfo = {};
    }
    this.x = this.x - moveInfo.xDiff;
    return this.y = this.y - moveInfo.yDiff;
  },
  setUpperLeft: function(upperLeft) {
    if (upperLeft == null) {
      upperLeft = {};
    }
    this.x = upperLeft.x;
    return this.y = upperLeft.y;
  }
});

defineShape('Ellipse', {
  constructor: function(args) {
    if (args == null) {
      args = {};
    }
    this.x = args.x || 0;
    this.y = args.y || 0;
    this.width = args.width || 0;
    this.height = args.height || 0;
    this.strokeWidth = args.strokeWidth || 1;
    this.strokeColor = args.strokeColor || 'black';
    return this.fillColor = args.fillColor || 'transparent';
  },
  getBoundingRect: function() {
    return {
      x: this.x - this.strokeWidth / 2,
      y: this.y - this.strokeWidth / 2,
      width: this.width + this.strokeWidth,
      height: this.height + this.strokeWidth
    };
  },
  toJSON: function() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      strokeWidth: this.strokeWidth,
      strokeColor: this.strokeColor,
      fillColor: this.fillColor
    };
  },
  fromJSON: function(data) {
    return createShape('Ellipse', data);
  },
  move: function(moveInfo) {
    if (moveInfo == null) {
      moveInfo = {};
    }
    this.x = this.x - moveInfo.xDiff;
    return this.y = this.y - moveInfo.yDiff;
  },
  setUpperLeft: function(upperLeft) {
    if (upperLeft == null) {
      upperLeft = {};
    }
    this.x = upperLeft.x;
    return this.y = upperLeft.y;
  }
});

defineShape('Line', {
  constructor: function(args) {
    if (args == null) {
      args = {};
    }
    this.x1 = args.x1 || 0;
    this.y1 = args.y1 || 0;
    this.x2 = args.x2 || 0;
    this.y2 = args.y2 || 0;
    this.strokeWidth = args.strokeWidth || 1;
    this.color = args.color || 'black';
    this.capStyle = args.capStyle || 'round';
    this.endCapShapes = args.endCapShapes || [null, null];
    return this.dash = args.dash || null;
  },
  getBoundingRect: function() {
    return {
      x: Math.min(this.x1, this.x2) - this.strokeWidth / 2,
      y: Math.min(this.y1, this.y2) - this.strokeWidth / 2,
      width: Math.abs(this.x2 - this.x1) + this.strokeWidth / 2,
      height: Math.abs(this.y2 - this.y1) + this.strokeWidth / 2
    };
  },
  toJSON: function() {
    return {
      x1: this.x1,
      y1: this.y1,
      x2: this.x2,
      y2: this.y2,
      strokeWidth: this.strokeWidth,
      color: this.color,
      capStyle: this.capStyle,
      dash: this.dash,
      endCapShapes: this.endCapShapes
    };
  },
  fromJSON: function(data) {
    return createShape('Line', data);
  },
  move: function(moveInfo) {
    if (moveInfo == null) {
      moveInfo = {};
    }
    this.x1 = this.x1 - moveInfo.xDiff;
    this.y1 = this.y1 - moveInfo.yDiff;
    this.x2 = this.x2 - moveInfo.xDiff;
    return this.y2 = this.y2 - moveInfo.yDiff;
  },
  setUpperLeft: function(upperLeft) {
    var br, xDiff, yDiff;
    if (upperLeft == null) {
      upperLeft = {};
    }
    br = this.getBoundingRect();
    xDiff = br.x - upperLeft.x;
    yDiff = br.y - upperLeft.y;
    return this.move({
      xDiff: xDiff,
      yDiff: yDiff
    });
  }
});

_doAllPointsShareStyle = function(points) {
  var color, len, point, q, size;
  if (!points.length) {
    return false;
  }
  size = points[0].size;
  color = points[0].color;
  for (q = 0, len = points.length; q < len; q++) {
    point = points[q];
    if (!(point.size === size && point.color === color)) {
      console.log(size, color, point.size, point.color);
    }
    if (!(point.size === size && point.color === color)) {
      return false;
    }
  }
  return true;
};

_createLinePathFromData = function(shapeName, data) {
  var pointData, points, smoothedPoints, x, y;
  points = null;
  if (data.points) {
    points = (function() {
      var len, q, ref2, results;
      ref2 = data.points;
      results = [];
      for (q = 0, len = ref2.length; q < len; q++) {
        pointData = ref2[q];
        results.push(JSONToShape(pointData));
      }
      return results;
    })();
  } else if (data.pointCoordinatePairs) {
    points = (function() {
      var len, q, ref2, ref3, results;
      ref2 = data.pointCoordinatePairs;
      results = [];
      for (q = 0, len = ref2.length; q < len; q++) {
        ref3 = ref2[q], x = ref3[0], y = ref3[1];
        results.push(JSONToShape({
          className: 'Point',
          data: {
            x: x,
            y: y,
            size: data.pointSize,
            color: data.pointColor,
            smooth: data.smooth
          }
        }));
      }
      return results;
    })();
  }
  smoothedPoints = null;
  if (data.smoothedPointCoordinatePairs) {
    smoothedPoints = (function() {
      var len, q, ref2, ref3, results;
      ref2 = data.smoothedPointCoordinatePairs;
      results = [];
      for (q = 0, len = ref2.length; q < len; q++) {
        ref3 = ref2[q], x = ref3[0], y = ref3[1];
        results.push(JSONToShape({
          className: 'Point',
          data: {
            x: x,
            y: y,
            size: data.pointSize,
            color: data.pointColor,
            smooth: data.smooth
          }
        }));
      }
      return results;
    })();
  }
  if (!points[0]) {
    return null;
  }
  return createShape(shapeName, {
    points: points,
    smoothedPoints: smoothedPoints,
    order: data.order,
    tailSize: data.tailSize,
    smooth: data.smooth
  });
};

linePathFuncs = {
  constructor: function(args) {
    var len, point, points, q, results;
    if (args == null) {
      args = {};
    }
    points = args.points || [];
    this.order = args.order || 3;
    this.tailSize = args.tailSize || 3;
    this.smooth = 'smooth' in args ? args.smooth : true;
    this.segmentSize = Math.pow(2, this.order);
    this.sampleSize = this.tailSize + 1;
    if (args.smoothedPoints) {
      this.points = args.points;
      return this.smoothedPoints = args.smoothedPoints;
    } else {
      this.points = [];
      results = [];
      for (q = 0, len = points.length; q < len; q++) {
        point = points[q];
        results.push(this.addPoint(point));
      }
      return results;
    }
  },
  getBoundingRect: function() {
    return util.getBoundingRect(this.points.map(function(p) {
      return {
        x: p.x - p.size / 2,
        y: p.y - p.size / 2,
        width: p.size,
        height: p.size
      };
    }));
  },
  toJSON: function() {
    var p, point;
    if (_doAllPointsShareStyle(this.points)) {
      return {
        order: this.order,
        tailSize: this.tailSize,
        smooth: this.smooth,
        pointCoordinatePairs: (function() {
          var len, q, ref2, results;
          ref2 = this.points;
          results = [];
          for (q = 0, len = ref2.length; q < len; q++) {
            point = ref2[q];
            results.push([point.x, point.y]);
          }
          return results;
        }).call(this),
        smoothedPointCoordinatePairs: (function() {
          var len, q, ref2, results;
          ref2 = this.smoothedPoints;
          results = [];
          for (q = 0, len = ref2.length; q < len; q++) {
            point = ref2[q];
            results.push([point.x, point.y]);
          }
          return results;
        }).call(this),
        pointSize: this.points[0].size,
        pointColor: this.points[0].color
      };
    } else {
      return {
        order: this.order,
        tailSize: this.tailSize,
        smooth: this.smooth,
        points: (function() {
          var len, q, ref2, results;
          ref2 = this.points;
          results = [];
          for (q = 0, len = ref2.length; q < len; q++) {
            p = ref2[q];
            results.push(shapeToJSON(p));
          }
          return results;
        }).call(this)
      };
    }
  },
  fromJSON: function(data) {
    return _createLinePathFromData('LinePath', data);
  },
  addPoint: function(point) {
    this.points.push(point);
    if (!this.smooth) {
      this.smoothedPoints = this.points;
      return;
    }
    if (!this.smoothedPoints || this.points.length < this.sampleSize) {
      return this.smoothedPoints = bspline(this.points, this.order);
    } else {
      this.tail = util.last(bspline(util.last(this.points, this.sampleSize), this.order), this.segmentSize * this.tailSize);
      return this.smoothedPoints = this.smoothedPoints.slice(0, this.smoothedPoints.length - this.segmentSize * (this.tailSize - 1)).concat(this.tail);
    }
  },
  move: function(moveInfo) {
    var len, pt, pts, q;
    if (moveInfo == null) {
      moveInfo = {};
    }
    if (!this.smooth) {
      pts = this.points;
    } else {
      pts = this.smoothedPoints;
    }
    for (q = 0, len = pts.length; q < len; q++) {
      pt = pts[q];
      pt.move(moveInfo);
    }
    return this.points = this.smoothedPoints;
  },
  setUpperLeft: function(upperLeft) {
    var br, xDiff, yDiff;
    if (upperLeft == null) {
      upperLeft = {};
    }
    br = this.getBoundingRect();
    xDiff = br.x - upperLeft.x;
    yDiff = br.y - upperLeft.y;
    return this.move({
      xDiff: xDiff,
      yDiff: yDiff
    });
  }
};

LinePath = defineShape('LinePath', linePathFuncs);

defineShape('ErasedLinePath', {
  constructor: linePathFuncs.constructor,
  toJSON: linePathFuncs.toJSON,
  addPoint: linePathFuncs.addPoint,
  getBoundingRect: linePathFuncs.getBoundingRect,
  fromJSON: function(data) {
    return _createLinePathFromData('ErasedLinePath', data);
  }
});

defineShape('Point', {
  constructor: function(args) {
    if (args == null) {
      args = {};
    }
    this.x = args.x || 0;
    this.y = args.y || 0;
    this.size = args.size || 0;
    return this.color = args.color || '';
  },
  getBoundingRect: function() {
    return {
      x: this.x - this.size / 2,
      y: this.y - this.size / 2,
      width: this.size,
      height: this.size
    };
  },
  toJSON: function() {
    return {
      x: this.x,
      y: this.y,
      size: this.size,
      color: this.color
    };
  },
  fromJSON: function(data) {
    return createShape('Point', data);
  },
  move: function(moveInfo) {
    if (moveInfo == null) {
      moveInfo = {};
    }
    this.x = this.x - moveInfo.xDiff;
    return this.y = this.y - moveInfo.yDiff;
  },
  setUpperLeft: function(upperLeft) {
    if (upperLeft == null) {
      upperLeft = {};
    }
    this.x = upperLeft.x;
    return this.y = upperLeft.y;
  }
});

defineShape('Polygon', {
  constructor: function(args) {
    var len, point, q, ref2, results;
    if (args == null) {
      args = {};
    }
    this.points = args.points;
    this.fillColor = args.fillColor || 'white';
    this.strokeColor = args.strokeColor || 'black';
    this.strokeWidth = args.strokeWidth;
    this.dash = args.dash || null;
    if (args.isClosed == null) {
      args.isClosed = true;
    }
    this.isClosed = args.isClosed;
    ref2 = this.points;
    results = [];
    for (q = 0, len = ref2.length; q < len; q++) {
      point = ref2[q];
      point.color = this.strokeColor;
      results.push(point.size = this.strokeWidth);
    }
    return results;
  },
  addPoint: function(x, y) {
    return this.points.push(LC.createShape('Point', {
      x: x,
      y: y
    }));
  },
  getBoundingRect: function() {
    return util.getBoundingRect(this.points.map(function(p) {
      return p.getBoundingRect();
    }));
  },
  toJSON: function() {
    return {
      strokeWidth: this.strokeWidth,
      fillColor: this.fillColor,
      strokeColor: this.strokeColor,
      dash: this.dash,
      isClosed: this.isClosed,
      pointCoordinatePairs: this.points.map(function(p) {
        return [p.x, p.y];
      })
    };
  },
  fromJSON: function(data) {
    data.points = data.pointCoordinatePairs.map(function(arg) {
      var x, y;
      x = arg[0], y = arg[1];
      return createShape('Point', {
        x: x,
        y: y,
        size: data.strokeWidth,
        color: data.strokeColor
      });
    });
    return createShape('Polygon', data);
  },
  move: function(moveInfo) {
    var len, pt, q, ref2, results;
    if (moveInfo == null) {
      moveInfo = {};
    }
    ref2 = this.points;
    results = [];
    for (q = 0, len = ref2.length; q < len; q++) {
      pt = ref2[q];
      results.push(pt.move(moveInfo));
    }
    return results;
  },
  setUpperLeft: function(upperLeft) {
    var br, xDiff, yDiff;
    if (upperLeft == null) {
      upperLeft = {};
    }
    br = this.getBoundingRect();
    xDiff = br.x - upperLeft.x;
    yDiff = br.y - upperLeft.y;
    return this.move({
      xDiff: xDiff,
      yDiff: yDiff
    });
  }
});

defineShape('Text', {
  constructor: function(args) {
    if (args == null) {
      args = {};
    }
    this.x = args.x || 0;
    this.y = args.y || 0;
    this.v = args.v || 0;
    this.text = args.text || '';
    this.color = args.color || 'black';
    this.font = args.font || '18px sans-serif';
    this.forcedWidth = args.forcedWidth || null;
    return this.forcedHeight = args.forcedHeight || null;
  },
  _makeRenderer: function(ctx) {
    ctx.lineHeight = 1.2;
    this.renderer = new TextRenderer(ctx, this.text, this.font, this.forcedWidth, this.forcedHeight);
    if (this.v < 1) {
      console.log('repairing baseline');
      this.v = 1;
      this.x -= this.renderer.metrics.bounds.minx;
      return this.y -= this.renderer.metrics.leading - this.renderer.metrics.descent;
    }
  },
  setText: function(text) {
    this.text = text;
    return this.renderer = null;
  },
  setFont: function(font) {
    this.font = font;
    return this.renderer = null;
  },
  setPosition: function(x, y) {
    this.x = x;
    return this.y = y;
  },
  setSize: function(forcedWidth, forcedHeight) {
    this.forcedWidth = Math.max(forcedWidth, 0);
    this.forcedHeight = Math.max(forcedHeight, 0);
    return this.renderer = null;
  },
  enforceMaxBoundingRect: function(lc) {
    var br, dx, lcBoundingRect;
    br = this.getBoundingRect(lc.ctx);
    lcBoundingRect = {
      x: -lc.position.x / lc.scale,
      y: -lc.position.y / lc.scale,
      width: lc.canvas.width / lc.scale,
      height: lc.canvas.height / lc.scale
    };
    if (br.x + br.width > lcBoundingRect.x + lcBoundingRect.width) {
      dx = br.x - lcBoundingRect.x;
      this.forcedWidth = lcBoundingRect.width - dx - 10;
      return this.renderer = null;
    }
  },
  getBoundingRect: function(ctx, isEditing) {
    if (isEditing == null) {
      isEditing = false;
    }
    if (!this.renderer) {
      if (ctx) {
        this._makeRenderer(ctx);
      } else {
        throw "Must pass ctx if text hasn't been rendered yet";
      }
    }
    return {
      x: Math.floor(this.x),
      y: Math.floor(this.y),
      width: Math.ceil(this.renderer.getWidth(true)),
      height: Math.ceil(this.renderer.getHeight())
    };
  },
  toJSON: function() {
    return {
      x: this.x,
      y: this.y,
      text: this.text,
      color: this.color,
      font: this.font,
      forcedWidth: this.forcedWidth,
      forcedHeight: this.forcedHeight,
      v: this.v
    };
  },
  fromJSON: function(data) {
    return createShape('Text', data);
  },
  move: function(moveInfo) {
    if (moveInfo == null) {
      moveInfo = {};
    }
    this.x = this.x - moveInfo.xDiff;
    return this.y = this.y - moveInfo.yDiff;
  },
  setUpperLeft: function(upperLeft) {
    if (upperLeft == null) {
      upperLeft = {};
    }
    this.x = upperLeft.x;
    return this.y = upperLeft.y;
  }
});

defineShape('SelectionBox', {
  constructor: function(args) {
    if (args == null) {
      args = {};
    }
    this.shape = args.shape;
    if (args.handleSize != null) {
      this.handleSize = args.handleSize;
    } else {
      this.handleSize = 10;
    }
    this.margin = 4;
    this.backgroundColor = args.backgroundColor || null;
    return this._br = this.shape.getBoundingRect(args.ctx);
  },
  toJSON: function() {
    return {
      shape: shapeToJSON(this.shape),
      backgroundColor: this.backgroundColor
    };
  },
  fromJSON: function(arg) {
    var backgroundColor, handleSize, margin, shape;
    shape = arg.shape, handleSize = arg.handleSize, margin = arg.margin, backgroundColor = arg.backgroundColor;
    return createShape('SelectionBox', {
      shape: JSONToShape(shape),
      backgroundColor: backgroundColor
    });
  },
  getTopLeftHandleRect: function() {
    return {
      x: this._br.x - this.handleSize - this.margin,
      y: this._br.y - this.handleSize - this.margin,
      width: this.handleSize,
      height: this.handleSize
    };
  },
  getBottomLeftHandleRect: function() {
    return {
      x: this._br.x - this.handleSize - this.margin,
      y: this._br.y + this._br.height + this.margin,
      width: this.handleSize,
      height: this.handleSize
    };
  },
  getTopRightHandleRect: function() {
    return {
      x: this._br.x + this._br.width + this.margin,
      y: this._br.y - this.handleSize - this.margin,
      width: this.handleSize,
      height: this.handleSize
    };
  },
  getBottomRightHandleRect: function() {
    return {
      x: this._br.x + this._br.width + this.margin,
      y: this._br.y + this._br.height + this.margin,
      width: this.handleSize,
      height: this.handleSize
    };
  },
  getBoundingRect: function() {
    return {
      x: this._br.x - this.margin,
      y: this._br.y - this.margin,
      width: this._br.width + this.margin * 2,
      height: this._br.height + this.margin * 2
    };
  }
});

module.exports = {
  defineShape: defineShape,
  createShape: createShape,
  JSONToShape: JSONToShape,
  shapeToJSON: shapeToJSON
};


},{"./TextRenderer":4,"./canvasRenderer":7,"./lineEndCapShapes":10,"./svgRenderer":16,"./util":17}],16:[function(require,module,exports){
var defineSVGRenderer, entityMap, escapeHTML, lineEndCapShapes, renderShapeToSVG, renderers;

lineEndCapShapes = require('./lineEndCapShapes');

renderers = {};

defineSVGRenderer = function(shapeName, shapeToSVGFunc) {
  return renderers[shapeName] = shapeToSVGFunc;
};

renderShapeToSVG = function(shape, opts) {
  if (opts == null) {
    opts = {};
  }
  if (opts.shouldIgnoreUnsupportedShapes == null) {
    opts.shouldIgnoreUnsupportedShapes = false;
  }
  if (renderers[shape.className]) {
    return renderers[shape.className](shape);
  } else if (opts.shouldIgnoreUnsupportedShapes) {
    console.warn("Can't render shape of type " + shape.className + " to SVG");
    return "";
  } else {
    throw "Can't render shape of type " + shape.className + " to SVG";
  }
};

entityMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

escapeHTML = function(string) {
  return String(string).replace(/[&<>"'`=\/]/g, function(s) {
    return entityMap[s];
  });
};

defineSVGRenderer('Rectangle', function(shape) {
  var height, width, x, x1, x2, y, y1, y2;
  x1 = shape.x;
  y1 = shape.y;
  x2 = shape.x + shape.width;
  y2 = shape.y + shape.height;
  x = Math.min(x1, x2);
  y = Math.min(y1, y2);
  width = Math.max(x1, x2) - x;
  height = Math.max(y1, y2) - y;
  if (shape.strokeWidth % 2 !== 0) {
    x += 0.5;
    y += 0.5;
  }
  return "<rect x='" + x + "' y='" + y + "' width='" + width + "' height='" + height + "' stroke='" + shape.strokeColor + "' fill='" + shape.fillColor + "' stroke-width='" + shape.strokeWidth + "' />";
});

defineSVGRenderer('SelectionBox', function(shape) {
  return "";
});

defineSVGRenderer('Ellipse', function(shape) {
  var centerX, centerY, halfHeight, halfWidth;
  halfWidth = Math.floor(shape.width / 2);
  halfHeight = Math.floor(shape.height / 2);
  centerX = shape.x + halfWidth;
  centerY = shape.y + halfHeight;
  return "<ellipse cx='" + centerX + "' cy='" + centerY + "' rx='" + (Math.abs(halfWidth)) + "' ry='" + (Math.abs(halfHeight)) + "' stroke='" + shape.strokeColor + "' fill='" + shape.fillColor + "' stroke-width='" + shape.strokeWidth + "' />";
});

defineSVGRenderer('Image', function(shape) {
  return "<image x='" + shape.x + "' y='" + shape.y + "' width='" + (shape.image.naturalWidth * shape.scale) + "' height='" + (shape.image.naturalHeight * shape.scale) + "' xlink:href='" + shape.image.src + "' />";
});

defineSVGRenderer('Line', function(shape) {
  var arrowWidth, capString, dashString, x1, x2, y1, y2;
  dashString = shape.dash ? "stroke-dasharray='" + (shape.dash.join(', ')) + "'" : '';
  capString = '';
  arrowWidth = Math.max(shape.strokeWidth * 2.2, 5);
  x1 = shape.x1;
  x2 = shape.x2;
  y1 = shape.y1;
  y2 = shape.y2;
  if (shape.strokeWidth % 2 !== 0) {
    x1 += 0.5;
    x2 += 0.5;
    y1 += 0.5;
    y2 += 0.5;
  }
  if (shape.endCapShapes[0]) {
    capString += lineEndCapShapes[shape.endCapShapes[0]].svg(x1, y1, Math.atan2(y1 - y2, x1 - x2), arrowWidth, shape.color);
  }
  if (shape.endCapShapes[1]) {
    capString += lineEndCapShapes[shape.endCapShapes[1]].svg(x2, y2, Math.atan2(y2 - y1, x2 - x1), arrowWidth, shape.color);
  }
  return "<g> <line x1='" + x1 + "' y1='" + y1 + "' x2='" + x2 + "' y2='" + y2 + "' " + dashString + " stroke-linecap='" + shape.capStyle + "' stroke='" + shape.color + "' stroke-width='" + shape.strokeWidth + "' /> " + capString + " </g>";
});

defineSVGRenderer('LinePath', function(shape) {
  return "<polyline fill='none' points='" + (shape.smoothedPoints.map(function(p) {
    var offset;
    offset = p.strokeWidth % 2 === 0 ? 0.0 : 0.5;
    return (p.x + offset) + "," + (p.y + offset);
  }).join(' ')) + "' stroke='" + shape.points[0].color + "' stroke-linecap='round' stroke-width='" + shape.points[0].size + "' />";
});

defineSVGRenderer('ErasedLinePath', function(shape) {
  return "";
});

defineSVGRenderer('Polygon', function(shape) {
  if (shape.isClosed) {
    return "<polygon fill='" + shape.fillColor + "' points='" + (shape.points.map(function(p) {
      var offset;
      offset = p.strokeWidth % 2 === 0 ? 0.0 : 0.5;
      return (p.x + offset) + "," + (p.y + offset);
    }).join(' ')) + "' stroke='" + shape.strokeColor + "' stroke-width='" + shape.strokeWidth + "' />";
  } else {
    return "<polyline fill='" + shape.fillColor + "' points='" + (shape.points.map(function(p) {
      var offset;
      offset = p.strokeWidth % 2 === 0 ? 0.0 : 0.5;
      return (p.x + offset) + "," + (p.y + offset);
    }).join(' ')) + "' stroke='none' /> <polyline fill='none' points='" + (shape.points.map(function(p) {
      var offset;
      offset = p.strokeWidth % 2 === 0 ? 0.0 : 0.5;
      return (p.x + offset) + "," + (p.y + offset);
    }).join(' ')) + "' stroke='" + shape.strokeColor + "' stroke-width='" + shape.strokeWidth + "' />";
  }
});

defineSVGRenderer('Text', function(shape) {
  var heightString, textSplitOnLines, widthString;
  widthString = shape.forcedWidth ? "width='" + shape.forcedWidth + "px'" : "";
  heightString = shape.forcedHeight ? "height='" + shape.forcedHeight + "px'" : "";
  textSplitOnLines = shape.text.split(/\r\n|\r|\n/g);
  if (shape.renderer) {
    textSplitOnLines = shape.renderer.lines;
  }
  return "<text x='" + shape.x + "' y='" + shape.y + "' " + widthString + " " + heightString + " fill='" + shape.color + "' style='font: " + shape.font + ";'> " + (textSplitOnLines.map((function(_this) {
    return function(line, i) {
      var dy;
      dy = i === 0 ? 0 : '1.2em';
      return "<tspan x='" + shape.x + "' dy='" + dy + "' alignment-baseline='text-before-edge'> " + (escapeHTML(line)) + " </tspan>";
    };
  })(this)).join('')) + " </text>";
});

module.exports = {
  defineSVGRenderer: defineSVGRenderer,
  renderShapeToSVG: renderShapeToSVG
};


},{"./lineEndCapShapes":10}],17:[function(require,module,exports){
var renderShapeToContext, renderShapeToSVG, slice, util,
  slice1 = [].slice;

slice = Array.prototype.slice;

renderShapeToContext = require('./canvasRenderer').renderShapeToContext;

renderShapeToSVG = require('./svgRenderer').renderShapeToSVG;

util = {
  addImageOnload: function(img, fn) {
    var oldOnload;
    oldOnload = img.onload;
    img.onload = function() {
      if (typeof oldOnload === "function") {
        oldOnload();
      }
      return fn();
    };
    return img;
  },
  last: function(array, n) {
    if (n == null) {
      n = null;
    }
    if (n) {
      return slice.call(array, Math.max(array.length - n, 0));
    } else {
      return array[array.length - 1];
    }
  },
  classSet: function(classNameToIsPresent) {
    var classNames, key;
    classNames = [];
    for (key in classNameToIsPresent) {
      if (classNameToIsPresent[key]) {
        classNames.push(key);
      }
    }
    return classNames.join(' ');
  },
  matchElementSize: function(elementToMatch, elementsToResize, scale, callback) {
    var resize;
    if (callback == null) {
      callback = function() {};
    }
    resize = (function(_this) {
      return function() {
        var el, i, len;
        for (i = 0, len = elementsToResize.length; i < len; i++) {
          el = elementsToResize[i];
          el.style.width = elementToMatch.offsetWidth + "px";
          el.style.height = elementToMatch.offsetHeight + "px";
          if (el.width != null) {
            el.setAttribute('width', el.offsetWidth * scale);
            el.setAttribute('height', el.offsetHeight * scale);
          }
        }
        return callback();
      };
    })(this);
    elementToMatch.addEventListener('resize', resize);
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);
    resize();
    return resize;
  },
  combineCanvases: function() {
    var c, canvas, canvases, ctx, i, j, len, len1;
    canvases = 1 <= arguments.length ? slice1.call(arguments, 0) : [];
    c = document.createElement('canvas');
    c.width = canvases[0].width;
    c.height = canvases[0].height;
    for (i = 0, len = canvases.length; i < len; i++) {
      canvas = canvases[i];
      c.width = Math.max(canvas.width, c.width);
      c.height = Math.max(canvas.height, c.height);
    }
    ctx = c.getContext('2d');
    for (j = 0, len1 = canvases.length; j < len1; j++) {
      canvas = canvases[j];
      ctx.drawImage(canvas, 0, 0);
    }
    return c;
  },
  renderShapes: function(shapes, bounds, scale, canvas) {
    var ctx, i, len, shape;
    if (scale == null) {
      scale = 1;
    }
    if (canvas == null) {
      canvas = null;
    }
    canvas = canvas || document.createElement('canvas');
    canvas.width = bounds.width * scale;
    canvas.height = bounds.height * scale;
    ctx = canvas.getContext('2d');
    ctx.translate(-bounds.x * scale, -bounds.y * scale);
    ctx.scale(scale, scale);
    for (i = 0, len = shapes.length; i < len; i++) {
      shape = shapes[i];
      renderShapeToContext(ctx, shape);
    }
    return canvas;
  },
  renderShapesToSVG: function(shapes, arg, backgroundColor) {
    var height, width, x, y;
    x = arg.x, y = arg.y, width = arg.width, height = arg.height;
    return ("<svg xmlns='http://www.w3.org/2000/svg' width='" + width + "' height='" + height + "' viewBox='0 0 " + width + " " + height + "'> <rect width='" + width + "' height='" + height + "' x='0' y='0' fill='" + backgroundColor + "' /> <g transform='translate(" + (-x) + ", " + (-y) + ")'> " + (shapes.map(renderShapeToSVG).join('')) + " </g> </svg>").replace(/(\r\n|\n|\r)/gm, "");
  },
  getBoundingRect: function(rects, width, height) {
    var i, len, maxX, maxY, minX, minY, rect;
    if (!rects.length) {
      return {
        x: 0,
        y: 0,
        width: 0 || width,
        height: 0 || height
      };
    }
    minX = rects[0].x;
    minY = rects[0].y;
    maxX = rects[0].x + rects[0].width;
    maxY = rects[0].y + rects[0].height;
    for (i = 0, len = rects.length; i < len; i++) {
      rect = rects[i];
      minX = Math.floor(Math.min(rect.x, minX));
      minY = Math.floor(Math.min(rect.y, minY));
      maxX = Math.ceil(Math.max(maxX, rect.x + rect.width));
      maxY = Math.ceil(Math.max(maxY, rect.y + rect.height));
    }
    minX = width ? 0 : minX;
    minY = height ? 0 : minY;
    maxX = width || maxX;
    maxY = height || maxY;
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  },
  getDefaultImageRect: function(shapeBoundingRects, explicitSize, margin) {
    var height, rect, width;
    if (explicitSize == null) {
      explicitSize = {
        width: 0,
        height: 0
      };
    }
    if (margin == null) {
      margin = {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      };
    }
    width = explicitSize.width, height = explicitSize.height;
    rect = util.getBoundingRect(shapeBoundingRects, width === 'infinite' ? 0 : width, height === 'infinite' ? 0 : height);
    rect.x -= margin.left;
    rect.y -= margin.top;
    rect.width += margin.left + margin.right;
    rect.height += margin.top + margin.bottom;
    return rect;
  },
  getBackingScale: function(context) {
    if (window.devicePixelRatio == null) {
      return 1;
    }
    if (!(window.devicePixelRatio > 1)) {
      return 1;
    }
    return window.devicePixelRatio;
  },
  requestAnimationFrame: (window.requestAnimationFrame || window.setTimeout).bind(window),
  getGUID: (function() {
    var s4;
    s4 = function() {
      return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    };
    return function() {
      return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    };
  })(),
  requestAnimationFrame: function(f) {
    if (window.requestAnimationFrame) {
      return window.requestAnimationFrame(f);
    }
    if (window.webkitRequestAnimationFrame) {
      return window.webkitRequestAnimationFrame(f);
    }
    if (window.mozRequestAnimationFrame) {
      return window.mozRequestAnimationFrame(f);
    }
    return setTimeout(f, 0);
  },
  cancelAnimationFrame: function(f) {
    if (window.cancelAnimationFrame) {
      return window.cancelAnimationFrame(f);
    }
    if (window.webkitCancelRequestAnimationFrame) {
      return window.webkitCancelRequestAnimationFrame(f);
    }
    if (window.webkitCancelAnimationFrame) {
      return window.webkitCancelAnimationFrame(f);
    }
    if (window.mozCancelAnimationFrame) {
      return window.mozCancelAnimationFrame(f);
    }
    return clearTimeout(f);
  }
};

module.exports = util;


},{"./canvasRenderer":7,"./svgRenderer":16}],18:[function(require,module,exports){
'use strict';

(function () {
  function CustomEvent(event, params) {
    params = params || { bubbles: false, cancelable: false, detail: undefined };
    var evt = document.createEvent('CustomEvent');
    evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
    return evt;
  };

  CustomEvent.prototype = window.CustomEvent.prototype;

  window.CustomEvent = CustomEvent;
})();

},{}],19:[function(require,module,exports){
"use strict";

var hasWarned = false;
if (!CanvasRenderingContext2D.prototype.setLineDash) {
  CanvasRenderingContext2D.prototype.setLineDash = function () {
    // no-op
    if (!hasWarned) {
      console.warn("context2D.setLineDash is a no-op in this browser.");
      hasWarned = true;
    }
  };
}
module.exports = null;

},{}],20:[function(require,module,exports){
var LiterallyCanvasModel, LiterallyCanvasReactComponent, baseTools, canvasRenderer, conversion, defaultImageURLPrefix, defaultOptions, defaultTools, defineOptionsStyle, init, initReactDOM, initWithoutGUI, localize, registerJQueryPlugin, renderSnapshotToImage, renderSnapshotToSVG, setDefaultImageURLPrefix, shapes, svgRenderer, tools, util;

require('./ie_customevent');

require('./ie_setLineDash');

LiterallyCanvasModel = require('./core/LiterallyCanvas');

defaultOptions = require('./core/defaultOptions');

canvasRenderer = require('./core/canvasRenderer');

svgRenderer = require('./core/svgRenderer');

shapes = require('./core/shapes');

util = require('./core/util');

renderSnapshotToImage = require('./core/renderSnapshotToImage');

renderSnapshotToSVG = require('./core/renderSnapshotToSVG');

localize = require('./core/localization').localize;

LiterallyCanvasReactComponent = require('./reactGUI/LiterallyCanvas');

initReactDOM = require('./reactGUI/initDOM');

require('./optionsStyles/font');

require('./optionsStyles/stroke-width');

require('./optionsStyles/line-options-and-stroke-width');

require('./optionsStyles/polygon-and-stroke-width');

require('./optionsStyles/stroke-or-fill');

require('./optionsStyles/null');

defineOptionsStyle = require('./optionsStyles/optionsStyles').defineOptionsStyle;

conversion = {
  snapshotToShapes: function(snapshot) {
    var i, len, ref, results, shape;
    ref = snapshot.shapes;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      shape = ref[i];
      results.push(shapes.JSONToShape(shape));
    }
    return results;
  },
  snapshotJSONToShapes: function(json) {
    return conversion.snapshotToShapes(JSON.parse(json));
  }
};

baseTools = require('./tools/base');

tools = {
  Pencil: require('./tools/Pencil'),
  Eraser: require('./tools/Eraser'),
  Line: require('./tools/Line'),
  Rectangle: require('./tools/Rectangle'),
  Ellipse: require('./tools/Ellipse'),
  Text: require('./tools/Text'),
  Polygon: require('./tools/Polygon'),
  Pan: require('./tools/Pan'),
  Eyedropper: require('./tools/Eyedropper'),
  SelectShape: require('./tools/SelectShape'),
  Tool: baseTools.Tool,
  ToolWithStroke: baseTools.ToolWithStroke
};

defaultTools = defaultOptions.tools;

defaultImageURLPrefix = defaultOptions.imageURLPrefix;

setDefaultImageURLPrefix = function(newDefault) {
  defaultImageURLPrefix = newDefault;
  return defaultOptions.imageURLPrefix = newDefault;
};

init = function(el, opts) {
  var child, i, len, opt, ref;
  if (opts == null) {
    opts = {};
  }
  for (opt in defaultOptions) {
    if (!(opt in opts)) {
      opts[opt] = defaultOptions[opt];
    }
  }
  ref = el.children;
  for (i = 0, len = ref.length; i < len; i++) {
    child = ref[i];
    el.removeChild(child);
  }
  return require('./reactGUI/initDOM')(el, opts);
};

initWithoutGUI = function(el, opts) {
  var drawingViewElement, lc, originalClassName;
  originalClassName = el.className;
  if ([' ', ' '].join(el.className).indexOf(' literally ') === -1) {
    el.className = el.className + ' literally';
  }
  if (el.className.includes('toolbar-hidden') === false) {
    el.className = el.className + ' toolbar-hidden';
  }
  if ('imageSize' in opts && 'height' in opts.imageSize) {
    el.style.height = opts.imageSize.height + 'px';
  }
  drawingViewElement = document.createElement('div');
  drawingViewElement.className = 'lc-drawing';
  el.appendChild(drawingViewElement);
  lc = new LiterallyCanvasModel(drawingViewElement, opts);
  lc.teardown = function() {
    var child, i, len, ref;
    lc._teardown();
    ref = el.children;
    for (i = 0, len = ref.length; i < len; i++) {
      child = ref[i];
      el.removeChild(child);
    }
    return el.className = originalClassName;
  };
  if ('onInit' in opts) {
    opts.onInit(lc);
  }
  return lc;
};

registerJQueryPlugin = function(_$) {
  return _$.fn.literallycanvas = function(opts) {
    if (opts == null) {
      opts = {};
    }
    this.each((function(_this) {
      return function(ix, el) {
        return el.literallycanvas = init(el, opts);
      };
    })(this));
    return this;
  };
};

if (typeof window !== 'undefined') {
  window.LC = {
    init: init
  };
  if (window.$) {
    registerJQueryPlugin(window.$);
  }
}

module.exports = {
  init: init,
  registerJQueryPlugin: registerJQueryPlugin,
  util: util,
  tools: tools,
  setDefaultImageURLPrefix: setDefaultImageURLPrefix,
  defaultTools: defaultTools,
  defineOptionsStyle: defineOptionsStyle,
  LiterallyCanvasReactComponent: LiterallyCanvasReactComponent,
  defineShape: shapes.defineShape,
  createShape: shapes.createShape,
  JSONToShape: shapes.JSONToShape,
  shapeToJSON: shapes.shapeToJSON,
  defineCanvasRenderer: canvasRenderer.defineCanvasRenderer,
  renderShapeToContext: canvasRenderer.renderShapeToContext,
  renderShapeToCanvas: canvasRenderer.renderShapeToCanvas,
  renderShapesToCanvas: util.renderShapes,
  defineSVGRenderer: svgRenderer.defineSVGRenderer,
  renderShapeToSVG: svgRenderer.renderShapeToSVG,
  renderShapesToSVG: util.renderShapesToSVG,
  snapshotToShapes: conversion.snapshotToShapes,
  snapshotJSONToShapes: conversion.snapshotJSONToShapes,
  renderSnapshotToImage: renderSnapshotToImage,
  renderSnapshotToSVG: renderSnapshotToSVG,
  localize: localize
};


},{"./core/LiterallyCanvas":3,"./core/canvasRenderer":7,"./core/defaultOptions":8,"./core/localization":11,"./core/renderSnapshotToImage":13,"./core/renderSnapshotToSVG":14,"./core/shapes":15,"./core/svgRenderer":16,"./core/util":17,"./ie_customevent":18,"./ie_setLineDash":19,"./optionsStyles/font":21,"./optionsStyles/line-options-and-stroke-width":22,"./optionsStyles/null":23,"./optionsStyles/optionsStyles":24,"./optionsStyles/polygon-and-stroke-width":25,"./optionsStyles/stroke-or-fill":26,"./optionsStyles/stroke-width":27,"./reactGUI/LiterallyCanvas":30,"./reactGUI/initDOM":42,"./tools/Ellipse":43,"./tools/Eraser":44,"./tools/Eyedropper":45,"./tools/Line":46,"./tools/Pan":47,"./tools/Pencil":48,"./tools/Polygon":49,"./tools/Rectangle":50,"./tools/SelectShape":51,"./tools/Text":52,"./tools/base":53}],21:[function(require,module,exports){
var ALL_FONTS, DOM, FONT_NAME_TO_VALUE, MONOSPACE_FONTS, OTHER_FONTS, SANS_SERIF_FONTS, SERIF_FONTS, _, createReactClass, defineOptionsStyle, i, j, l, len, len1, len2, len3, m, name, ref, ref1, ref2, ref3, value;

DOM = require('../reactGUI/ReactDOMFactories-shim');

createReactClass = require('../reactGUI/createReactClass-shim');

defineOptionsStyle = require('./optionsStyles').defineOptionsStyle;

_ = require('../core/localization')._;

SANS_SERIF_FONTS = [['Arial', 'Arial,"Helvetica Neue",Helvetica,sans-serif'], ['Arial Black', '"Arial Black","Arial Bold",Gadget,sans-serif'], ['Arial Narrow', '"Arial Narrow",Arial,sans-serif'], ['Gill Sans', '"Gill Sans","Gill Sans MT",Calibri,sans-serif'], ['Helvetica', '"Helvetica Neue",Helvetica,Arial,sans-serif'], ['Impact', 'Impact,Haettenschweiler,"Franklin Gothic Bold",Charcoal,"Helvetica Inserat","Bitstream Vera Sans Bold","Arial Black",sans-serif'], ['Tahoma', 'Tahoma,Verdana,Segoe,sans-serif'], ['Trebuchet MS', '"Trebuchet MS","Lucida Grande","Lucida Sans Unicode","Lucida Sans",Tahoma,sans-serif'], ['Verdana', 'Verdana,Geneva,sans-serif']].map(function(arg) {
  var name, value;
  name = arg[0], value = arg[1];
  return {
    name: _(name),
    value: value
  };
});

SERIF_FONTS = [['Baskerville', 'Baskerville,"Baskerville Old Face","Hoefler Text",Garamond,"Times New Roman",serif'], ['Garamond', 'Garamond,Baskerville,"Baskerville Old Face","Hoefler Text","Times New Roman",serif'], ['Georgia', 'Georgia,Times,"Times New Roman",serif'], ['Hoefler Text', '"Hoefler Text","Baskerville Old Face",Garamond,"Times New Roman",serif'], ['Lucida Bright', '"Lucida Bright",Georgia,serif'], ['Palatino', 'Palatino,"Palatino Linotype","Palatino LT STD","Book Antiqua",Georgia,serif'], ['Times New Roman', 'TimesNewRoman,"Times New Roman",Times,Baskerville,Georgia,serif']].map(function(arg) {
  var name, value;
  name = arg[0], value = arg[1];
  return {
    name: _(name),
    value: value
  };
});

MONOSPACE_FONTS = [['Consolas/Monaco', 'Consolas,monaco,"Lucida Console",monospace'], ['Courier New', '"Courier New",Courier,"Lucida Sans Typewriter","Lucida Typewriter",monospace'], ['Lucida Sans Typewriter', '"Lucida Sans Typewriter","Lucida Console",monaco,"Bitstream Vera Sans Mono",monospace']].map(function(arg) {
  var name, value;
  name = arg[0], value = arg[1];
  return {
    name: _(name),
    value: value
  };
});

OTHER_FONTS = [['Copperplate', 'Copperplate,"Copperplate Gothic Light",fantasy'], ['Papyrus', 'Papyrus,fantasy'], ['Script', '"Brush Script MT",cursive']].map(function(arg) {
  var name, value;
  name = arg[0], value = arg[1];
  return {
    name: _(name),
    value: value
  };
});

ALL_FONTS = [[_('Sans Serif'), SANS_SERIF_FONTS], [_('Serif'), SERIF_FONTS], [_('Monospace'), MONOSPACE_FONTS], [_('Other'), OTHER_FONTS]];

FONT_NAME_TO_VALUE = {};

for (i = 0, len = SANS_SERIF_FONTS.length; i < len; i++) {
  ref = SANS_SERIF_FONTS[i], name = ref.name, value = ref.value;
  FONT_NAME_TO_VALUE[name] = value;
}

for (j = 0, len1 = SERIF_FONTS.length; j < len1; j++) {
  ref1 = SERIF_FONTS[j], name = ref1.name, value = ref1.value;
  FONT_NAME_TO_VALUE[name] = value;
}

for (l = 0, len2 = MONOSPACE_FONTS.length; l < len2; l++) {
  ref2 = MONOSPACE_FONTS[l], name = ref2.name, value = ref2.value;
  FONT_NAME_TO_VALUE[name] = value;
}

for (m = 0, len3 = OTHER_FONTS.length; m < len3; m++) {
  ref3 = OTHER_FONTS[m], name = ref3.name, value = ref3.value;
  FONT_NAME_TO_VALUE[name] = value;
}

defineOptionsStyle('font', createReactClass({
  displayName: 'FontOptions',
  getInitialState: function() {
    return {
      isItalic: false,
      isBold: false,
      fontName: 'Helvetica',
      fontSizeIndex: 4
    };
  },
  getFontSizes: function() {
    return [9, 10, 12, 14, 18, 24, 36, 48, 64, 72, 96, 144, 288];
  },
  updateTool: function(newState) {
    var fontSize, items, k;
    if (newState == null) {
      newState = {};
    }
    for (k in this.state) {
      if (!(k in newState)) {
        newState[k] = this.state[k];
      }
    }
    fontSize = this.getFontSizes()[newState.fontSizeIndex];
    items = [];
    if (newState.isItalic) {
      items.push('italic');
    }
    if (newState.isBold) {
      items.push('bold');
    }
    items.push(fontSize + "px");
    items.push(FONT_NAME_TO_VALUE[newState.fontName]);
    this.props.lc.tool.font = items.join(' ');
    return this.props.lc.trigger('setFont', items.join(' '));
  },
  handleFontSize: function(event) {
    var newState;
    newState = {
      fontSizeIndex: event.target.value
    };
    this.setState(newState);
    return this.updateTool(newState);
  },
  handleFontFamily: function(event) {
    var newState;
    newState = {
      fontName: event.target.selectedOptions[0].innerHTML
    };
    this.setState(newState);
    return this.updateTool(newState);
  },
  handleItalic: function(event) {
    var newState;
    newState = {
      isItalic: !this.state.isItalic
    };
    this.setState(newState);
    return this.updateTool(newState);
  },
  handleBold: function(event) {
    var newState;
    newState = {
      isBold: !this.state.isBold
    };
    this.setState(newState);
    return this.updateTool(newState);
  },
  componentDidMount: function() {
    return this.updateTool();
  },
  render: function() {
    var br, div, input, label, lc, optgroup, option, select, span;
    lc = this.props.lc;
    div = DOM.div, input = DOM.input, select = DOM.select, option = DOM.option, br = DOM.br, label = DOM.label, span = DOM.span, optgroup = DOM.optgroup;
    return div({
      className: 'lc-font-settings'
    }, select({
      value: this.state.fontSizeIndex,
      onChange: this.handleFontSize
    }, this.getFontSizes().map((function(_this) {
      return function(size, ix) {
        return option({
          value: ix,
          key: ix
        }, size + "px");
      };
    })(this))), select({
      value: this.state.fontName,
      onChange: this.handleFontFamily
    }, ALL_FONTS.map((function(_this) {
      return function(arg) {
        var fonts, label;
        label = arg[0], fonts = arg[1];
        return optgroup({
          key: label,
          label: label
        }, fonts.map(function(family, ix) {
          return option({
            value: family.name,
            key: ix
          }, family.name);
        }));
      };
    })(this))), span({}, label({
      htmlFor: 'italic'
    }, _("italic")), input({
      type: 'checkbox',
      id: 'italic',
      checked: this.state.isItalic,
      onChange: this.handleItalic
    })), span({}, label({
      htmlFor: 'bold'
    }, _("bold")), input({
      type: 'checkbox',
      id: 'bold',
      checked: this.state.isBold,
      onChange: this.handleBold
    })));
  }
}));

module.exports = {};


},{"../core/localization":11,"../reactGUI/ReactDOMFactories-shim":35,"../reactGUI/createReactClass-shim":39,"./optionsStyles":24}],22:[function(require,module,exports){
var DOM, StrokeWidthPicker, classSet, createReactClass, createSetStateOnEventMixin, defineOptionsStyle;

DOM = require('../reactGUI/ReactDOMFactories-shim');

createReactClass = require('../reactGUI/createReactClass-shim');

defineOptionsStyle = require('./optionsStyles').defineOptionsStyle;

StrokeWidthPicker = React.createFactory(require('../reactGUI/StrokeWidthPicker'));

createSetStateOnEventMixin = require('../reactGUI/createSetStateOnEventMixin');

classSet = require('../core/util').classSet;

defineOptionsStyle('line-options-and-stroke-width', createReactClass({
  displayName: 'LineOptionsAndStrokeWidth',
  getState: function() {
    return {
      strokeWidth: this.props.tool.strokeWidth,
      isDashed: this.props.tool.isDashed,
      hasEndArrow: this.props.tool.hasEndArrow
    };
  },
  getInitialState: function() {
    return this.getState();
  },
  mixins: [createSetStateOnEventMixin('toolChange')],
  render: function() {
    var arrowButtonClass, dashButtonClass, div, img, li, style, toggleIsDashed, togglehasEndArrow, ul;
    div = DOM.div, ul = DOM.ul, li = DOM.li, img = DOM.img;
    toggleIsDashed = (function(_this) {
      return function() {
        _this.props.tool.isDashed = !_this.props.tool.isDashed;
        return _this.setState(_this.getState());
      };
    })(this);
    togglehasEndArrow = (function(_this) {
      return function() {
        _this.props.tool.hasEndArrow = !_this.props.tool.hasEndArrow;
        return _this.setState(_this.getState());
      };
    })(this);
    dashButtonClass = classSet({
      'square-toolbar-button': true,
      'selected': this.state.isDashed
    });
    arrowButtonClass = classSet({
      'square-toolbar-button': true,
      'selected': this.state.hasEndArrow
    });
    style = {
      float: 'left',
      margin: 1
    };
    return div({}, div({
      className: dashButtonClass,
      onClick: toggleIsDashed,
      style: style
    }, img({
      src: this.props.imageURLPrefix + "/dashed-line.png"
    })), div({
      className: arrowButtonClass,
      onClick: togglehasEndArrow,
      style: style
    }, img({
      src: this.props.imageURLPrefix + "/line-with-arrow.png"
    })), StrokeWidthPicker({
      tool: this.props.tool,
      lc: this.props.lc
    }));
  }
}));

module.exports = {};


},{"../core/util":17,"../reactGUI/ReactDOMFactories-shim":35,"../reactGUI/StrokeWidthPicker":36,"../reactGUI/createReactClass-shim":39,"../reactGUI/createSetStateOnEventMixin":40,"./optionsStyles":24}],23:[function(require,module,exports){
var DOM, createReactClass, defineOptionsStyle;

DOM = require('../reactGUI/ReactDOMFactories-shim');

createReactClass = require('../reactGUI/createReactClass-shim');

defineOptionsStyle = require('./optionsStyles').defineOptionsStyle;

defineOptionsStyle('null', createReactClass({
  displayName: 'NoOptions',
  render: function() {
    return DOM.div();
  }
}));

module.exports = {};


},{"../reactGUI/ReactDOMFactories-shim":35,"../reactGUI/createReactClass-shim":39,"./optionsStyles":24}],24:[function(require,module,exports){
var React, defineOptionsStyle, optionsStyles;

React = require('../reactGUI/React-shim');

optionsStyles = {};

defineOptionsStyle = function(name, style) {
  return optionsStyles[name] = React.createFactory(style);
};

module.exports = {
  optionsStyles: optionsStyles,
  defineOptionsStyle: defineOptionsStyle
};


},{"../reactGUI/React-shim":33}],25:[function(require,module,exports){
var DOM, StrokeWidthPicker, createReactClass, createSetStateOnEventMixin, defineOptionsStyle;

DOM = require('../reactGUI/ReactDOMFactories-shim');

createReactClass = require('../reactGUI/createReactClass-shim');

defineOptionsStyle = require('./optionsStyles').defineOptionsStyle;

StrokeWidthPicker = React.createFactory(require('../reactGUI/StrokeWidthPicker'));

createSetStateOnEventMixin = require('../reactGUI/createSetStateOnEventMixin');

defineOptionsStyle('polygon-and-stroke-width', createReactClass({
  displayName: 'PolygonAndStrokeWidth',
  getState: function() {
    return {
      strokeWidth: this.props.tool.strokeWidth,
      inProgress: false
    };
  },
  getInitialState: function() {
    return this.getState();
  },
  mixins: [createSetStateOnEventMixin('toolChange')],
  componentDidMount: function() {
    var hidePolygonTools, showPolygonTools, unsubscribeFuncs;
    unsubscribeFuncs = [];
    this.unsubscribe = (function(_this) {
      return function() {
        var func, i, len, results;
        results = [];
        for (i = 0, len = unsubscribeFuncs.length; i < len; i++) {
          func = unsubscribeFuncs[i];
          results.push(func());
        }
        return results;
      };
    })(this);
    showPolygonTools = (function(_this) {
      return function() {
        if (!_this.state.inProgress) {
          return _this.setState({
            inProgress: true
          });
        }
      };
    })(this);
    hidePolygonTools = (function(_this) {
      return function() {
        return _this.setState({
          inProgress: false
        });
      };
    })(this);
    unsubscribeFuncs.push(this.props.lc.on('lc-polygon-started', showPolygonTools));
    return unsubscribeFuncs.push(this.props.lc.on('lc-polygon-stopped', hidePolygonTools));
  },
  componentWillUnmount: function() {
    return this.unsubscribe();
  },
  render: function() {
    var div, img, lc, polygonCancel, polygonFinishClosed, polygonFinishOpen, polygonToolStyle;
    lc = this.props.lc;
    div = DOM.div, img = DOM.img;
    polygonFinishOpen = (function(_this) {
      return function() {
        return lc.trigger('lc-polygon-finishopen');
      };
    })(this);
    polygonFinishClosed = (function(_this) {
      return function() {
        return lc.trigger('lc-polygon-finishclosed');
      };
    })(this);
    polygonCancel = (function(_this) {
      return function() {
        return lc.trigger('lc-polygon-cancel');
      };
    })(this);
    polygonToolStyle = {};
    if (!this.state.inProgress) {
      polygonToolStyle = {
        display: 'none'
      };
    }
    return div({}, div({
      className: 'polygon-toolbar horz-toolbar',
      style: polygonToolStyle
    }, div({
      className: 'square-toolbar-button',
      onClick: polygonFinishOpen
    }, img({
      src: this.props.imageURLPrefix + "/polygon-open.png"
    })), div({
      className: 'square-toolbar-button',
      onClick: polygonFinishClosed
    }, img({
      src: this.props.imageURLPrefix + "/polygon-closed.png"
    })), div({
      className: 'square-toolbar-button',
      onClick: polygonCancel
    }, img({
      src: this.props.imageURLPrefix + "/polygon-cancel.png"
    }))), div({}, StrokeWidthPicker({
      tool: this.props.tool,
      lc: this.props.lc
    })));
  }
}));

module.exports = {};


},{"../reactGUI/ReactDOMFactories-shim":35,"../reactGUI/StrokeWidthPicker":36,"../reactGUI/createReactClass-shim":39,"../reactGUI/createSetStateOnEventMixin":40,"./optionsStyles":24}],26:[function(require,module,exports){
'use strict';

var createReactClass = require('../reactGUI/createReactClass-shim');

var _require = require('./optionsStyles'),
    defineOptionsStyle = _require.defineOptionsStyle;

var createSetStateOnEventMixin = require('../reactGUI/createSetStateOnEventMixin');
var _ = require('../core/localization')._;

defineOptionsStyle('stroke-or-fill', createReactClass({
  displayName: 'StrokeOrFillPicker',
  getState: function getState() {
    return { strokeOrFill: 'stroke' };
  },
  getInitialState: function getInitialState() {
    return this.getState();
  },
  mixins: [createSetStateOnEventMixin('toolChange')],

  onChange: function onChange(e) {
    if (e.target.id == 'stroke-or-fill-stroke') {
      this.props.lc.tool.strokeOrFill = 'stroke';
    } else {
      this.props.lc.tool.strokeOrFill = 'fill';
    }
    this.setState(this.getState());
  },

  render: function render() {
    var lc = this.props.lc;

    return React.createElement(
      'form',
      null,
      React.createElement(
        'span',
        null,
        ' ',
        _('Color to change:'),
        ' '
      ),
      React.createElement(
        'span',
        null,
        React.createElement('input', { type: 'radio', name: 'stroke-or-fill', value: 'stroke',
          id: 'stroke-or-fill-stroke', onChange: this.onChange,
          checked: lc.tool.strokeOrFill == 'stroke' }),
        React.createElement(
          'label',
          { htmlFor: 'stroke-or-fill-stroke', className: 'label' },
          ' ',
          _("stroke")
        )
      ),
      React.createElement(
        'span',
        null,
        React.createElement('input', { type: 'radio', name: 'stroke-or-fill', value: 'fill',
          id: 'stroke-or-fill-fill', onChange: this.onChange,
          checked: lc.tool.strokeOrFill == 'fill' }),
        React.createElement(
          'label',
          { htmlFor: 'stroke-or-fill-fill', className: 'label' },
          ' ',
          _("fill")
        )
      )
    );
  }
}));

module.exports = {};

},{"../core/localization":11,"../reactGUI/createReactClass-shim":39,"../reactGUI/createSetStateOnEventMixin":40,"./optionsStyles":24}],27:[function(require,module,exports){
var StrokeWidthPicker, defineOptionsStyle;

defineOptionsStyle = require('./optionsStyles').defineOptionsStyle;

StrokeWidthPicker = require('../reactGUI/StrokeWidthPicker');

defineOptionsStyle('stroke-width', StrokeWidthPicker);

module.exports = {};


},{"../reactGUI/StrokeWidthPicker":36,"./optionsStyles":24}],28:[function(require,module,exports){
var ClearButton, DOM, _, classSet, createReactClass, createSetStateOnEventMixin;

DOM = require('../reactGUI/ReactDOMFactories-shim');

createReactClass = require('../reactGUI/createReactClass-shim');

createSetStateOnEventMixin = require('./createSetStateOnEventMixin');

_ = require('../core/localization')._;

classSet = require('../core/util').classSet;

ClearButton = createReactClass({
  displayName: 'ClearButton',
  getState: function() {
    return {
      isEnabled: this.props.lc.canUndo()
    };
  },
  getInitialState: function() {
    return this.getState();
  },
  mixins: [createSetStateOnEventMixin('drawingChange')],
  render: function() {
    var className, div, lc, onClick;
    div = DOM.div;
    lc = this.props.lc;
    className = classSet({
      'lc-clear': true,
      'toolbar-button': true,
      'fat-button': true,
      'disabled': !this.state.isEnabled
    });
    onClick = lc.canUndo() ? ((function(_this) {
      return function() {
        return lc.clear();
      };
    })(this)) : function() {};
    return div({
      className: className,
      onClick: onClick
    }, _('Clear'));
  }
});

module.exports = ClearButton;


},{"../core/localization":11,"../core/util":17,"../reactGUI/ReactDOMFactories-shim":35,"../reactGUI/createReactClass-shim":39,"./createSetStateOnEventMixin":40}],29:[function(require,module,exports){
var ColorGrid, ColorWell, DOM, PureRenderMixin, React, _, cancelAnimationFrame, classSet, createReactClass, getHSLAString, getHSLString, parseHSLAString, ref, requestAnimationFrame;

React = require('./React-shim');

DOM = require('../reactGUI/ReactDOMFactories-shim');

createReactClass = require('../reactGUI/createReactClass-shim');

PureRenderMixin = require('react-addons-pure-render-mixin');

ref = require('../core/util'), classSet = ref.classSet, requestAnimationFrame = ref.requestAnimationFrame, cancelAnimationFrame = ref.cancelAnimationFrame;

_ = require('../core/localization')._;

parseHSLAString = function(s) {
  var components, firstParen, insideParens, lastParen;
  if (s === 'transparent') {
    return {
      hue: 0,
      sat: 0,
      light: 0,
      alpha: 0
    };
  }
  if ((s != null ? s.substring(0, 4) : void 0) !== 'hsla') {
    return null;
  }
  firstParen = s.indexOf('(');
  lastParen = s.indexOf(')');
  insideParens = s.substring(firstParen + 1, lastParen - firstParen + 4);
  components = (function() {
    var j, len, ref1, results;
    ref1 = insideParens.split(',');
    results = [];
    for (j = 0, len = ref1.length; j < len; j++) {
      s = ref1[j];
      results.push(s.trim());
    }
    return results;
  })();
  return {
    hue: parseInt(components[0], 10),
    sat: parseInt(components[1].substring(0, components[1].length - 1), 10),
    light: parseInt(components[2].substring(0, components[2].length - 1), 10),
    alpha: parseFloat(components[3])
  };
};

getHSLAString = function(arg) {
  var alpha, hue, light, sat;
  hue = arg.hue, sat = arg.sat, light = arg.light, alpha = arg.alpha;
  return "hsla(" + hue + ", " + sat + "%, " + light + "%, " + alpha + ")";
};

getHSLString = function(arg) {
  var hue, light, sat;
  hue = arg.hue, sat = arg.sat, light = arg.light;
  return "hsl(" + hue + ", " + sat + "%, " + light + "%)";
};

ColorGrid = React.createFactory(createReactClass({
  displayName: 'ColorGrid',
  mixins: [PureRenderMixin],
  render: function() {
    var div;
    div = DOM.div;
    return div({}, this.props.rows.map((function(_this) {
      return function(row, ix) {
        return div({
          className: 'color-row',
          key: ix,
          style: {
            width: 20 * row.length
          }
        }, row.map(function(cellColor, ix2) {
          var alpha, className, colorString, colorStringNoAlpha, hue, light, sat, update;
          hue = cellColor.hue, sat = cellColor.sat, light = cellColor.light, alpha = cellColor.alpha;
          colorString = getHSLAString(cellColor);
          colorStringNoAlpha = "hsl(" + hue + ", " + sat + "%, " + light + "%)";
          className = classSet({
            'color-cell': true,
            'selected': _this.props.selectedColor === colorString
          });
          update = function(e) {
            _this.props.onChange(cellColor, colorString);
            e.stopPropagation();
            return e.preventDefault();
          };
          return div({
            className: className,
            onTouchStart: update,
            onTouchMove: update,
            onClick: update,
            style: {
              backgroundColor: colorStringNoAlpha
            },
            key: ix2
          });
        }));
      };
    })(this)));
  }
}));

ColorWell = createReactClass({
  displayName: 'ColorWell',
  mixins: [PureRenderMixin],
  getInitialState: function() {
    var colorString, hsla;
    colorString = this.props.lc.colors[this.props.colorName];
    hsla = parseHSLAString(colorString);
    if (hsla == null) {
      hsla = {};
    }
    if (hsla.alpha == null) {
      hsla.alpha = 1;
    }
    if (hsla.sat == null) {
      hsla.sat = 100;
    }
    if (hsla.hue == null) {
      hsla.hue = 0;
    }
    if (hsla.light == null) {
      hsla.light = 50;
    }
    return {
      colorString: colorString,
      alpha: hsla.alpha,
      sat: hsla.sat === 0 ? 100 : hsla.sat,
      isPickerVisible: false,
      hsla: hsla
    };
  },
  componentDidMount: function() {
    return this.unsubscribe = this.props.lc.on(this.props.colorName + "ColorChange", (function(_this) {
      return function() {
        var colorString;
        colorString = _this.props.lc.colors[_this.props.colorName];
        _this.setState({
          colorString: colorString
        });
        return _this.setHSLAFromColorString(colorString);
      };
    })(this));
  },
  componentWillUnmount: function() {
    return this.unsubscribe();
  },
  setHSLAFromColorString: function(c) {
    var hsla;
    hsla = parseHSLAString(c);
    if (hsla) {
      return this.setState({
        hsla: hsla,
        alpha: hsla.alpha,
        sat: hsla.sat
      });
    } else {
      return this.setState({
        hsla: null,
        alpha: 1,
        sat: 100
      });
    }
  },
  closePicker: function() {
    return this.setState({
      isPickerVisible: false
    });
  },
  togglePicker: function() {
    var isPickerVisible, shouldResetSat;
    isPickerVisible = !this.state.isPickerVisible;
    shouldResetSat = isPickerVisible && this.state.sat === 0;
    this.setHSLAFromColorString(this.state.colorString);
    return this.setState({
      isPickerVisible: isPickerVisible,
      sat: shouldResetSat ? 100 : this.state.sat
    });
  },
  setColor: function(c) {
    this.setState({
      colorString: c
    });
    this.setHSLAFromColorString(c);
    return this.props.lc.setColor(this.props.colorName, c);
  },
  setAlpha: function(alpha) {
    var hsla;
    this.setState({
      alpha: alpha
    });
    if (this.state.hsla) {
      hsla = this.state.hsla;
      hsla.alpha = alpha;
      this.setState({
        hsla: hsla
      });
      return this.setColor(getHSLAString(hsla));
    }
  },
  setSat: function(sat) {
    var hsla;
    this.setState({
      sat: sat
    });
    if (isNaN(sat)) {
      throw "SAT";
    }
    if (this.state.hsla) {
      hsla = this.state.hsla;
      hsla.sat = sat;
      this.setState({
        hsla: hsla
      });
      return this.setColor(getHSLAString(hsla));
    }
  },
  render: function() {
    var br, div, label;
    div = DOM.div, label = DOM.label, br = DOM.br;
    return div({
      className: classSet({
        'color-well': true,
        'open': this.state.isPickerVisible
      }),
      onMouseLeave: this.closePicker,
      style: {
        float: 'left',
        textAlign: 'center'
      }
    }, label({
      float: 'left'
    }, this.props.label), br({}), div({
      className: classSet({
        'color-well-color-container': true,
        'selected': this.state.isPickerVisible
      }),
      style: {
        backgroundColor: 'white'
      },
      onClick: this.togglePicker
    }, div({
      className: 'color-well-checker color-well-checker-top-left'
    }), div({
      className: 'color-well-checker color-well-checker-bottom-right',
      style: {
        left: '50%',
        top: '50%'
      }
    }), div({
      className: 'color-well-color',
      style: {
        backgroundColor: this.state.colorString
      }
    }, " ")), this.renderPicker());
  },
  renderPicker: function() {
    var div, hue, i, input, j, label, len, onSelectColor, ref1, renderColor, renderLabel, rows;
    div = DOM.div, label = DOM.label, input = DOM.input;
    if (!this.state.isPickerVisible) {
      return null;
    }
    renderLabel = (function(_this) {
      return function(text) {
        return div({
          className: 'color-row label',
          key: text,
          style: {
            lineHeight: '20px',
            height: 16
          }
        }, text);
      };
    })(this);
    renderColor = (function(_this) {
      return function() {
        var checkerboardURL;
        checkerboardURL = _this.props.lc.opts.imageURLPrefix + "/checkerboard-8x8.png";
        return div({
          className: 'color-row',
          key: "color",
          style: {
            position: 'relative',
            backgroundImage: "url(" + checkerboardURL + ")",
            backgroundRepeat: 'repeat',
            height: 24
          }
        }, div({
          style: {
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: _this.state.colorString
          }
        }));
      };
    })(this);
    rows = [];
    rows.push((function() {
      var j, results;
      results = [];
      for (i = j = 0; j <= 100; i = j += 10) {
        results.push({
          hue: 0,
          sat: 0,
          light: i,
          alpha: this.state.alpha
        });
      }
      return results;
    }).call(this));
    ref1 = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
    for (j = 0, len = ref1.length; j < len; j++) {
      hue = ref1[j];
      rows.push((function() {
        var k, results;
        results = [];
        for (i = k = 10; k <= 90; i = k += 8) {
          results.push({
            hue: hue,
            sat: this.state.sat,
            light: i,
            alpha: this.state.alpha
          });
        }
        return results;
      }).call(this));
    }
    onSelectColor = (function(_this) {
      return function(hsla, s) {
        return _this.setColor(s);
      };
    })(this);
    return div({
      className: 'color-picker-popup'
    }, renderColor(), renderLabel(_("alpha")), input({
      type: 'range',
      min: 0,
      max: 1,
      step: 0.01,
      value: this.state.alpha,
      onChange: (function(_this) {
        return function(e) {
          return _this.setAlpha(parseFloat(e.target.value));
        };
      })(this)
    }), renderLabel(_("saturation")), input({
      type: 'range',
      min: 0,
      max: 100,
      value: this.state.sat,
      max: 100,
      onChange: (function(_this) {
        return function(e) {
          return _this.setSat(parseInt(e.target.value, 10));
        };
      })(this)
    }), ColorGrid({
      rows: rows,
      selectedColor: this.state.colorString,
      onChange: onSelectColor
    }));
  }
});

module.exports = ColorWell;


},{"../core/localization":11,"../core/util":17,"../reactGUI/ReactDOMFactories-shim":35,"../reactGUI/createReactClass-shim":39,"./React-shim":33,"react-addons-pure-render-mixin":2}],30:[function(require,module,exports){
'use strict';

var React = require('./React-shim');
var createReactClass = require('../reactGUI/createReactClass-shim');

var _require = require('../reactGUI/ReactDOM-shim'),
    findDOMNode = _require.findDOMNode;

var _require2 = require('../core/util'),
    classSet = _require2.classSet;

var Picker = require('./Picker');
var Options = require('./Options');
var createToolButton = require('./createToolButton');
var LiterallyCanvasModel = require('../core/LiterallyCanvas');
var defaultOptions = require('../core/defaultOptions');

require('../optionsStyles/font');
require('../optionsStyles/stroke-width');
require('../optionsStyles/line-options-and-stroke-width');
require('../optionsStyles/polygon-and-stroke-width');
require('../optionsStyles/null');

var CanvasContainer = createReactClass({
  displayName: 'CanvasContainer',
  shouldComponentUpdate: function shouldComponentUpdate() {
    // Avoid React trying to control this DOM
    return false;
  },
  render: function render() {
    return React.createElement('div', { key: 'literallycanvas', className: 'lc-drawing with-gui' });
  }
});

var LiterallyCanvas = createReactClass({
  displayName: 'LiterallyCanvas',

  getDefaultProps: function getDefaultProps() {
    return defaultOptions;
  },
  bindToModel: function bindToModel() {
    var canvasContainerEl = findDOMNode(this.canvas);
    var opts = this.props;
    this.lc.bindToElement(canvasContainerEl);

    if (typeof this.lc.opts.onInit === 'function') {
      this.lc.opts.onInit(this.lc);
    }
  },
  componentWillMount: function componentWillMount() {
    var _this = this;

    if (this.lc) return;

    if (this.props.lc) {
      this.lc = this.props.lc;
    } else {
      this.lc = new LiterallyCanvasModel(this.props);
    }

    this.toolButtonComponents = this.lc.opts.tools.map(function (ToolClass) {
      return createToolButton(new ToolClass(_this.lc));
    });
  },
  componentDidMount: function componentDidMount() {
    if (!this.lc.isBound) {
      this.bindToModel();
    }
  },
  componentWillUnmount: function componentWillUnmount() {
    if (this.lc) {
      this.lc._teardown();
    }
  },
  render: function render() {
    var _this2 = this;

    var lc = this.lc,
        toolButtonComponents = this.toolButtonComponents,
        props = this.props;
    var _lc$opts = this.lc.opts,
        imageURLPrefix = _lc$opts.imageURLPrefix,
        toolbarPosition = _lc$opts.toolbarPosition,
        imageSize = _lc$opts.imageSize;


    var pickerProps = { lc: lc, toolButtonComponents: toolButtonComponents, imageURLPrefix: imageURLPrefix };
    var topOrBottomClassName = classSet({
      'toolbar-at-top': toolbarPosition === 'top',
      'toolbar-at-bottom': toolbarPosition === 'bottom',
      'toolbar-hidden': toolbarPosition === 'hidden'
    });

    var style = {};
    if (imageSize.height) style.height = imageSize.height;

    return React.createElement(
      'div',
      { className: 'literally ' + topOrBottomClassName, style: style },
      React.createElement(CanvasContainer, { ref: function ref(item) {
          return _this2.canvas = item;
        } }),
      React.createElement(Picker, pickerProps),
      React.createElement(Options, { lc: lc, imageURLPrefix: imageURLPrefix })
    );
  }
});

module.exports = LiterallyCanvas;

},{"../core/LiterallyCanvas":3,"../core/defaultOptions":8,"../core/util":17,"../optionsStyles/font":21,"../optionsStyles/line-options-and-stroke-width":22,"../optionsStyles/null":23,"../optionsStyles/polygon-and-stroke-width":25,"../optionsStyles/stroke-width":27,"../reactGUI/ReactDOM-shim":34,"../reactGUI/createReactClass-shim":39,"./Options":31,"./Picker":32,"./React-shim":33,"./createToolButton":41}],31:[function(require,module,exports){
var DOM, Options, createReactClass, createSetStateOnEventMixin, optionsStyles;

DOM = require('../reactGUI/ReactDOMFactories-shim');

createReactClass = require('../reactGUI/createReactClass-shim');

createSetStateOnEventMixin = require('./createSetStateOnEventMixin');

optionsStyles = require('../optionsStyles/optionsStyles').optionsStyles;

Options = createReactClass({
  displayName: 'Options',
  getState: function() {
    var ref;
    return {
      style: (ref = this.props.lc.tool) != null ? ref.optionsStyle : void 0,
      tool: this.props.lc.tool
    };
  },
  getInitialState: function() {
    return this.getState();
  },
  mixins: [createSetStateOnEventMixin('toolChange')],
  renderBody: function() {
    var style;
    style = "" + this.state.style;
    return optionsStyles[style] && optionsStyles[style]({
      lc: this.props.lc,
      tool: this.state.tool,
      imageURLPrefix: this.props.imageURLPrefix
    });
  },
  render: function() {
    var div;
    div = DOM.div;
    return div({
      className: 'lc-options horz-toolbar'
    }, this.renderBody());
  }
});

module.exports = Options;


},{"../optionsStyles/optionsStyles":24,"../reactGUI/ReactDOMFactories-shim":35,"../reactGUI/createReactClass-shim":39,"./createSetStateOnEventMixin":40}],32:[function(require,module,exports){
var ClearButton, ColorPickers, ColorWell, DOM, Picker, React, UndoRedoButtons, ZoomButtons, _, createReactClass;

React = require('./React-shim');

DOM = require('../reactGUI/ReactDOMFactories-shim');

createReactClass = require('../reactGUI/createReactClass-shim');

ClearButton = React.createFactory(require('./ClearButton'));

UndoRedoButtons = React.createFactory(require('./UndoRedoButtons'));

ZoomButtons = React.createFactory(require('./ZoomButtons'));

_ = require('../core/localization')._;

ColorWell = React.createFactory(require('./ColorWell'));

ColorPickers = React.createFactory(createReactClass({
  displayName: 'ColorPickers',
  render: function() {
    var div, lc;
    lc = this.props.lc;
    div = DOM.div;
    return div({
      className: 'lc-color-pickers'
    }, ColorWell({
      lc: lc,
      colorName: 'primary',
      label: _('stroke')
    }), ColorWell({
      lc: lc,
      colorName: 'secondary',
      label: _('fill')
    }), ColorWell({
      lc: lc,
      colorName: 'background',
      label: _('bg')
    }));
  }
}));

Picker = createReactClass({
  displayName: 'Picker',
  getInitialState: function() {
    return {
      selectedToolIndex: 0
    };
  },
  renderBody: function() {
    var div, imageURLPrefix, lc, ref, toolButtonComponents;
    div = DOM.div;
    ref = this.props, toolButtonComponents = ref.toolButtonComponents, lc = ref.lc, imageURLPrefix = ref.imageURLPrefix;
    return div({
      className: 'lc-picker-contents'
    }, toolButtonComponents.map((function(_this) {
      return function(component, ix) {
        return component({
          lc: lc,
          imageURLPrefix: imageURLPrefix,
          key: ix,
          isSelected: ix === _this.state.selectedToolIndex,
          onSelect: function(tool) {
            lc.setTool(tool);
            return _this.setState({
              selectedToolIndex: ix
            });
          }
        });
      };
    })(this)), toolButtonComponents.length % 2 !== 0 ? div({
      className: 'toolbar-button thin-button disabled'
    }) : void 0, div({
      style: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0
      }
    }, ColorPickers({
      lc: this.props.lc
    }), UndoRedoButtons({
      lc: lc,
      imageURLPrefix: imageURLPrefix
    }), ZoomButtons({
      lc: lc,
      imageURLPrefix: imageURLPrefix
    }), ClearButton({
      lc: lc
    })));
  },
  render: function() {
    var div;
    div = DOM.div;
    return div({
      className: 'lc-picker'
    }, this.renderBody());
  }
});

module.exports = Picker;


},{"../core/localization":11,"../reactGUI/ReactDOMFactories-shim":35,"../reactGUI/createReactClass-shim":39,"./ClearButton":28,"./ColorWell":29,"./React-shim":33,"./UndoRedoButtons":37,"./ZoomButtons":38}],33:[function(require,module,exports){
var React;

try {
  React = require('react');
} catch (error) {
  React = window.React;
}

if (React == null) {
  throw "Can't find React";
}

module.exports = React;


},{"react":"react"}],34:[function(require,module,exports){
var ReactDOM;

try {
  ReactDOM = require('react-dom');
} catch (error) {
  ReactDOM = window.ReactDOM;
}

if (ReactDOM == null) {
  try {
    ReactDOM = require('react');
  } catch (error) {
    ReactDOM = window.React;
  }
}

if (ReactDOM == null) {
  throw "Can't find ReactDOM";
}

module.exports = ReactDOM;


},{"react":"react","react-dom":"react-dom"}],35:[function(require,module,exports){
var DOM, React;

try {
  DOM = require('react-dom-factories');
} catch (error) {
  DOM = window.ReactDOMFactories;
}

if (DOM == null) {
  try {
    React = require('react');
    DOM = React.DOM;
  } catch (error) {
    DOM = window.React.DOM;
  }
}

if (DOM == null) {
  throw "Can't find DOM";
}

module.exports = DOM;


},{"react":"react","react-dom-factories":"react-dom-factories"}],36:[function(require,module,exports){
var DOM, classSet, createReactClass, createSetStateOnEventMixin;

DOM = require('../reactGUI/ReactDOMFactories-shim');

createReactClass = require('../reactGUI/createReactClass-shim');

createSetStateOnEventMixin = require('../reactGUI/createSetStateOnEventMixin');

classSet = require('../core/util').classSet;

module.exports = createReactClass({
  displayName: 'StrokeWidthPicker',
  getState: function(tool) {
    if (tool == null) {
      tool = this.props.tool;
    }
    return {
      strokeWidth: tool.strokeWidth
    };
  },
  getInitialState: function() {
    return this.getState();
  },
  mixins: [createSetStateOnEventMixin('toolDidUpdateOptions')],
  componentWillReceiveProps: function(props) {
    return this.setState(this.getState(props.tool));
  },
  render: function() {
    var circle, div, li, strokeWidths, svg, ul;
    ul = DOM.ul, li = DOM.li, svg = DOM.svg, circle = DOM.circle, div = DOM.div;
    strokeWidths = this.props.lc.opts.strokeWidths;
    return div({}, strokeWidths.map((function(_this) {
      return function(strokeWidth, ix) {
        var buttonClassName, buttonSize;
        buttonClassName = classSet({
          'square-toolbar-button': true,
          'selected': strokeWidth === _this.state.strokeWidth
        });
        buttonSize = 28;
        return div({
          key: strokeWidth
        }, div({
          className: buttonClassName,
          onClick: function() {
            return _this.props.lc.trigger('setStrokeWidth', strokeWidth);
          }
        }, svg({
          width: buttonSize - 2,
          height: buttonSize - 2,
          viewport: "0 0 " + strokeWidth + " " + strokeWidth,
          version: "1.1",
          xmlns: "http://www.w3.org/2000/svg"
        }, circle({
          cx: Math.ceil(buttonSize / 2 - 1),
          cy: Math.ceil(buttonSize / 2 - 1),
          r: strokeWidth / 2
        }))));
      };
    })(this)));
  }
});


},{"../core/util":17,"../reactGUI/ReactDOMFactories-shim":35,"../reactGUI/createReactClass-shim":39,"../reactGUI/createSetStateOnEventMixin":40}],37:[function(require,module,exports){
var DOM, React, RedoButton, UndoButton, UndoRedoButtons, classSet, createReactClass, createSetStateOnEventMixin, createUndoRedoButtonComponent;

React = require('./React-shim');

DOM = require('../reactGUI/ReactDOMFactories-shim');

createReactClass = require('../reactGUI/createReactClass-shim');

createSetStateOnEventMixin = require('./createSetStateOnEventMixin');

classSet = require('../core/util').classSet;

createUndoRedoButtonComponent = function(undoOrRedo) {
  return createReactClass({
    displayName: undoOrRedo === 'undo' ? 'UndoButton' : 'RedoButton',
    getState: function() {
      return {
        isEnabled: (function() {
          switch (false) {
            case undoOrRedo !== 'undo':
              return this.props.lc.canUndo();
            case undoOrRedo !== 'redo':
              return this.props.lc.canRedo();
          }
        }).call(this)
      };
    },
    getInitialState: function() {
      return this.getState();
    },
    mixins: [createSetStateOnEventMixin('drawingChange')],
    render: function() {
      var className, div, imageURLPrefix, img, lc, onClick, ref, src, style, title;
      div = DOM.div, img = DOM.img;
      ref = this.props, lc = ref.lc, imageURLPrefix = ref.imageURLPrefix;
      title = undoOrRedo === 'undo' ? 'Undo' : 'Redo';
      className = ("lc-" + undoOrRedo + " ") + classSet({
        'toolbar-button': true,
        'thin-button': true,
        'disabled': !this.state.isEnabled
      });
      onClick = (function() {
        switch (false) {
          case !!this.state.isEnabled:
            return function() {};
          case undoOrRedo !== 'undo':
            return function() {
              return lc.undo();
            };
          case undoOrRedo !== 'redo':
            return function() {
              return lc.redo();
            };
        }
      }).call(this);
      src = imageURLPrefix + "/" + undoOrRedo + ".png";
      style = {
        backgroundImage: "url(" + src + ")"
      };
      return div({
        className: className,
        onClick: onClick,
        title: title,
        style: style
      });
    }
  });
};

UndoButton = React.createFactory(createUndoRedoButtonComponent('undo'));

RedoButton = React.createFactory(createUndoRedoButtonComponent('redo'));

UndoRedoButtons = createReactClass({
  displayName: 'UndoRedoButtons',
  render: function() {
    var div;
    div = DOM.div;
    return div({
      className: 'lc-undo-redo'
    }, UndoButton(this.props), RedoButton(this.props));
  }
});

module.exports = UndoRedoButtons;


},{"../core/util":17,"../reactGUI/ReactDOMFactories-shim":35,"../reactGUI/createReactClass-shim":39,"./React-shim":33,"./createSetStateOnEventMixin":40}],38:[function(require,module,exports){
var DOM, React, ZoomButtons, ZoomInButton, ZoomOutButton, classSet, createReactClass, createSetStateOnEventMixin, createZoomButtonComponent;

React = require('./React-shim');

DOM = require('../reactGUI/ReactDOMFactories-shim');

createReactClass = require('../reactGUI/createReactClass-shim');

createSetStateOnEventMixin = require('./createSetStateOnEventMixin');

classSet = require('../core/util').classSet;

createZoomButtonComponent = function(inOrOut) {
  return createReactClass({
    displayName: inOrOut === 'in' ? 'ZoomInButton' : 'ZoomOutButton',
    getState: function() {
      return {
        isEnabled: (function() {
          switch (false) {
            case inOrOut !== 'in':
              return this.props.lc.scale < this.props.lc.config.zoomMax;
            case inOrOut !== 'out':
              return this.props.lc.scale > this.props.lc.config.zoomMin;
          }
        }).call(this)
      };
    },
    getInitialState: function() {
      return this.getState();
    },
    mixins: [createSetStateOnEventMixin('zoom')],
    render: function() {
      var className, div, imageURLPrefix, img, lc, onClick, ref, src, style, title;
      div = DOM.div, img = DOM.img;
      ref = this.props, lc = ref.lc, imageURLPrefix = ref.imageURLPrefix;
      title = inOrOut === 'in' ? 'Zoom in' : 'Zoom out';
      className = ("lc-zoom-" + inOrOut + " ") + classSet({
        'toolbar-button': true,
        'thin-button': true,
        'disabled': !this.state.isEnabled
      });
      onClick = (function() {
        switch (false) {
          case !!this.state.isEnabled:
            return function() {};
          case inOrOut !== 'in':
            return function() {
              return lc.zoom(lc.config.zoomStep);
            };
          case inOrOut !== 'out':
            return function() {
              return lc.zoom(-lc.config.zoomStep);
            };
        }
      }).call(this);
      src = imageURLPrefix + "/zoom-" + inOrOut + ".png";
      style = {
        backgroundImage: "url(" + src + ")"
      };
      return div({
        className: className,
        onClick: onClick,
        title: title,
        style: style
      });
    }
  });
};

ZoomOutButton = React.createFactory(createZoomButtonComponent('out'));

ZoomInButton = React.createFactory(createZoomButtonComponent('in'));

ZoomButtons = createReactClass({
  displayName: 'ZoomButtons',
  render: function() {
    var div;
    div = DOM.div;
    return div({
      className: 'lc-zoom'
    }, ZoomOutButton(this.props), ZoomInButton(this.props));
  }
});

module.exports = ZoomButtons;


},{"../core/util":17,"../reactGUI/ReactDOMFactories-shim":35,"../reactGUI/createReactClass-shim":39,"./React-shim":33,"./createSetStateOnEventMixin":40}],39:[function(require,module,exports){
var React, createReactClass;

try {
  createReactClass = require('create-react-class');
} catch (error) {
  createReactClass = window.createReactClass;
}

if (createReactClass == null) {
  try {
    React = require('react');
    createReactClass = React.createClass;
  } catch (error) {
    createReactClass = window.React.createClass;
  }
}

if (createReactClass == null) {
  throw "Can't find createReactClass";
}

module.exports = createReactClass;


},{"create-react-class":"create-react-class","react":"react"}],40:[function(require,module,exports){
var React, createSetStateOnEventMixin;

React = require('./React-shim');

module.exports = createSetStateOnEventMixin = function(eventName) {
  return {
    componentDidMount: function() {
      return this.unsubscribe = this.props.lc.on(eventName, (function(_this) {
        return function() {
          return _this.setState(_this.getState());
        };
      })(this));
    },
    componentWillUnmount: function() {
      return this.unsubscribe();
    }
  };
};


},{"./React-shim":33}],41:[function(require,module,exports){
var DOM, React, _, classSet, createReactClass, createToolButton;

React = require('./React-shim');

DOM = require('../reactGUI/ReactDOMFactories-shim');

createReactClass = require('../reactGUI/createReactClass-shim');

classSet = require('../core/util').classSet;

_ = require('../core/localization')._;

createToolButton = function(tool) {
  var displayName, imageName;
  displayName = tool.name;
  imageName = tool.iconName;
  return React.createFactory(createReactClass({
    displayName: displayName,
    getDefaultProps: function() {
      return {
        isSelected: false,
        lc: null
      };
    },
    componentWillMount: function() {
      if (this.props.isSelected) {
        return this.props.lc.setTool(tool);
      }
    },
    render: function() {
      var className, div, imageURLPrefix, img, isSelected, onSelect, ref, src;
      div = DOM.div, img = DOM.img;
      ref = this.props, imageURLPrefix = ref.imageURLPrefix, isSelected = ref.isSelected, onSelect = ref.onSelect;
      className = classSet({
        'lc-pick-tool': true,
        'toolbar-button': true,
        'thin-button': true,
        'selected': isSelected
      });
      src = imageURLPrefix + "/" + imageName + ".png";
      return div({
        className: className,
        style: {
          'backgroundImage': "url(" + src + ")"
        },
        onClick: (function() {
          return onSelect(tool);
        }),
        title: _(displayName)
      });
    }
  }));
};

module.exports = createToolButton;


},{"../core/localization":11,"../core/util":17,"../reactGUI/ReactDOMFactories-shim":35,"../reactGUI/createReactClass-shim":39,"./React-shim":33}],42:[function(require,module,exports){
'use strict';

var React = require('./React-shim');
var ReactDOM = require('./ReactDOM-shim');
var LiterallyCanvasModel = require('../core/LiterallyCanvas');
var LiterallyCanvasReactComponent = require('./LiterallyCanvas');

function init(el, opts) {
  var originalClassName = el.className;
  var lc = new LiterallyCanvasModel(opts);
  ReactDOM.render(React.createElement(LiterallyCanvasReactComponent, { lc: lc }), el);
  lc.teardown = function () {
    lc._teardown();
    for (var i = 0; i < el.children.length; i++) {
      el.removeChild(el.children[i]);
    }
    el.className = originalClassName;
  };
  return lc;
}

module.exports = init;

},{"../core/LiterallyCanvas":3,"./LiterallyCanvas":30,"./React-shim":33,"./ReactDOM-shim":34}],43:[function(require,module,exports){
var Ellipse, ToolWithStroke, createShape,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

ToolWithStroke = require('./base').ToolWithStroke;

createShape = require('../core/shapes').createShape;

module.exports = Ellipse = (function(superClass) {
  extend(Ellipse, superClass);

  function Ellipse() {
    return Ellipse.__super__.constructor.apply(this, arguments);
  }

  Ellipse.prototype.name = 'Ellipse';

  Ellipse.prototype.iconName = 'ellipse';

  Ellipse.prototype.begin = function(x, y, lc) {
    return this.currentShape = createShape('Ellipse', {
      x: x,
      y: y,
      strokeWidth: this.strokeWidth,
      strokeColor: lc.getColor('primary'),
      fillColor: lc.getColor('secondary')
    });
  };

  Ellipse.prototype["continue"] = function(x, y, lc) {
    this.currentShape.width = x - this.currentShape.x;
    this.currentShape.height = y - this.currentShape.y;
    return lc.drawShapeInProgress(this.currentShape);
  };

  Ellipse.prototype.end = function(x, y, lc) {
    return lc.saveShape(this.currentShape);
  };

  return Ellipse;

})(ToolWithStroke);


},{"../core/shapes":15,"./base":53}],44:[function(require,module,exports){
var Eraser, Pencil, createShape,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Pencil = require('./Pencil');

createShape = require('../core/shapes').createShape;

module.exports = Eraser = (function(superClass) {
  extend(Eraser, superClass);

  function Eraser() {
    return Eraser.__super__.constructor.apply(this, arguments);
  }

  Eraser.prototype.name = 'Eraser';

  Eraser.prototype.iconName = 'eraser';

  Eraser.prototype.makePoint = function(x, y, lc) {
    return createShape('Point', {
      x: x,
      y: y,
      size: this.strokeWidth,
      color: '#000'
    });
  };

  Eraser.prototype.makeShape = function() {
    return createShape('ErasedLinePath');
  };

  return Eraser;

})(Pencil);


},{"../core/shapes":15,"./Pencil":48}],45:[function(require,module,exports){
var Eyedropper, Tool, getPixel,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Tool = require('./base').Tool;

getPixel = function(ctx, arg) {
  var pixel, x, y;
  x = arg.x, y = arg.y;
  pixel = ctx.getImageData(x, y, 1, 1).data;
  if (pixel[3]) {
    return "rgb(" + pixel[0] + ", " + pixel[1] + ", " + pixel[2] + ")";
  } else {
    return null;
  }
};

module.exports = Eyedropper = (function(superClass) {
  extend(Eyedropper, superClass);

  Eyedropper.prototype.name = 'Eyedropper';

  Eyedropper.prototype.iconName = 'eyedropper';

  Eyedropper.prototype.optionsStyle = 'stroke-or-fill';

  function Eyedropper(lc) {
    Eyedropper.__super__.constructor.call(this, lc);
    this.strokeOrFill = 'stroke';
  }

  Eyedropper.prototype.readColor = function(x, y, lc) {
    var canvas, color, newColor, offset;
    offset = lc.getDefaultImageRect();
    canvas = lc.getImage();
    newColor = getPixel(canvas.getContext('2d'), {
      x: x - offset.x,
      y: y - offset.y
    });
    color = newColor || lc.getColor('background');
    if (this.strokeOrFill === 'stroke') {
      return lc.setColor('primary', newColor);
    } else {
      return lc.setColor('secondary', newColor);
    }
  };

  Eyedropper.prototype.begin = function(x, y, lc) {
    return this.readColor(x, y, lc);
  };

  Eyedropper.prototype["continue"] = function(x, y, lc) {
    return this.readColor(x, y, lc);
  };

  return Eyedropper;

})(Tool);


},{"./base":53}],46:[function(require,module,exports){
var Line, ToolWithStroke, createShape,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

ToolWithStroke = require('./base').ToolWithStroke;

createShape = require('../core/shapes').createShape;

module.exports = Line = (function(superClass) {
  extend(Line, superClass);

  function Line() {
    return Line.__super__.constructor.apply(this, arguments);
  }

  Line.prototype.name = 'Line';

  Line.prototype.iconName = 'line';

  Line.prototype.optionsStyle = 'line-options-and-stroke-width';

  Line.prototype.begin = function(x, y, lc) {
    return this.currentShape = createShape('Line', {
      x1: x,
      y1: y,
      x2: x,
      y2: y,
      strokeWidth: this.strokeWidth,
      dash: (function() {
        switch (false) {
          case !this.isDashed:
            return [this.strokeWidth * 2, this.strokeWidth * 4];
          default:
            return null;
        }
      }).call(this),
      endCapShapes: this.hasEndArrow ? [null, 'arrow'] : null,
      color: lc.getColor('primary')
    });
  };

  Line.prototype["continue"] = function(x, y, lc) {
    this.currentShape.x2 = x;
    this.currentShape.y2 = y;
    return lc.drawShapeInProgress(this.currentShape);
  };

  Line.prototype.end = function(x, y, lc) {
    return lc.saveShape(this.currentShape);
  };

  return Line;

})(ToolWithStroke);


},{"../core/shapes":15,"./base":53}],47:[function(require,module,exports){
var Pan, Tool, createShape,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Tool = require('./base').Tool;

createShape = require('../core/shapes').createShape;

module.exports = Pan = (function(superClass) {
  extend(Pan, superClass);

  function Pan() {
    return Pan.__super__.constructor.apply(this, arguments);
  }

  Pan.prototype.name = 'Pan';

  Pan.prototype.iconName = 'pan';

  Pan.prototype.usesSimpleAPI = false;

  Pan.prototype.didBecomeActive = function(lc) {
    var unsubscribeFuncs;
    unsubscribeFuncs = [];
    this.unsubscribe = (function(_this) {
      return function() {
        var func, i, len, results;
        results = [];
        for (i = 0, len = unsubscribeFuncs.length; i < len; i++) {
          func = unsubscribeFuncs[i];
          results.push(func());
        }
        return results;
      };
    })(this);
    unsubscribeFuncs.push(lc.on('lc-pointerdown', (function(_this) {
      return function(arg) {
        var rawX, rawY;
        rawX = arg.rawX, rawY = arg.rawY;
        _this.oldPosition = lc.position;
        return _this.pointerStart = {
          x: rawX,
          y: rawY
        };
      };
    })(this)));
    return unsubscribeFuncs.push(lc.on('lc-pointerdrag', (function(_this) {
      return function(arg) {
        var dp, rawX, rawY;
        rawX = arg.rawX, rawY = arg.rawY;
        dp = {
          x: (rawX - _this.pointerStart.x) * lc.backingScale,
          y: (rawY - _this.pointerStart.y) * lc.backingScale
        };
        return lc.setPan(_this.oldPosition.x + dp.x, _this.oldPosition.y + dp.y);
      };
    })(this)));
  };

  Pan.prototype.willBecomeInactive = function(lc) {
    return this.unsubscribe();
  };

  return Pan;

})(Tool);


},{"../core/shapes":15,"./base":53}],48:[function(require,module,exports){
var Pencil, ToolWithStroke, createShape,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

ToolWithStroke = require('./base').ToolWithStroke;

createShape = require('../core/shapes').createShape;

module.exports = Pencil = (function(superClass) {
  extend(Pencil, superClass);

  function Pencil() {
    return Pencil.__super__.constructor.apply(this, arguments);
  }

  Pencil.prototype.name = 'Pencil';

  Pencil.prototype.iconName = 'pencil';

  Pencil.prototype.eventTimeThreshold = 10;

  Pencil.prototype.begin = function(x, y, lc) {
    this.color = lc.getColor('primary');
    this.currentShape = this.makeShape();
    this.currentShape.addPoint(this.makePoint(x, y, lc));
    return this.lastEventTime = Date.now();
  };

  Pencil.prototype["continue"] = function(x, y, lc) {
    var timeDiff;
    timeDiff = Date.now() - this.lastEventTime;
    if (timeDiff > this.eventTimeThreshold) {
      this.lastEventTime += timeDiff;
      this.currentShape.addPoint(this.makePoint(x, y, lc));
      return lc.drawShapeInProgress(this.currentShape);
    }
  };

  Pencil.prototype.end = function(x, y, lc) {
    lc.saveShape(this.currentShape);
    return this.currentShape = void 0;
  };

  Pencil.prototype.makePoint = function(x, y, lc) {
    return createShape('Point', {
      x: x,
      y: y,
      size: this.strokeWidth,
      color: this.color
    });
  };

  Pencil.prototype.makeShape = function() {
    return createShape('LinePath');
  };

  return Pencil;

})(ToolWithStroke);


},{"../core/shapes":15,"./base":53}],49:[function(require,module,exports){
var Polygon, ToolWithStroke, createShape,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

ToolWithStroke = require('./base').ToolWithStroke;

createShape = require('../core/shapes').createShape;

module.exports = Polygon = (function(superClass) {
  extend(Polygon, superClass);

  function Polygon() {
    return Polygon.__super__.constructor.apply(this, arguments);
  }

  Polygon.prototype.name = 'Polygon';

  Polygon.prototype.iconName = 'polygon';

  Polygon.prototype.usesSimpleAPI = false;

  Polygon.prototype.didBecomeActive = function(lc) {
    var onDown, onMove, onUp, polygonCancel, polygonFinishClosed, polygonFinishOpen, polygonUnsubscribeFuncs;
    Polygon.__super__.didBecomeActive.call(this, lc);
    polygonUnsubscribeFuncs = [];
    this.polygonUnsubscribe = (function(_this) {
      return function() {
        var func, i, len, results;
        results = [];
        for (i = 0, len = polygonUnsubscribeFuncs.length; i < len; i++) {
          func = polygonUnsubscribeFuncs[i];
          results.push(func());
        }
        return results;
      };
    })(this);
    this.points = null;
    this.maybePoint = null;
    onUp = (function(_this) {
      return function() {
        if (_this._getWillFinish()) {
          return _this._close(lc);
        }
        lc.trigger('lc-polygon-started');
        if (_this.points) {
          _this.points.push(_this.maybePoint);
        } else {
          _this.points = [_this.maybePoint];
        }
        _this.maybePoint = {
          x: _this.maybePoint.x,
          y: _this.maybePoint.y
        };
        lc.setShapesInProgress(_this._getShapes(lc));
        return lc.repaintLayer('main');
      };
    })(this);
    onMove = (function(_this) {
      return function(arg) {
        var x, y;
        x = arg.x, y = arg.y;
        if (_this.maybePoint) {
          _this.maybePoint.x = x;
          _this.maybePoint.y = y;
          lc.setShapesInProgress(_this._getShapes(lc));
          return lc.repaintLayer('main');
        }
      };
    })(this);
    onDown = (function(_this) {
      return function(arg) {
        var x, y;
        x = arg.x, y = arg.y;
        _this.maybePoint = {
          x: x,
          y: y
        };
        lc.setShapesInProgress(_this._getShapes(lc));
        return lc.repaintLayer('main');
      };
    })(this);
    polygonFinishOpen = (function(_this) {
      return function() {
        _this.maybePoint = {
          x: 2e308,
          y: 2e308
        };
        return _this._close(lc);
      };
    })(this);
    polygonFinishClosed = (function(_this) {
      return function() {
        _this.maybePoint = _this.points[0];
        return _this._close(lc);
      };
    })(this);
    polygonCancel = (function(_this) {
      return function() {
        return _this._cancel(lc);
      };
    })(this);
    polygonUnsubscribeFuncs.push(lc.on('drawingChange', (function(_this) {
      return function() {
        return _this._cancel(lc);
      };
    })(this)));
    polygonUnsubscribeFuncs.push(lc.on('lc-pointerdown', onDown));
    polygonUnsubscribeFuncs.push(lc.on('lc-pointerdrag', onMove));
    polygonUnsubscribeFuncs.push(lc.on('lc-pointermove', onMove));
    polygonUnsubscribeFuncs.push(lc.on('lc-pointerup', onUp));
    polygonUnsubscribeFuncs.push(lc.on('lc-polygon-finishopen', polygonFinishOpen));
    polygonUnsubscribeFuncs.push(lc.on('lc-polygon-finishclosed', polygonFinishClosed));
    return polygonUnsubscribeFuncs.push(lc.on('lc-polygon-cancel', polygonCancel));
  };

  Polygon.prototype.willBecomeInactive = function(lc) {
    Polygon.__super__.willBecomeInactive.call(this, lc);
    if (this.points || this.maybePoint) {
      this._cancel(lc);
    }
    return this.polygonUnsubscribe();
  };

  Polygon.prototype._getArePointsClose = function(a, b) {
    return (Math.abs(a.x - b.x) + Math.abs(a.y - b.y)) < 10;
  };

  Polygon.prototype._getWillClose = function() {
    if (!(this.points && this.points.length > 1)) {
      return false;
    }
    if (!this.maybePoint) {
      return false;
    }
    return this._getArePointsClose(this.points[0], this.maybePoint);
  };

  Polygon.prototype._getWillFinish = function() {
    if (!(this.points && this.points.length > 1)) {
      return false;
    }
    if (!this.maybePoint) {
      return false;
    }
    return this._getArePointsClose(this.points[0], this.maybePoint) || this._getArePointsClose(this.points[this.points.length - 1], this.maybePoint);
  };

  Polygon.prototype._cancel = function(lc) {
    lc.trigger('lc-polygon-stopped');
    this.maybePoint = null;
    this.points = null;
    lc.setShapesInProgress([]);
    return lc.repaintLayer('main');
  };

  Polygon.prototype._close = function(lc) {
    lc.trigger('lc-polygon-stopped');
    lc.setShapesInProgress([]);
    if (this.points.length > 2) {
      lc.saveShape(this._getShape(lc, false));
    }
    this.maybePoint = null;
    return this.points = null;
  };

  Polygon.prototype._getShapes = function(lc, isInProgress) {
    var shape;
    if (isInProgress == null) {
      isInProgress = true;
    }
    shape = this._getShape(lc, isInProgress);
    if (shape) {
      return [shape];
    } else {
      return [];
    }
  };

  Polygon.prototype._getShape = function(lc, isInProgress) {
    var points;
    if (isInProgress == null) {
      isInProgress = true;
    }
    points = [];
    if (this.points) {
      points = points.concat(this.points);
    }
    if ((!isInProgress) && points.length < 3) {
      return null;
    }
    if (isInProgress && this.maybePoint) {
      points.push(this.maybePoint);
    }
    if (points.length > 1) {
      return createShape('Polygon', {
        isClosed: this._getWillClose(),
        strokeColor: lc.getColor('primary'),
        fillColor: lc.getColor('secondary'),
        strokeWidth: this.strokeWidth,
        points: points.map(function(xy) {
          return createShape('Point', xy);
        })
      });
    } else {
      return null;
    }
  };

  Polygon.prototype.optionsStyle = 'polygon-and-stroke-width';

  return Polygon;

})(ToolWithStroke);


},{"../core/shapes":15,"./base":53}],50:[function(require,module,exports){
var Rectangle, ToolWithStroke, createShape,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

ToolWithStroke = require('./base').ToolWithStroke;

createShape = require('../core/shapes').createShape;

module.exports = Rectangle = (function(superClass) {
  extend(Rectangle, superClass);

  function Rectangle() {
    return Rectangle.__super__.constructor.apply(this, arguments);
  }

  Rectangle.prototype.name = 'Rectangle';

  Rectangle.prototype.iconName = 'rectangle';

  Rectangle.prototype.begin = function(x, y, lc) {
    return this.currentShape = createShape('Rectangle', {
      x: x,
      y: y,
      strokeWidth: this.strokeWidth,
      strokeColor: lc.getColor('primary'),
      fillColor: lc.getColor('secondary')
    });
  };

  Rectangle.prototype["continue"] = function(x, y, lc) {
    this.currentShape.width = x - this.currentShape.x;
    this.currentShape.height = y - this.currentShape.y;
    return lc.drawShapeInProgress(this.currentShape);
  };

  Rectangle.prototype.end = function(x, y, lc) {
    return lc.saveShape(this.currentShape);
  };

  return Rectangle;

})(ToolWithStroke);


},{"../core/shapes":15,"./base":53}],51:[function(require,module,exports){
var SelectShape, Tool, createShape,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Tool = require('./base').Tool;

createShape = require('../core/shapes').createShape;

module.exports = SelectShape = (function(superClass) {
  extend(SelectShape, superClass);

  SelectShape.prototype.name = 'SelectShape';

  SelectShape.prototype.usesSimpleAPI = false;

  function SelectShape(lc) {
    this.selectCanvas = document.createElement('canvas');
    this.selectCanvas.style['background-color'] = 'transparent';
    this.selectCtx = this.selectCanvas.getContext('2d');
  }

  SelectShape.prototype.didBecomeActive = function(lc) {
    var onDown, onDrag, onUp, selectShapeUnsubscribeFuncs;
    selectShapeUnsubscribeFuncs = [];
    this._selectShapeUnsubscribe = (function(_this) {
      return function() {
        var func, j, len, results;
        results = [];
        for (j = 0, len = selectShapeUnsubscribeFuncs.length; j < len; j++) {
          func = selectShapeUnsubscribeFuncs[j];
          results.push(func());
        }
        return results;
      };
    })(this);
    onDown = (function(_this) {
      return function(arg) {
        var br, shapeIndex, x, y;
        x = arg.x, y = arg.y;
        _this.didDrag = false;
        shapeIndex = _this._getPixel(x, y, lc, _this.selectCtx);
        _this.selectedShape = lc.shapes[shapeIndex];
        if (_this.selectedShape != null) {
          lc.trigger('shapeSelected', {
            selectedShape: _this.selectedShape
          });
          lc.setShapesInProgress([
            _this.selectedShape, createShape('SelectionBox', {
              shape: _this.selectedShape,
              handleSize: 0
            })
          ]);
          lc.repaintLayer('main');
          br = _this.selectedShape.getBoundingRect();
          return _this.dragOffset = {
            x: x - br.x,
            y: y - br.y
          };
        }
      };
    })(this);
    onDrag = (function(_this) {
      return function(arg) {
        var x, y;
        x = arg.x, y = arg.y;
        if (_this.selectedShape != null) {
          _this.didDrag = true;
          _this.selectedShape.setUpperLeft({
            x: x - _this.dragOffset.x,
            y: y - _this.dragOffset.y
          });
          lc.setShapesInProgress([
            _this.selectedShape, createShape('SelectionBox', {
              shape: _this.selectedShape,
              handleSize: 0
            })
          ]);
          return lc.repaintLayer('main');
        }
      };
    })(this);
    onUp = (function(_this) {
      return function(arg) {
        var x, y;
        x = arg.x, y = arg.y;
        if (_this.didDrag) {
          _this.didDrag = false;
          lc.trigger('shapeMoved', {
            shape: _this.selectedShape
          });
          lc.trigger('drawingChange', {});
          lc.repaintLayer('main');
          return _this._drawSelectCanvas(lc);
        }
      };
    })(this);
    selectShapeUnsubscribeFuncs.push(lc.on('lc-pointerdown', onDown));
    selectShapeUnsubscribeFuncs.push(lc.on('lc-pointerdrag', onDrag));
    selectShapeUnsubscribeFuncs.push(lc.on('lc-pointerup', onUp));
    return this._drawSelectCanvas(lc);
  };

  SelectShape.prototype.willBecomeInactive = function(lc) {
    this._selectShapeUnsubscribe();
    return lc.setShapesInProgress([]);
  };

  SelectShape.prototype._drawSelectCanvas = function(lc) {
    var shapes;
    this.selectCanvas.width = lc.canvas.width;
    this.selectCanvas.height = lc.canvas.height;
    this.selectCtx.clearRect(0, 0, this.selectCanvas.width, this.selectCanvas.height);
    shapes = lc.shapes.map((function(_this) {
      return function(shape, index) {
        return createShape('SelectionBox', {
          shape: shape,
          handleSize: 0,
          backgroundColor: "#" + (_this._intToHex(index))
        });
      };
    })(this));
    return lc.draw(shapes, this.selectCtx);
  };

  SelectShape.prototype._intToHex = function(i) {
    return ("000000" + (i.toString(16))).slice(-6);
  };

  SelectShape.prototype._getPixel = function(x, y, lc, ctx) {
    var p, pixel;
    p = lc.drawingCoordsToClientCoords(x, y);
    pixel = ctx.getImageData(p.x, p.y, 1, 1).data;
    if (pixel[3]) {
      return parseInt(this._rgbToHex(pixel[0], pixel[1], pixel[2]), 16);
    } else {
      return null;
    }
  };

  SelectShape.prototype._componentToHex = function(c) {
    var hex;
    hex = c.toString(16);
    return ("0" + hex).slice(-2);
  };

  SelectShape.prototype._rgbToHex = function(r, g, b) {
    return "" + (this._componentToHex(r)) + (this._componentToHex(g)) + (this._componentToHex(b));
  };

  return SelectShape;

})(Tool);


},{"../core/shapes":15,"./base":53}],52:[function(require,module,exports){
var Text, Tool, createShape, getIsPointInBox,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Tool = require('./base').Tool;

createShape = require('../core/shapes').createShape;

getIsPointInBox = function(point, box) {
  if (point.x < box.x) {
    return false;
  }
  if (point.y < box.y) {
    return false;
  }
  if (point.x > box.x + box.width) {
    return false;
  }
  if (point.y > box.y + box.height) {
    return false;
  }
  return true;
};

module.exports = Text = (function(superClass) {
  extend(Text, superClass);

  Text.prototype.name = 'Text';

  Text.prototype.iconName = 'text';

  function Text() {
    this.text = '';
    this.font = 'bold 18px sans-serif';
    this.currentShape = null;
    this.currentShapeState = null;
    this.initialShapeBoundingRect = null;
    this.dragAction = null;
    this.didDrag = false;
  }

  Text.prototype.didBecomeActive = function(lc) {
    var switchAway, unsubscribeFuncs, updateInputEl;
    unsubscribeFuncs = [];
    this.unsubscribe = (function(_this) {
      return function() {
        var func, i, len, results;
        results = [];
        for (i = 0, len = unsubscribeFuncs.length; i < len; i++) {
          func = unsubscribeFuncs[i];
          results.push(func());
        }
        return results;
      };
    })(this);
    switchAway = (function(_this) {
      return function() {
        _this._ensureNotEditing(lc);
        _this._clearCurrentShape(lc);
        return lc.repaintLayer('main');
      };
    })(this);
    updateInputEl = (function(_this) {
      return function() {
        return _this._updateInputEl(lc);
      };
    })(this);
    unsubscribeFuncs.push(lc.on('drawingChange', switchAway));
    unsubscribeFuncs.push(lc.on('zoom', updateInputEl));
    unsubscribeFuncs.push(lc.on('imageSizeChange', updateInputEl));
    unsubscribeFuncs.push(lc.on('snapshotLoad', (function(_this) {
      return function() {
        _this._clearCurrentShape(lc);
        return lc.repaintLayer('main');
      };
    })(this)));
    unsubscribeFuncs.push(lc.on('primaryColorChange', (function(_this) {
      return function(newColor) {
        if (!_this.currentShape) {
          return;
        }
        _this.currentShape.color = newColor;
        _this._updateInputEl(lc);
        return lc.repaintLayer('main');
      };
    })(this)));
    return unsubscribeFuncs.push(lc.on('setFont', (function(_this) {
      return function(font) {
        if (!_this.currentShape) {
          return;
        }
        _this.font = font;
        _this.currentShape.setFont(font);
        _this._setShapesInProgress(lc);
        _this._updateInputEl(lc);
        return lc.repaintLayer('main');
      };
    })(this)));
  };

  Text.prototype.willBecomeInactive = function(lc) {
    if (this.currentShape) {
      this._ensureNotEditing(lc);
      this.commit(lc);
    }
    return this.unsubscribe();
  };

  Text.prototype.setText = function(text) {
    return this.text = text;
  };

  Text.prototype._ensureNotEditing = function(lc) {
    if (this.currentShapeState === 'editing') {
      return this._exitEditingState(lc);
    }
  };

  Text.prototype._clearCurrentShape = function(lc) {
    this.currentShape = null;
    this.initialShapeBoundingRect = null;
    this.currentShapeState = null;
    return lc.setShapesInProgress([]);
  };

  Text.prototype.commit = function(lc) {
    if (this.currentShape.text) {
      lc.saveShape(this.currentShape);
    }
    this._clearCurrentShape(lc);
    return lc.repaintLayer('main');
  };

  Text.prototype._getSelectionShape = function(ctx, backgroundColor) {
    if (backgroundColor == null) {
      backgroundColor = null;
    }
    return createShape('SelectionBox', {
      shape: this.currentShape,
      ctx: ctx,
      backgroundColor: backgroundColor
    });
  };

  Text.prototype._setShapesInProgress = function(lc) {
    switch (this.currentShapeState) {
      case 'selected':
        return lc.setShapesInProgress([this._getSelectionShape(lc.ctx), this.currentShape]);
      case 'editing':
        return lc.setShapesInProgress([this._getSelectionShape(lc.ctx, '#fff')]);
      default:
        return lc.setShapesInProgress([this.currentShape]);
    }
  };

  Text.prototype.begin = function(x, y, lc) {
    var br, point, selectionBox, selectionShape;
    this.dragAction = 'none';
    this.didDrag = false;
    if (this.currentShapeState === 'selected' || this.currentShapeState === 'editing') {
      br = this.currentShape.getBoundingRect(lc.ctx);
      selectionShape = this._getSelectionShape(lc.ctx);
      selectionBox = selectionShape.getBoundingRect();
      point = {
        x: x,
        y: y
      };
      if (getIsPointInBox(point, br)) {
        this.dragAction = 'move';
      }
      if (getIsPointInBox(point, selectionShape.getBottomRightHandleRect())) {
        this.dragAction = 'resizeBottomRight';
      }
      if (getIsPointInBox(point, selectionShape.getTopLeftHandleRect())) {
        this.dragAction = 'resizeTopLeft';
      }
      if (getIsPointInBox(point, selectionShape.getBottomLeftHandleRect())) {
        this.dragAction = 'resizeBottomLeft';
      }
      if (getIsPointInBox(point, selectionShape.getTopRightHandleRect())) {
        this.dragAction = 'resizeTopRight';
      }
      if (this.dragAction === 'none' && this.currentShapeState === 'editing') {
        this.dragAction = 'stop-editing';
        this._exitEditingState(lc);
      }
    } else {
      this.color = lc.getColor('primary');
      this.currentShape = createShape('Text', {
        x: x,
        y: y,
        text: this.text,
        color: this.color,
        font: this.font,
        v: 1
      });
      this.dragAction = 'place';
      this.currentShapeState = 'selected';
    }
    if (this.dragAction === 'none') {
      this.commit(lc);
      return;
    }
    this.initialShapeBoundingRect = this.currentShape.getBoundingRect(lc.ctx);
    this.dragOffset = {
      x: x - this.initialShapeBoundingRect.x,
      y: y - this.initialShapeBoundingRect.y
    };
    this._setShapesInProgress(lc);
    return lc.repaintLayer('main');
  };

  Text.prototype["continue"] = function(x, y, lc) {
    var br, brBottom, brRight;
    if (this.dragAction === 'none') {
      return;
    }
    br = this.initialShapeBoundingRect;
    brRight = br.x + br.width;
    brBottom = br.y + br.height;
    switch (this.dragAction) {
      case 'place':
        this.currentShape.x = x;
        this.currentShape.y = y;
        this.didDrag = true;
        break;
      case 'move':
        this.currentShape.x = x - this.dragOffset.x;
        this.currentShape.y = y - this.dragOffset.y;
        this.didDrag = true;
        break;
      case 'resizeBottomRight':
        this.currentShape.setSize(x - (this.dragOffset.x - this.initialShapeBoundingRect.width) - br.x, y - (this.dragOffset.y - this.initialShapeBoundingRect.height) - br.y);
        break;
      case 'resizeTopLeft':
        this.currentShape.setSize(brRight - x + this.dragOffset.x, brBottom - y + this.dragOffset.y);
        this.currentShape.setPosition(x - this.dragOffset.x, y - this.dragOffset.y);
        break;
      case 'resizeBottomLeft':
        this.currentShape.setSize(brRight - x + this.dragOffset.x, y - (this.dragOffset.y - this.initialShapeBoundingRect.height) - br.y);
        this.currentShape.setPosition(x - this.dragOffset.x, this.currentShape.y);
        break;
      case 'resizeTopRight':
        this.currentShape.setSize(x - (this.dragOffset.x - this.initialShapeBoundingRect.width) - br.x, brBottom - y + this.dragOffset.y);
        this.currentShape.setPosition(this.currentShape.x, y - this.dragOffset.y);
    }
    this._setShapesInProgress(lc);
    lc.repaintLayer('main');
    return this._updateInputEl(lc);
  };

  Text.prototype.end = function(x, y, lc) {
    if (!this.currentShape) {
      return;
    }
    this.currentShape.setSize(this.currentShape.forcedWidth, 0);
    if (this.currentShapeState === 'selected') {
      if (this.dragAction === 'place' || (this.dragAction === 'move' && !this.didDrag)) {
        this._enterEditingState(lc);
      }
    }
    this._setShapesInProgress(lc);
    lc.repaintLayer('main');
    return this._updateInputEl(lc);
  };

  Text.prototype._enterEditingState = function(lc) {
    var onChange;
    this.currentShapeState = 'editing';
    if (this.inputEl) {
      throw "State error";
    }
    this.inputEl = document.createElement('textarea');
    this.inputEl.className = 'text-tool-input';
    this.inputEl.style.position = 'absolute';
    this.inputEl.style.transformOrigin = '0px 0px';
    this.inputEl.style.backgroundColor = 'transparent';
    this.inputEl.style.border = 'none';
    this.inputEl.style.outline = 'none';
    this.inputEl.style.margin = '0';
    this.inputEl.style.padding = '4px';
    this.inputEl.style.zIndex = '1000';
    this.inputEl.style.overflow = 'hidden';
    this.inputEl.style.resize = 'none';
    this.inputEl.value = this.currentShape.text;
    this.inputEl.addEventListener('mousedown', function(e) {
      return e.stopPropagation();
    });
    this.inputEl.addEventListener('touchstart', function(e) {
      return e.stopPropagation();
    });
    onChange = (function(_this) {
      return function(e) {
        _this.currentShape.setText(e.target.value);
        _this.currentShape.enforceMaxBoundingRect(lc);
        _this._setShapesInProgress(lc);
        lc.repaintLayer('main');
        _this._updateInputEl(lc);
        return e.stopPropagation();
      };
    })(this);
    this.inputEl.addEventListener('keydown', (function(_this) {
      return function() {
        return _this._updateInputEl(lc, true);
      };
    })(this));
    this.inputEl.addEventListener('keyup', onChange);
    this.inputEl.addEventListener('change', onChange);
    this._updateInputEl(lc);
    lc.containerEl.appendChild(this.inputEl);
    this.inputEl.focus();
    return this._setShapesInProgress(lc);
  };

  Text.prototype._exitEditingState = function(lc) {
    this.currentShapeState = 'selected';
    lc.containerEl.removeChild(this.inputEl);
    this.inputEl = null;
    this._setShapesInProgress(lc);
    return lc.repaintLayer('main');
  };

  Text.prototype._updateInputEl = function(lc, withMargin) {
    var br, transformString;
    if (withMargin == null) {
      withMargin = false;
    }
    if (!this.inputEl) {
      return;
    }
    br = this.currentShape.getBoundingRect(lc.ctx, true);
    this.inputEl.style.font = this.currentShape.font;
    this.inputEl.style.color = this.currentShape.color;
    this.inputEl.style.left = (lc.position.x / lc.backingScale + br.x * lc.scale - 4) + "px";
    this.inputEl.style.top = (lc.position.y / lc.backingScale + br.y * lc.scale - 4) + "px";
    if (withMargin && !this.currentShape.forcedWidth) {
      this.inputEl.style.width = (br.width + 10 + this.currentShape.renderer.emDashWidth) + "px";
    } else {
      this.inputEl.style.width = (br.width + 12) + "px";
    }
    if (withMargin) {
      this.inputEl.style.height = (br.height + 10 + this.currentShape.renderer.metrics.leading) + "px";
    } else {
      this.inputEl.style.height = (br.height + 10) + "px";
    }
    transformString = "scale(" + lc.scale + ")";
    this.inputEl.style.transform = transformString;
    this.inputEl.style.webkitTransform = transformString;
    this.inputEl.style.MozTransform = transformString;
    this.inputEl.style.msTransform = transformString;
    return this.inputEl.style.OTransform = transformString;
  };

  Text.prototype.optionsStyle = 'font';

  return Text;

})(Tool);


},{"../core/shapes":15,"./base":53}],53:[function(require,module,exports){
var Tool, ToolWithStroke, tools,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

tools = {};

tools.Tool = Tool = (function() {
  function Tool() {}

  Tool.prototype.name = null;

  Tool.prototype.iconName = null;

  Tool.prototype.usesSimpleAPI = true;

  Tool.prototype.begin = function(x, y, lc) {};

  Tool.prototype["continue"] = function(x, y, lc) {};

  Tool.prototype.end = function(x, y, lc) {};

  Tool.prototype.optionsStyle = null;

  Tool.prototype.didBecomeActive = function(lc) {};

  Tool.prototype.willBecomeInactive = function(lc) {};

  return Tool;

})();

tools.ToolWithStroke = ToolWithStroke = (function(superClass) {
  extend(ToolWithStroke, superClass);

  function ToolWithStroke(lc) {
    this.strokeWidth = lc.opts.defaultStrokeWidth;
  }

  ToolWithStroke.prototype.optionsStyle = 'stroke-width';

  ToolWithStroke.prototype.didBecomeActive = function(lc) {
    var unsubscribeFuncs;
    unsubscribeFuncs = [];
    this.unsubscribe = (function(_this) {
      return function() {
        var func, i, len, results;
        results = [];
        for (i = 0, len = unsubscribeFuncs.length; i < len; i++) {
          func = unsubscribeFuncs[i];
          results.push(func());
        }
        return results;
      };
    })(this);
    return unsubscribeFuncs.push(lc.on('setStrokeWidth', (function(_this) {
      return function(strokeWidth) {
        _this.strokeWidth = strokeWidth;
        return lc.trigger('toolDidUpdateOptions');
      };
    })(this)));
  };

  ToolWithStroke.prototype.willBecomeInactive = function(lc) {
    return this.unsubscribe();
  };

  return ToolWithStroke;

})(Tool);

module.exports = tools;


},{}]},{},[20])(20)
});