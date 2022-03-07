// @flow

/* eslint-disable */
import I18N from 'lib/I18N';
import i18n_components_AdminApp_ConfigurationTab_DataCatalogControlBlock from 'components/AdminApp/ConfigurationTab/DataCatalogControlBlock/i18n';
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
    Close: 'Close',
    Dashboards: 'Dashboards',
    Groups: 'Groups',
    Users: 'Users',
    confirmationModalDescription:
      'Closing this will remove any unsaved changes. Do you wish to proceed?',
    dataAccessDescription:
      'Select which data this role will grant access to when assigned to a user or group.',
    dataExportDisclaimer:
      'Note: users with permissions to this role may also gain data export access through another role.',
    nameDescription:
      'The role name is displayed when selecting roles to assign to users or groups and will be displayed besides user and group names throught the platform.',
    noRoleName: 'Cannot add or update role without a name.',
    sitewideDescription:
      'By default, users need to be invited to individual dashboards or alerts to gain access to them. The settings below allow you to make this role grant access to all dashboards or alerts in platform when assigned to a user or group.',
    toolsDescription:
      'Select which platform tools this role will grant access to when assigned to a user or group.',
    'Allow access to all %(dimensionText)s':
      'Allow access to all %(dimensionText)s',
    'Allow data exports (CSV, JSON)': 'Allow data exports (CSV, JSON)',
    'Create role': 'Create role',
    'Data access': 'Data access',
    'Data export': 'Data export',
    'Discard changes': 'Discard changes',
    'Edit role': 'Edit role',
    'Hide advanced options': 'Hide advanced options',
    'Role Management': 'Role Management',
    'Select %(dimensionText)s': 'Select %(dimensionText)s',
    'Select specific %(dimensionText)s': 'Select specific %(dimensionText)s',
    'Show advanced options': 'Show advanced options',
    'Site Configuration': 'Site Configuration',
    'Sitewide Item Access': 'Sitewide Item Access',
    'Tools access': 'Tools access',
    'data sources': 'data sources',
    'invalid-url': 'Invalid URL tab name. Defaulting to users tab.',
  },
  am: {},
  fr: {
    Groups: 'Groupes',
    Users: 'Utilisateurs',
    'Site Configuration': 'Configuration du Site',
  },
  pt: {
    Close: 'Fechar',
    Dashboards: 'Painéis',
    Groups: 'Grupos',
    Users: 'Utilizadores',
    confirmationModalDescription:
      'Fechar irá remover todas as alterações não guardadas. Deseja continuar?',
    dataAccessDescription:
      'Seleccione os dados a que esta função irá conceder acesso, quando atribuída a um utilizador ou grupo.',
    dataExportDisclaimer:
      'Nota: utilizadores com permissões para esse papel também pode ter acesso a exportação de dados através de um outro papel.',
    nameDescription:
      'O nome da função é exibida ao selecionar funções a serem atribuídas a utilizadores ou grupos e será exibido além de nomes de utilizadores e grupos durante toda a plataforma.',
    noRoleName: 'Não é possível adicionar ou actualizar uma função sem nome.',
    sitewideDescription:
      'Por padrão, os utilizadores precisam ser convidados para aceder a painéis ou alertas individuais. As configurações abaixo permitem que esta Função passe a garantir acesso a todos os painéis ou alertas na plataforma, quando atribuído a um utilizador ou grupo.',
    toolsDescription:
      'Escolha quais as ferramentas a que esta função irá conceder acesso, quando atribuído a um utilizador ou grupo.',
    'Allow data exports (CSV, JSON)': 'Permitir exportar dados (CSV, JSON)',
    'Create role': 'Criar Função',
    'Data access': 'Acesso de dados',
    'Data export': 'Exportar dados',
    'Discard changes': 'Descartar mudanças',
    'Edit role': 'Editar Função',
    'Hide advanced options': 'Ocultar opções avançadas',
    'Role Management': 'Administração de Funções',
    'Show advanced options': 'Mostrar opções avançadas',
    'Site Configuration': 'Configurações do Site',
    'Sitewide Item Access': 'Acesso ao item em todo o site',
    'Tools access': 'Acesso a Ferramentas',
    'data sources': 'fonte de dados',
    'invalid-url': 'URL inválido. Retornando para a guia do utilizador',
  },
};
I18N.mergeSupplementalTranslations(translations, [
  i18n_components_AdminApp_ConfigurationTab_DataCatalogControlBlock,
]);
export default translations;
