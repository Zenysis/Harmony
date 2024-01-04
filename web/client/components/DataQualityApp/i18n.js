// @flow

/* eslint-disable */
import I18N from 'lib/I18N';
import i18n_components_DataQualityApp_DataQualitySummary from 'components/DataQualityApp/DataQualitySummary/i18n';
import i18n_components_DataQualityApp_IndicatorCharacteristicsTab from 'components/DataQualityApp/IndicatorCharacteristicsTab/i18n';
import i18n_components_DataQualityApp_OutlierAnalysisTab from 'components/DataQualityApp/OutlierAnalysisTab/i18n';
import i18n_components_DataQualityApp_ReportingCompletenessTab from 'components/DataQualityApp/ReportingCompletenessTab/i18n';
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
    Categorical: 'Categorical',
    high: 'high',
    low: 'low',
    medium: 'medium',
    'Add Filter': 'Add Filter',
    'Select indicator': 'Select indicator',
    'The Quality Score is based on the following factors___':
      'The Quality Score is based on the following factors...',
    'very high': 'very high',
    'very low': 'very low',
  },
  pt: {
    Categorical: 'Categ\xF3rico',
    high: 'alto',
    low: 'baixo',
    medium: 'm\xE9dio',
    'Add Filter': 'Adicionar filtro',
    'Select indicator': 'Selecione o indicador',
    'The Quality Score is based on the following factors___':
      'O \xCDndice de qualidade \xE9 baseado nos seguintes fatores ...',
    'very high': 'muito alto',
    'very low': 'muito baixo',
  },
  vn: {
    Categorical: 'Ph\xE2n lo\u1EA1i',
    high: 'cao',
    low: 'Th\u1EA5p',
    medium: 'v\u1EEBa ph\u1EA3i',
    'Add Filter': 'Th\xEAm b\u1ED9 l\u1ECDc',
    'Select indicator': 'Ch\u1ECDn ch\u1EC9 s\u1ED1',
    'The Quality Score is based on the following factors___':
      '\u0110i\u1EC3m Ch\u1EA5t l\u01B0\u1EE3ng d\u1EF1a tr\xEAn c\xE1c y\u1EBFu t\u1ED1 sau ...',
    'very high': 'r\u1EA5t cao',
    'very low': 'r\u1EA5t th\u1EA5p',
  },
  am: {
    Categorical: 'ምድብ',
    high: 'ከፍተኛ',
    low: 'ዝቅተኛ',
    medium: 'መካከለኛ',
    'Add Filter': '\u121B\u1323\u122A\u12EB \u12EB\u12AD\u1209',
    'Select indicator':
      '\u12A0\u1218\u120D\u12AB\u127D \u12ED\u121D\u1228\u1321',
    'The Quality Score is based on the following factors___':
      'የጥራት ውጤቱ በሚከተሉት ሁኔታዎች ላይ የተመሰረተ ነው...',
    'very high': 'በጣም ከፍተኛ',
    'very low': 'በጣም ዝቅተኛ',
  },
  fr: {
    Categorical: 'Cat\xE9gorique',
    high: 'élevé',
    low: 'faible',
    medium: 'moyen',
    'Add Filter': 'Ajouter un filtre',
    'Select indicator': "S\xE9lectionner l'indicateur",
    'The Quality Score is based on the following factors___':
      'Le score de qualité est basé sur les facteurs suivants...',
    'very high': 'très élevé',
    'very low': 'très faible',
  },
  br: {
    Categorical: 'Categ\xF3rico',
    high: 'alto',
    low: 'baixo',
    medium: 'm\xE9dio',
    'Add Filter': 'Adicionar filtro',
    'Select indicator': 'Selecione o indicador',
    'The Quality Score is based on the following factors___':
      'O \xCDndice de qualidade \xE9 baseado nos seguintes fatores ...',
    'very high': 'muito alto',
    'very low': 'muito baixo',
  },
};
I18N.mergeSupplementalTranslations(translations, [
  i18n_components_DataQualityApp_DataQualitySummary,
  i18n_components_DataQualityApp_IndicatorCharacteristicsTab,
  i18n_components_DataQualityApp_OutlierAnalysisTab,
  i18n_components_DataQualityApp_ReportingCompletenessTab,
]);
export default translations;
