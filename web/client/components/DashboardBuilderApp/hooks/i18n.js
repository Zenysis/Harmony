// @flow

/* eslint-disable */
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
    loadDashboardError:
      'There was an error retrieving and/or loading the Dashboard. Contact an Administrator for assistance. Details were written to the console.',
    saveDashboardError:
      'An error occurred while saving dashboard specification. Details were written to the console.',
    saveDashboardSuccess: 'Dashboard was successfully saved.',
  },
  am: {},
  fr: {
    loadDashboardError:
      'Une erreur est survenue lors de la récupération du tableau de bord. Contactez un administrateur pour obtenir de l’aide. Les détails ont été écrits sur la console.',
    saveDashboardError:
      'Une erreur s’est produite lors de la sauvegarde des spécifications du tableau de bord. Les détails ont été écrits sur la console.',
    saveDashboardSuccess: 'Le tableau de bord a été enregistré avec succès.',
  },
  pt: {
    loadDashboardError:
      'Houve um erro carregando o paínel. Contate um administrador para ajuda. Mais detalhes foram escritos no console.',
    saveDashboardError:
      'Houve um erro ao salvar as novas especificações do paínel. Mais detalhes foram escritos no console. ',
    saveDashboardSuccess: 'O Paínel foi salvo com sucesso. ',
  },
};
export default translations;
