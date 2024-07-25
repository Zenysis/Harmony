const invariant = require('invariant');
const types = require('@babel/types');

/**
 * Transform an ObjectExpression created by the Babel parser into a normal
 * javascript object. The ObjectExpression is expected to match to a plural
 * translation i.e. it has 'zero', 'one', 'other' keys.
 *
 * @param {AST} node AST node of type ObjectExpression, with plural keys
 * https://github.com/babel/babel/blob/main/packages/babel-parser/ast/spec.md#objectexpression
 * @returns {PluralTranslationText} js object with pluralization keys/values
 */
function objectExpressionToPluralTranslationObject(node) {
  const { properties } = node;
  const i18nValue = {
    one: undefined,
    other: undefined,
    zero: undefined,
  };
  properties.forEach(({ key, value }) => {
    invariant(
      key.name in i18nValue,
      `Invalid plural translation property ${key.name}. Must be: zero, one, other`,
    );
    invariant(
      i18nValue[key.name] === undefined,
      `Duplicate plural translation property ${key.name}`,
    );
    invariant(
      types.isStringLiteral(value),
      `Pluralized value must be a StringLiteral. Received ${value.type} for key ${key.name}`,
    );
    i18nValue[key.name] = value.value;
  });

  return i18nValue;
}

/**
 * Transform a javascript object into an ObjectExpression that can be processed
 * by the Babel parser. The given object is expected to match to a plural
 * translation i.e. it has 'zero', 'one', 'other' keys.
 *
 * @param {PluralTranslationText} pluralObject object with plural keys
 * @returns {AST} AST node of type ObjectExpression
 * https://github.com/babel/babel/blob/main/packages/babel-parser/ast/spec.md#objectexpression
 */
function objectToObjectExpression(pluralObject) {
  invariant(
    'zero' in pluralObject && 'one' in pluralObject && 'other' in pluralObject,
    `Error: a pluralized I18N translation requires text for {\`zero\`, \`one\`, and \`other\`}.`,
  );
  const properties = [
    types.objectProperty(
      types.stringLiteral('one'),
      types.stringLiteral(pluralObject.one),
    ),
    types.objectProperty(
      types.stringLiteral('other'),
      types.stringLiteral(pluralObject.other),
    ),
    types.objectProperty(
      types.stringLiteral('zero'),
      types.stringLiteral(pluralObject.zero),
    ),
  ];

  return types.ObjectExpression(properties);
}

/**
 * This class represents the value of a pluralized I18N translation.
 * A pluralized translation contains a string value for 'zero', 'one' and
 * 'other' keys.
 */
class PluralTranslationValue {
  /**
   * Takes an object of values to create the PluralTranslationValue.
   * @param {string} zero value for zero
   * @param {string} one value for one
   * @param {string} other value for other
   */
  static create({ one, other, zero }) {
    return new PluralTranslationValue({ one, other, zero });
  }

  constructor({ one, other, zero }) {
    this.zero = zero;
    this.one = one;
    this.other = other;
  }

  /**
   * Create an instance of `PluralTranslationValue` from a js object that has
   * has 'zero', 'one', 'other' keys.
   * @param {PluralTranslationObject} object with pluralization keys/values
   * @returns {PluralTranslationValue}
   */
  static ObjectInstance(pluralObject) {
    invariant(
      'zero' in pluralObject &&
        'one' in pluralObject &&
        'other' in pluralObject,
      `Error: a pluralized I18N translation requires text for {\`zero\`, \`one\`, and \`other\`}.`,
    );
    const { one, other, zero } = pluralObject;
    return new PluralTranslationValue({ one, other, zero });
  }

  /**
   * Create an instance of `PluralTranslationValue` from an ObjectExpression
   * created by the Babel parser.
   * @param {AST} node AST node of type ObjectExpression
   * https://github.com/babel/babel/blob/main/packages/babel-parser/ast/spec.md#objectexpression
   * @returns {PluralTranslationValue}
   */
  static ObjectExpressionInstance(node) {
    const i18nValue = objectExpressionToPluralTranslationObject(node);
    const { one, other, zero } = i18nValue;
    return new PluralTranslationValue({ one, other, zero });
  }

  getZero() {
    return this.zero;
  }

  getOne() {
    return this.one;
  }

  getOther() {
    return this.other;
  }

  /**
   * Return a representation of this class as a JS object.
   * @returns {PluralTranslationObject}
   */
  getObject() {
    return { one: this.one, other: this.other, zero: this.zero };
  }

  /**
   * Return a representation of this class as an AST node.
   * @returns {AST} node AST node of type ObjectExpression
   * https://github.com/babel/babel/blob/main/packages/babel-parser/ast/spec.md#objectexpression
   */
  getObjectExpression() {
    const properties = [
      types.objectProperty(
        types.stringLiteral('one'),
        types.stringLiteral(this.one),
      ),
      types.objectProperty(
        types.stringLiteral('other'),
        types.stringLiteral(this.other),
      ),
      types.objectProperty(
        types.stringLiteral('zero'),
        types.stringLiteral(this.zero),
      ),
    ];

    return types.ObjectExpression(properties);
  }

  /**
   * Returns a representation of this class that may be printed out.
   * @returns {string} representation of the class
   */
  asString() {
    return `\n\tzero: ${this.zero}\n\tone: ${this.one}\n\tother: ${this.other}\n`;
  }

  /**
   * Does the given `PluralTranslationValue` have the same key/values as this
   * instance?
   * @param {PluralTranslationValue}
   * @returns {boolean} true if PluralTranslationValues are equal
   */
  translationEquals(pluralValue) {
    return (
      pluralValue instanceof PluralTranslationValue &&
      pluralValue.getZero() === this.zero &&
      pluralValue.getOne() === this.one &&
      pluralValue.getOther() === this.other
    );
  }
}

module.exports = {
  PluralTranslationValue,
  objectExpressionToPluralTranslationObject,
  objectToObjectExpression,
};
