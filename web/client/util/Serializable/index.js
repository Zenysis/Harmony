// @flow
import Promise from 'bluebird';
import PropTypes from 'prop-types';

/**
 * Interface to represent a serializable element.
 * Typically, if you are extending this class, you will definitely want to
 * override the serialize function
 *
 * TODO(pablo, stephen): Move this class, ZenModel, ZenArray, and ZenMap
 *   to a lib/ directory
 *
 * @deprecated
 */

export default class Serializable<T, DeserializationConfig = void> {
  static displayName: string | void = undefined;

  // Get the display name (either the class default name, or the user-defined
  // class variable displayName) to show in error messages
  static classDisplayName(): string {
    const { name, displayName } = this;
    if (displayName && typeof displayName === 'string') {
      return displayName;
    }
    return name;
  }

  // eslint-disable-next-line no-unused-vars
  static deserialize(values: any, extraConfig: DeserializationConfig): T {
    throw new Error(
      `[${this.classDisplayName()}] deserialize function has not been implemented`,
    );
  }

  static deserializeAsync(
    values: any,
    extraConfig: DeserializationConfig,
  ): Promise<T> {
    return Promise.resolve(this.deserialize(values, extraConfig));
  }

  /**
   * Helper function so this instance can be easily included in
   * Component or Model prop types.
   * @return PropType function
   */
  static type(): ReactPropsCheckType {
    return PropTypes.instanceOf(this);
  }

  // eslint-disable-next-line class-methods-use-this
  serialize(): mixed {
    throw new Error(
      `[${this.constructor.classDisplayName()}] serialize function has not been implemented`,
    );
  }
}
