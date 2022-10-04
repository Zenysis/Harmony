const types = require('@babel/types');

// TODO(isabel) expand function to return non-String props as well

/**
 * Get the value of a prop of a given name from a list of JSX attributes
 * from an <I18N> component.
 *
 * @param {Array<ASTNode>} attributes Array of JSX Attributes
 * @param {string} propName The prop name whose value we want to extract
 * @param {string} filename The filename being processed
 * @returns {string | void} The value of the given `propName` if it exists
 */
function getPropStringFromI18NJSX(attributes, propName) {
  const prop = attributes.find(
    attr =>
      types.isJSXAttribute(attr) &&
      types.isJSXIdentifier(attr.name, { name: propName }),
  );

  if (prop) {
    const { value } = prop;
    if (types.isStringLiteral(value)) {
      return value.value;
    }
  }

  return undefined;
}

module.exports = getPropStringFromI18NJSX;
