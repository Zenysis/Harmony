const invariant = require('invariant');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const types = require('@babel/types');

const TranslationGroup = require('../util/TranslationGroup');
const TranslationRecord = require('../util/TranslationRecord');
const {
  isPluralTranslation,
  isSingularTranslation,
} = require('../util/validateASTTranslations');
const {
  objectExpressionToPluralTranslationObject,
} = require('../util/PluralTranslationValue');
const { BABEL_OPTIONS } = require('../util/config');

const NEWLINE_REGEX = /(\r\n|\n|\r)/g;
const MULTISPACE_REGEX = /\s\s+/g;

/**
 * Get the value of a prop of a given name from a list of JSX attributes
 * from an <I18N> component.
 *
 * The value must be a string literal. This function will throw an error
 * otherwise.
 *
 * @param {Array<ASTNode>} attributes Array of JSX Attributes
 * @param {string} propName The prop name whose value we want to extract
 * @param {string} filename The filename being processed
 * @returns {string | void} The value of the given `propName` if it exists
 */
function _getPropStringFromI18NJSX(attributes, propName, filename) {
  invariant(
    attributes,
    `Internal error generating translations: expected an array of attributes, but instead received nothing.`,
  );

  const prop = attributes.find(
    attr =>
      types.isJSXAttribute(attr) &&
      types.isJSXIdentifier(attr.name, { name: propName }),
  );

  if (prop) {
    const { value } = prop;
    invariant(
      types.isStringLiteral(value),
      `Error processing ${filename}. The '${propName}' prop for <I18N> must be assigned a StringLiteral.`,
    );

    return value.value;
  }

  return undefined;
}

/**
 * Collects all translations from a file's source code by parsing uses of
 * <I18N> and I18N.text()
 *
 * @param {string} filename The filename being processed
 * @param {string} code The source code to parse
 * @returns {TranslationGroup} A translation group holding all
 * TranslationRecords for this file
 */
function collectTranslationsFromFile(filename, code) {
  const ast = parser.parse(code, BABEL_OPTIONS);
  const translations = [];

  // find uses of `<I18N>`, but NOT of `<I18N.Ref>`
  // find uses of `I18N.text()`, but NOT of `I18N.textById()`
  traverse(ast, {
    /**
     * Detect any uses of:
     *   - I18N.text('Text');
     *   - I18N.text('Text', 'my-id');
     */
    CallExpression(path) {
      const { callee } = path.node;

      // we will only inspect calls that are to `I18N.text`
      if (
        types.isMemberExpression(callee) &&
        types.isIdentifier(callee.object, { name: 'I18N' }) &&
        types.isIdentifier(callee.property, { name: 'text' })
      ) {
        // validate the translation text
        const contentArg = path.node.arguments[0];
        const idOrConfigArg = path.node.arguments[1];
        invariant(
          contentArg,
          `Error processing ${filename}. You cannot call I18N.text with no arguments.`,
        );
        invariant(
          isSingularTranslation(contentArg) || isPluralTranslation(contentArg),
          `Error processing ${filename}. The first arg to I18N.text must be a StringLiteral (singular) or ObjectExpression with appropriate keys (plural). Encountered ${contentArg.type} that did not adhere.`,
        );

        let i18nId;
        let i18nValue;

        if (isSingularTranslation(contentArg)) {
          // Singular translation
          i18nValue = contentArg.value;
          // Set `i18nId` to be equal to `i18nValue` for now.
          // Overwrite this if an id attribute is passed in the second argument.
          i18nId = i18nValue;
          // Validate the second argument: check if it is an id.
          if (types.isStringLiteral(idOrConfigArg)) {
            i18nId = idOrConfigArg.value;
          }
        } else {
          // Pluralized translation
          // If the first argument is an object, then the second argument must
          // be a string id.
          invariant(
            types.isStringLiteral(idOrConfigArg),
            `Error processing ${filename}. A pluralized call to I18N.text requires a second argument that is a StringLiteral id.`,
          );
          i18nId = idOrConfigArg.value;
          i18nValue = objectExpressionToPluralTranslationObject(contentArg);
        }

        translations.push(
          TranslationRecord.create({
            id: i18nId,
            value: i18nValue,
          }),
        );
      }
    },

    /**
     * Detect any uses of:
     *   - <I18N>Children</I18N>
     *   - <I18N id="my-id">Children</I18N>
     */
    JSXElement(path) {
      const { children, openingElement } = path.node;
      const { attributes, name } = openingElement;

      // we will only inspect elements that are `<I18N>`
      if (types.isJSXIdentifier(name, { name: 'I18N' })) {
        // validate children
        invariant(
          children.length !== 0,
          `Error processing ${filename}. An <I18N> component must have children.`,
        );
        invariant(
          children.length === 1,
          `Error processing ${filename}. An <I18N> component must only have 1 text child. Encountered ${children.length} children.`,
        );

        const child = children[0];
        invariant(
          types.isJSXText(child),
          `Error processing ${filename}. An <I18N> component must have a static text child, and cannot be dynamically computed. Encountered ${child.type} instead`,
        );

        // strip any newlines, and replace multiple spaces with a single space
        const i18nValue = child.value
          .replace(NEWLINE_REGEX, ' ')
          .trim()
          .replace(MULTISPACE_REGEX, ' ');

        const i18nId =
          _getPropStringFromI18NJSX(attributes, 'id', filename) || i18nValue;

        // finally add the translation to our list
        translations.push(
          TranslationRecord.create({
            id: i18nId,
            value: i18nValue,
          }),
        );
      }
    },
  });

  return TranslationGroup.create({ filename, translations });
}

module.exports = collectTranslationsFromFile;
