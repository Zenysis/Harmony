import React from 'react';
import PropTypes from 'prop-types';

// Custom propType validators for more complex types of validation

function buildPropError(componentName, msg) {
  return new Error(`[${componentName}] ${msg}`);
}

// Given a validator function, return a new version that makes it behave
// like React's 'isRequired' modifier (i.e. do not allow undefined or null
// values)
export function withRequiredValue(validatorFn) {
  return (props, propName, className) => {
    const val = props[propName];
    if (val === undefined || val === null) {
      return new Error(
        `[${className}] '${propName}' is required, received ${val}`,
      );
    }
    return validatorFn(props, propName, className);
  };
}

const ZenPropTypes = {
  // Exclusive OR: Only one of 'propName' or 'otherPropName' must be set,
  // but not both,
  xor(otherPropName) {
    return (props, propName, componentName) => {
      const firstPropUndefined = props[propName] === undefined;
      const secondPropUndefined = props[otherPropName] === undefined;
      if (!firstPropUndefined && !secondPropUndefined) {
        return buildPropError(
          componentName,
          `${propName} and ${otherPropName} cannot be defined at the same time`,
        );
      } else if (firstPropUndefined && secondPropUndefined) {
        return buildPropError(
          componentName,
          `You must specify at least one of ${propName} or ${otherPropName}`,
        );
      }
      return null;
    };
  },

  // alsoRequires: If 'propName' is present, then so must 'otherPropName'
  //   A value is treated as *not* present *only* if it is 'undefined'.
  //   'null' is actually a meaningful value for some use cases,
  //   so if a value is null, we treat it as being set.
  alsoRequires(otherPropName) {
    return (props, propName, componentName) => {
      if (props[propName] !== undefined && props[otherPropName] === undefined) {
        return buildPropError(
          componentName,
          `${otherPropName} is required when ${propName} is defined`,
        );
      }
      return null;
    };
  },

  componentsOfType(...componentTypes) {
    return (props, propName, componentName) => {
      const invalidTypes = [];
      React.Children.forEach(props[propName], (child) => {
        if (child) {
          const hasType = componentTypes.some(type => child.type === type);
          if (!hasType) {
            invalidTypes.push(child.type);
          }
        }
      });
      if (invalidTypes.length > 0) {
        const types = invalidTypes.join(', ');
        return buildPropError(
          componentName,
          `Invalid component types: ${types}`,
        );
      }
      return null;
    };
  },

  // All given validation types must pass
  all(types) {
    return (props, propName, componentName) => {
      types.forEach((type) => {
        PropTypes.checkPropTypes(
          { [propName]: type },
          props,
          'prop',
          componentName,
        );
      });
    };
  },

  arrayOfType(type) {
    return PropTypes.arrayOf(PropTypes.instanceOf(type));
  },

  objectOfType(type) {
    return PropTypes.objectOf(PropTypes.instanceOf(type));
  },

  // Check that a prop is === to the specified instance.
  // This ensures that the same singleton instance is reused.
  // During testing, you might want to mock a required singleton (e.g.
  // a mock Service to test a component), in which case include an
  // 'isMockOf' key that points to the original instance.
  singleton(instance) {
    return (props, propName, componentName) => {
      const val = props[propName];
      if (
        val === instance ||
        ('isMockOf' in val && val.isMockOf === instance)
      ) {
        return null;
      }

      return buildPropError(
        componentName,
        `${propName} is not the required singleton instance`,
      );
    };
  },

  // Execute the supplied function to receive the full PropType validator
  // to run. This is useful if the PropType validator can't be fully declared
  // ahead of time (like if the validator references an object that has not
  // been defined yet).
  eval(fn) {
    return (props, propName, componentName) => {
      PropTypes.checkPropTypes(
        { [propName]: fn() },
        props,
        'prop',
        componentName,
      );
    };
  },
};

export default ZenPropTypes;
