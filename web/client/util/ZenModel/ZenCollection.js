// @flow
import PropTypes from 'prop-types';

import Serializable from 'util/Serializable';
import SerializableUtil from 'util/Serializable/SerializableUtil';
import { withRequiredValue } from 'util/ZenPropTypes';

/**
 * ZenCollection is the base class used to create ZenArray and ZenMap
 * which are immutable wrappers around Arrays and JS objects.
 *
 * NOTE: ZenCollections are *less* performant than the regular JS data
 * structures that they wrap.
 * All functions will have a base O(n) performance because they need to clone
 * the data structures every time. So common operations like push() or set()
 * will *not* be O(1).
 *
 * ZenCollections are ideal for propTypes and state in React Components and
 * ZenModels, where immutability is more important. Do *not* use ZenCollections
 * in internal functions where you need an array or object as a helper.
 *
 */

type PropTypeCreator = (
  typeChecker: ReactPropsCheckType,
) => ReactPropsChainableTypeChecker;

export default class ZenCollection<Container, T> extends Serializable<
  ZenCollection<Container, T>,
> {
  _values: Container;

  static baseCollectionType(): PropTypeCreator {
    throw new Error(
      '[ZenCollection] the baseCollectionType should be overridden',
    );
  }

  static baseItemPropType(): ReactPropsCheckType {
    return PropTypes.any;
  }

  /**
   * Factory method to create a new class that extends the current class
   * (e.g. ZenMap or ZenArray) and enforces that the collection must
   * pass the BaseType validation
   * Example:
   *   const fieldArray = ZenArray.ofType(Field).create();
   */
  static ofType(BaseType: Class<T> | ReactPropsCheckType): * {
    const propType = SerializableUtil.getPropType(BaseType);
    class ZenCollectionWithType extends this {
      static baseItemPropType(): ReactPropsCheckType {
        return propType;
      }
    }
    return ZenCollectionWithType;
  }

  /**
   * Returns a PropType validator that will check that the passed
   * value is a ZenCollection where every element passes the BaseType
   * validation.
   * Useful for when we don't want to extend the ZenCollection, but still want
   * to enforce that the collection contain a specific type.
   * Example:
   *   class SomeModel extends ZenModel.withTypes({
   *     userArray: def(ZenArray.of(User).isRequired),
   *     userMap: def(ZenMap.of(User)),
   *   })
   */
  static of(
    BaseType: Class<T> | ReactPropsCheckType,
  ): ReactPropsChainableTypeChecker {
    const baseItemPropType = SerializableUtil.getPropType(BaseType);
    const collectionName = this.classDisplayName();
    const collectionType = this.baseCollectionType();

    const validator = (props, propName, componentName) => {
      const zenCollection = props[propName];
      if (zenCollection === undefined || zenCollection === null) {
        // undefined/null values are valid (use .isRequired to forbid it)
        return null;
      }

      if (zenCollection instanceof this) {
        return PropTypes.checkPropTypes(
          { [propName]: collectionType(baseItemPropType).isRequired },
          { [propName]: zenCollection._values },
          'prop',
          componentName,
        );
      }

      return new Error(
        `[${componentName}] '${propName}' must be an instance of ${collectionName}`,
      );
    };
    validator.isRequired = withRequiredValue(validator);
    return validator;
  }

  constructor(values: Container): void {
    super();
    // if we're in dev, freeze the values array so it throws an error if
    // we try to mutate it
    if (__DEV__) {
      Object.freeze(values);
    }
    this._values = values;
  }

  _validate() {
    const collectionType = this.constructor.baseCollectionType();
    const baseItemPropType = this.constructor.baseItemPropType();
    return PropTypes.checkPropTypes(
      { wrappedValues: collectionType(baseItemPropType).isRequired },
      { wrappedValues: this._values },
      'prop',
      this.constructor.classDisplayName(),
    );
  }

  // @override
  // eslint-disable-next-line class-methods-use-this
  serialize() {
    throw new Error('[ZenCollection] serialize function should be overridden');
  }
}
