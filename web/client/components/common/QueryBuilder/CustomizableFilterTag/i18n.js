// @flow

/* eslint-disable */
import I18N from 'lib/I18N';
import i18n_components_common_QueryBuilder_CustomizableFilterTag_DateFilterCustomizationModule from 'components/common/QueryBuilder/CustomizableFilterTag/DateFilterCustomizationModule/i18n';
import i18n_components_common_QueryBuilder_CustomizableFilterTag_DimensionValueCustomizationModule from 'components/common/QueryBuilder/CustomizableFilterTag/DimensionValueCustomizationModule/i18n';
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
    lastGranularity: {
      one: 'Last %(count)s %(granularity)s',
      other: 'Last %(count)s %(granularity)ss',
      zero: 'Zero %(granularity)s',
    },
    'Check "NOT" filters in order to remove rows with the selected values from your query results':
      'Check "NOT" filters in order to remove rows with the selected values from your query results',
    'Customize group by': 'Customize group by',
    'Enable NOT filter': 'Enable NOT filter',
    'This %(granularity)s': 'This %(granularity)s',
  },
  pt: {
    lastGranularity: {
      one: '\xDAltima %(count)s %(granularity)s',
      other: '\xDAltima %(count)s %(granularity)ss',
      zero: 'Zero %(granularity)s',
    },
    'Check "NOT" filters in order to remove rows with the selected values from your query results':
      'Check "NOT" filtros para remover as linhas com os valores seleccionados dos resultados da sua consulta',
    'Customize group by': 'Personalizar grupo por',
    'Enable NOT filter': 'Activar o filtro N\xC3O',
    'This %(granularity)s': 'Esta %(granularity)s',
  },
  vn: {
    lastGranularity: {
      one: '%(count)s %(granularity)s cu\u1ED1i c\xF9ng',
      other: '%(count)s %(granularity)s cu\u1ED1i c\xF9ng',
      zero: 'Kh\xF4ng %(granularity)s',
    },
    'Check "NOT" filters in order to remove rows with the selected values from your query results':
      'Ch\u1ECDn b\u1ED9 l\u1ECDc "KH\xD4NG" \u0111\u1EC3 lo\u1EA1i b\u1ECF c\xE1c h\xE0ng c\xF3 gi\xE1 tr\u1ECB \u0111\xE3 ch\u1ECDn kh\u1ECFi k\u1EBFt qu\u1EA3 truy v\u1EA5n c\u1EE7a b\u1EA1n',
    'Customize group by': 'T\xF9y ch\u1EC9nh nh\xF3m theo',
    'Enable NOT filter': 'B\u1EADt b\u1ED9 l\u1ECDc KH\xD4NG',
    'This %(granularity)s': '%(granularity)s n\xE0y',
  },
  am: {
    lastGranularity: {
      one: 'የመጨረሻው %(count)s %(granularity)s',
      other: 'የመጨረሻው %(count)s %(granularity)s',
      zero: 'የመጨረሻው %(count)s %(granularity)s',
    },
    'Check "NOT" filters in order to remove rows with the selected values from your query results':
      'ከተመረጡት ውጤቶች ጋር ረድፎችን ከጥያቄዎ ውጤቶች ለማስወገድ የ"NOT" ማጣሪያዎችን ያረጋግጡ',
    'Customize group by': '\u1261\u12F5\u1295\u1295 \u12A0\u1260\u1305',
    'Enable NOT filter': 'ማጣሪያን አንቃ',
    'This %(granularity)s': 'ይህ %(granularity)s',
  },
  fr: {
    lastGranularity: {
      one: 'Dernier %(count)s\xA0%(granularity)s',
      other: 'Dernier %(count)s\xA0%(granularity)ss',
      zero: 'Z\xE9ro %(granularity)s',
    },
    'Check "NOT" filters in order to remove rows with the selected values from your query results':
      'Cochez "PAS" filtres afin de supprimer les lignes avec les valeurs sélectionnées de vos résultats de requête"',
    'Customize group by': 'Personnaliser le groupe par',
    'Enable NOT filter': 'Activer le filtre PAS',
    'This %(granularity)s': 'Cette %(granularity)s',
  },
  br: {
    lastGranularity: {
      one: '\xDAltima %(count)s %(granularity)s',
      other: '\xDAltima %(count)s %(granularity)ss',
      zero: 'Zero %(granularity)s',
    },
    'Check "NOT" filters in order to remove rows with the selected values from your query results':
      'Check "NOT" filtros para remover as linhas com os valores seleccionados dos resultados da sua consulta',
    'Customize group by': 'Personalizar grupo por',
    'Enable NOT filter': 'Activar o filtro NÃO',
    'This %(granularity)s': 'Esta %(granularity)s',
  },
};
I18N.mergeSupplementalTranslations(translations, [
  i18n_components_common_QueryBuilder_CustomizableFilterTag_DateFilterCustomizationModule,
  i18n_components_common_QueryBuilder_CustomizableFilterTag_DimensionValueCustomizationModule,
]);
export default translations;
