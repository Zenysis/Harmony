/**
 * Collection of all Zenysis lint rules
 */

const zenImportOrder = require('./lib/rules/zen-import-order');
const zenModelRequireReturnType = require('./lib/rules/zenmodel-require-return-type');

module.exports = {
  rules: {
    'zen-import-order': zenImportOrder,
    'zenmodel-require-return-type': zenModelRequireReturnType,
  },
};
