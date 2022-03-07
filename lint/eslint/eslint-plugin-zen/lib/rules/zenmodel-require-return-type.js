/**
 * This rule requires that every function in every ZenModel class spec must
 * have return type annotations.
 */

// Returns true if we match with `// @flow` or `/* @flow */`. We're checking
// strictly that the annotation must be the very first line of a file.
function _isFlowFile(context) {
  const source = context.getSourceCode().text;
  return source.startsWith('// @flow') || source.startsWith('/* @flow */');
}

// Check if a node extends ZenModel, BaseModel
// HACK(pablo): we should not be hardcoding these values, but instead look at
// what `lib/Zen` or `lib/Zen/ZenModel` is imported as, and then check if
// any classes extend that import.
const ALLOWED_ZENMODEL_NAMES = new Set(['ZenModel', 'BaseModel']);
function _isZenModelClass(classNode) {
  const { superClass } = classNode;
  if (superClass && superClass.type === 'Identifier') {
    // Of the form `extends BaseModel`
    return ALLOWED_ZENMODEL_NAMES.has(superClass.name);
  }
  if (superClass && superClass.type === 'MemberExpression') {
    // Of the form `extends Zen.BaseModel`
    return (
      superClass.property.type === 'Identifier' &&
      ALLOWED_ZENMODEL_NAMES.has(superClass.property.name)
    );
  }
  return false;
}

function create(context) {
  // skip files that are not flow-typed
  if (!_isFlowFile(context)) {
    return {};
  }

  return {
    ClassDeclaration(node) {
      if (!_isZenModelClass(node)) {
        return;
      }

      const methods = node.body.body.filter(n => n.type === 'MethodDefinition');

      const arrowFunctions = node.body.body.filter(
        n =>
          n &&
          n.type === 'ClassProperty' &&
          n.value &&
          n.value.type === 'ArrowFunctionExpression',
      );

      // Raise an error for any methods that lack return type annotations
      methods.forEach(method => {
        const { returnType } = method.value;
        const { name } = method.key;
        if (
          !returnType ||
          (returnType && returnType.type !== 'TypeAnnotation')
        ) {
          context.report({
            node: method.key,
            message: `Function '${name}' is missing a return type annotation.`,
          });
        }
      });

      // Raise an error for any arrow functions that lack type annotations
      arrowFunctions.forEach(func => {
        const { typeAnnotation } = func;
        const { name } = func.key;
        if (
          !typeAnnotation ||
          (typeAnnotation && typeAnnotation.type !== 'TypeAnnotation')
        ) {
          context.report({
            node: func.key,
            message: `Arrow function '${name}' is missing type annotations.`,
          });
        }
      });
    },
  };
}

module.exports = { create };
