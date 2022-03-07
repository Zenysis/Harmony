// @flow
import type { TranslationDictionary } from 'lib/I18N';
/**
 * DO NOT:
 * 1. DO NOT touch the `en` object. AT ALL. This is entirely auto-generated from
 * our code. Do not change the string values. Do not add new keys.
 * 2. DO NOT add new locales manually. These are handled by our internal tools.
 *
 * DO:
 * 1. Update any non-`en` translations. Do not change their keys though.
 * 2. Add new non-`en` translations. But make sure their keys match their
 * English counterpart.
 */

const translations: TranslationDictionary = {
  en: {
    allResources: 'All resources',
    moveToFolder: 'Move to folder',
    '%(categoryName)s has been moved to %(newParentCategoryName)s':
      '%(categoryName)s has been moved to %(newParentCategoryName)s',
    'Create new group': 'Create new group',
    'Delete group': 'Delete group',
    'Move group to': 'Move group to',
    'Navigate to folder': 'Navigate to folder',
    'Rename group': 'Rename group',
  },
  am: {},
  fr: {},
  pt: {
    'Create new group': 'Criar novo grupo',
    'Delete group': 'Apagar grupo',
    'Move group to': 'Mover grupa para',
    'Rename group': 'Renomear grupo',
  },
};
export default translations;
