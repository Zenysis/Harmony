const invariant = require('invariant');
const types = require('@babel/types');

/**
 * Check if the AST node created by the Babel parser qualifies as a valid
 * singular translation value, i.e. a string.
 *
 * @param {AST} node AST node
 * @returns {boolean} true if AST node represents a valid singular translation
 */
function isSingularTranslation(node) {
  return types.isStringLiteral(node);
}

/**
 * Check if the AST node created by the Babel parser qualifies as a valid
 * singular translation value, i.e.
 * (a) The node is of type ObjectExpression
 * https://github.com/babel/babel/blob/main/packages/babel-parser/ast/spec.md#objectexpression
 * (b) That ObjectExpression contains 'zero', 'one', 'other' keys with
 * string values.
 *
 * @param {AST} node AST node
 * @returns {boolean} true if AST node represents a valid plural translation
 */
function isPluralTranslation(node) {
  if (types.isObjectExpression(node)) {
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
    invariant(
      i18nValue.one !== undefined &&
        i18nValue.other !== undefined &&
        i18nValue.zero !== undefined,
      `Pluralized value must include 'zero, 'one', and 'other' translation keys.`,
    );
    return true;
  }
  return false;
}

module.exports = { isPluralTranslation, isSingularTranslation };
