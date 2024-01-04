// @flow

/* eslint-disable */
import I18N from 'lib/I18N';
import i18n_components_ui_Dropdown_internal from 'components/ui/Dropdown/internal/i18n';
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
    emptyGroup: 'There are no options in this group',
    noOptions: 'There are no options to select',
    noSearch: 'Please enter a search term to see results',
    searchPlaceholder: 'Search...',
    selected: 'selected',
    'No results matched "%(searchText)s"':
      'No results matched "%(searchText)s"',
    'Select All': 'Select All',
  },
  pt: {
    emptyGroup: 'sem op\xE7oes neste grupo',
    noOptions: 'sem op\xE7oes para selecionar',
    noSearch:
      'Por favor introduza o termo da pesquisa para encontrar os resultados',
    searchPlaceholder: 'Procurar',
    selected: 'Selecionado',
    'No results matched "%(searchText)s"':
      'Nenhum resultado para "%(searchText)s"',
    'Select All': 'Seleccionar tudo',
  },
  vn: {
    emptyGroup: 'Kh\xF4ng c\xF3 t\xF9y ch\u1ECDn n\xE0o trong nh\xF3m n\xE0y',
    noOptions: 'Kh\xF4ng c\xF3 t\xF9y ch\u1ECDn n\xE0o \u0111\u1EC3 ch\u1ECDn',
    noSearch:
      'Vui l\xF2ng nh\u1EADp m\u1ED9t c\u1EE5m t\u1EEB t\xECm ki\u1EBFm \u0111\u1EC3 xem k\u1EBFt qu\u1EA3',
    searchPlaceholder: 'T\xECm ki\u1EBFm...',
    selected: '\u0111\xE3 ch\u1ECDn',
    'No results matched "%(searchText)s"':
      'Kh\xF4ng c\xF3 k\u1EBFt qu\u1EA3 n\xE0o ph\xF9 h\u1EE3p v\u1EDBi "%(searchText)s"',
    'Select All': 'Ch\u1ECDn t\u1EA5t c\u1EA3',
  },
  am: {
    emptyGroup: 'በዚህ ቡድን ውስጥ ምንም አማራጮች የሉም',
    noOptions: 'ለመምረጥ ምንም አማራጮች የሉም',
    noSearch: 'ውጤቱን ለማየት እባክዎ የፍለጋ ቃል ያስገቡ',
    searchPlaceholder: 'ፈልግ...',
    selected: 'ተመርጧል',
    'No results matched "%(searchText)s"': 'ምንም ውጤቶች አልተዛመዱም "%(searchText)s"',
    'Select All': 'ሁሉንም ምረጥ',
  },
  fr: {
    emptyGroup: 'Aucune option disponible dans ce groupe',
    noOptions: 'Il n’y a pas d’options à sélectionner',
    noSearch: 'Veuillez entrer un terme de recherche pour voir les résultats',
    searchPlaceholder: 'Recherche en cours de...',
    selected: 'sélectionné',
    'No results matched "%(searchText)s"':
      'Aucun résultat trouvé pour %(findText)s ""',
    'Select All': 'Sélectionnez tout',
  },
  br: {
    emptyGroup: 'N\xE3o h\xE1 op\xE7\xF5es neste grupo',
    noOptions: 'N\xE3o h\xE1 op\xE7\xF5es para serem selecionadas',
    noSearch: 'Por favor escreva o que pretende procurar',
    searchPlaceholder: 'Procurar...',
    selected: 'selecionado',
    'No results matched "%(searchText)s"':
      'Nenhum resultado para "%(searchText)s"',
    'Select All': 'Selecionar tudo',
  },
};
I18N.mergeSupplementalTranslations(translations, [
  i18n_components_ui_Dropdown_internal,
]);
export default translations;
