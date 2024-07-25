// @flow

/* eslint-disable */
import I18N from 'lib/I18N';
import i18n_components_AdminApp_AccessSelectionView from 'components/AdminApp/AccessSelectionView/i18n';
import i18n_components_AdminApp_ConfigurationTab from 'components/AdminApp/ConfigurationTab/i18n';
import i18n_components_AdminApp_GroupsTab from 'components/AdminApp/GroupsTab/i18n';
import i18n_components_AdminApp_RoleManagementTab from 'components/AdminApp/RoleManagementTab/i18n';
import i18n_components_AdminApp_UsersTab from 'components/AdminApp/UsersTab/i18n';
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
    Alerts: 'Alerts',
    Cancel: 'Cancel',
    Close: 'Close',
    Dashboards: 'Dashboards',
    Groups: 'Groups',
    Sending___: 'Sending...',
    Users: 'Users',
    active: 'Active',
    alertAdmin: 'Alert Admin',
    alertEditor: 'Alert Editor',
    alertRequireInvite:
      'Require invite to view, edit or admin individual alerts',
    alertViewer: 'Alert Viewer',
    dashboardAdmin: 'Dashboard Admin',
    dashboardEditor: 'Dashboard Editor',
    dashboardRequireInvite:
      'Require invite to view, edit or admin individual dashboards',
    dashboardViewer: 'Dashboard Viewer',
    dataAccessDescription:
      'Select which data this role will grant access to when assigned to a user or group.',
    dataExportDisclaimer:
      'Note: users with permissions to this role may also gain data export access through another role.',
    datasourceCount: {
      one: '1 data source',
      other: '%(count)s data sources',
      zero: 'No data sources',
    },
    dimensionCount: {
      one: '1 %(dimensionName)s',
      other: '%(count)s %(dimensionName)ss',
      zero: 'No %(dimensionName)ss',
    },
    firstName: 'First Name',
    geographyCount: {
      one: '1 geography',
      other: '%(count)s geographies',
      zero: 'No geographies',
    },
    inactive: 'Inactive',
    lastName: 'Last Name',
    nameDescription:
      'The role name is displayed when selecting roles to assign to users or groups and will be displayed besides user and group names throught the platform.',
    noRoleName: 'Cannot add or update role without a name.',
    pending: 'Pending',
    siteAdminTitleTooltip: 'This role cannot be modified or deleted',
    sitewideDescription:
      'By default, users need to be invited to individual dashboards or alerts to gain access to them. The settings below allow you to make this role grant access to all dashboards or alerts in platform when assigned to a user or group.',
    toolsDescription:
      'Select which platform tools this role will grant access to when assigned to a user or group.',
    userRoles: 'User Roles',
    'All %(dimensionName)ss': 'All %(dimensionName)ss',
    'All Users': 'All Users',
    'All data sources': 'All data sources',
    'All geographies': 'All geographies',
    'Allow access to all %(dimensionText)s':
      'Allow access to all %(dimensionText)s',
    'Allow data exports (CSV, JSON)': 'Allow data exports (CSV, JSON)',
    'Closing this will remove any unsaved changes_ Do you wish to proceed?':
      'Closing this will remove any unsaved changes. Do you wish to proceed?',
    'Could not invite user because user already exists_':
      'Could not invite user because user already exists.',
    'Could not invite user_': 'Could not invite user.',
    'Create role': 'Create role',
    'Data access': 'Data access',
    'Data export': 'Data export',
    'Data quality': 'Data quality',
    'Discard changes': 'Discard changes',
    'Edit role': 'Edit role',
    'Enter email': 'Enter email',
    'Enter name': 'Enter name',
    'Force Delete': 'Force Delete',
    'Hide advanced options': 'Hide advanced options',
    'Invite User': 'Invite User',
    'Phone Number': 'Phone Number',
    'Role Management': 'Role Management',
    'Select %(dimensionText)s': 'Select %(dimensionText)s',
    'Select specific %(dimensionText)s': 'Select specific %(dimensionText)s',
    'Show advanced options': 'Show advanced options',
    'Site Configuration': 'Site Configuration',
    'Sitewide Item Access': 'Sitewide Item Access',
    'Successfully invited user_': 'Successfully invited user.',
    'Take ownership of the following resources:':
      'Take ownership of the following resources:',
    'Tools access': 'Tools access',
    'Transfer and Delete': 'Transfer and Delete',
    'data sources': 'data sources',
    'invalid-url': 'Invalid URL tab name. Defaulting to users tab.',
  },
  pt: {
    Alerts: 'Alertas',
    Cancel: 'cancelar',
    Close: 'Fechar',
    Dashboards: 'Pain\xE9is',
    Groups: 'Grupos',
    Sending___: 'Enviando...',
    Users: 'Utilizadores',
    active: 'Activo',
    alertAdmin: 'Administrador de Alerta',
    alertEditor: 'Editor de Alerta',
    alertRequireInvite:
      'Exigir convite para visualizar, editar ou administrar alertas individuais',
    alertViewer: 'Visualizador de Alerta',
    dashboardAdmin: 'Administrador de Painel',
    dashboardEditor: 'Editor de Painel',
    dashboardRequireInvite:
      'Exigir convite para visualizar, editar ou administrar pain\xE9is individuais',
    dashboardViewer: 'Visualizador de Painel',
    dataAccessDescription:
      'Seleccione os dados a que esta fun\xE7\xE3o ir\xE1 conceder acesso, quando atribu\xEDda a um utilizador ou grupo.',
    dataExportDisclaimer:
      'Nota: utilizadores com permiss\xF5es para esse papel tamb\xE9m pode ter acesso a exporta\xE7\xE3o de dados atrav\xE9s de um outro papel.',
    datasourceCount: {
      one: '1 fonte de dados',
      other: '%(count)s fontes de dados',
      zero: 'Nenhuma fonte de dados',
    },
    dimensionCount: {
      one: '1 %(dimensionName)s',
      other: '%(count)s %(dimensionName)ss',
      zero: 'Sem %(dimensionName)ss',
    },
    firstName: 'Primeiro Nome',
    geographyCount: {
      one: '1 geografia',
      other: '%(count)s geografias',
      zero: 'Nenhuma geografia',
    },
    inactive: 'Inactivo',
    lastName: '\xDAltimo nome',
    nameDescription:
      'O nome da fun\xE7\xE3o \xE9 exibida ao selecionar fun\xE7\xF5es a serem atribu\xEDdas a utilizadores ou grupos e ser\xE1 exibido al\xE9m de nomes de utilizadores e grupos durante toda a plataforma.',
    noRoleName:
      'N\xE3o \xE9 poss\xEDvel adicionar ou actualizar uma fun\xE7\xE3o sem nome.',
    pending: 'Pendente',
    siteAdminTitleTooltip:
      'Esta fun\xE7\xE3o n\xE3o pode ser modificada ou exclu\xEDda',
    sitewideDescription:
      'Por padr\xE3o, os utilizadores precisam ser convidados para aceder a pain\xE9is ou alertas individuais. As configura\xE7\xF5es abaixo permitem que esta Fun\xE7\xE3o passe a garantir acesso a todos os pain\xE9is ou alertas na plataforma, quando atribu\xEDdo a um utilizador ou grupo.',
    toolsDescription:
      'Escolha quais as ferramentas a que esta fun\xE7\xE3o ir\xE1 conceder acesso, quando atribu\xEDdo a um utilizador ou grupo.',
    userRoles: 'Fun\xE7\xF5es do usu\xE1rio',
    'All %(dimensionName)ss': 'Todos %(dimensionName)ss',
    'All Users': 'Todos utilizadores',
    'All data sources': 'Todas as fontes de dados',
    'All geographies': 'Todas as geografias',
    'Allow access to all %(dimensionText)s':
      'Permitir o acesso a todos os %(dimensionText)s',
    'Allow data exports (CSV, JSON)': 'Permitir exportar dados (CSV, JSON)',
    'Closing this will remove any unsaved changes_ Do you wish to proceed?':
      'Fechar ir\xE1 remover todas as altera\xE7\xF5es n\xE3o guardadas. Deseja continuar?',
    'Could not invite user because user already exists_':
      'N\xE3o foi Poss\xEDvel convidar o utilizador Porque o utilizador J\xE1 Existe.',
    'Could not invite user_': 'N\xE3o foi poss\xEDvel convidar o utilizador.',
    'Create role': 'Criar Fun\xE7\xE3o',
    'Data access': 'Acesso de dados',
    'Data export': 'Exportar dados',
    'Data quality': 'Qualidade dos dados',
    'Discard changes': 'Descartar mudan\xE7as',
    'Edit role': 'Editar Fun\xE7\xE3o',
    'Enter email': 'Escreva o email',
    'Enter name': 'Escreva o nome',
    'Force Delete': 'Apagar',
    'Hide advanced options': 'Ocultar op\xE7\xF5es avan\xE7adas',
    'Invite User': 'Convidar utilizador',
    'Phone Number': 'N\xFAmero de telefone',
    'Role Management': 'Administra\xE7\xE3o de Fun\xE7\xF5es',
    'Select %(dimensionText)s': 'Selecione %(dimensionText)s',
    'Select specific %(dimensionText)s':
      'Selecione %(dimensionText)s espec\xEDficos',
    'Show advanced options': 'Mostrar op\xE7\xF5es avan\xE7adas',
    'Site Configuration': 'Configura\xE7\xF5es do Site',
    'Sitewide Item Access': 'Acesso ao item em todo o site',
    'Successfully invited user_': 'Utilizador convidado com sucesso',
    'Take ownership of the following resources:':
      'Assumir a propriedade dos seguintes recursos:',
    'Tools access': 'Acesso a Ferramentas',
    'Transfer and Delete': 'Transferir e apagar',
    'data sources': 'fonte de dados',
    'invalid-url': 'URL inv\xE1lido. Retornando para a guia do utilizador',
  },
  vn: {
    Alerts: 'C\u1EA3nh b\xE1o',
    Cancel: 'H\u1EE7y',
    Close: '\u0110\xF3ng',
    Dashboards: 'Trang t\u1ED5ng quan',
    Groups: 'C\xE1c nh\xF3m',
    Sending___: 'G\u1EEDi...',
    Users: 'Ng\u01B0\u1EDDi d\xF9ng',
    active: 'Ho\u1EA1t \u0111\u1ED9ng',
    alertAdmin: 'Qu\u1EA3n tr\u1ECB vi\xEAn c\u1EA3nh b\xE1o',
    alertEditor: 'Ch\u1EC9nh s\u1EEDa vi\xEAn c\u1EA3nh b\xE1o',
    alertRequireInvite:
      'Y\xEAu c\u1EA7u l\u1EDDi m\u1EDDi \u0111\u1EC3 xem, ch\u1EC9nh s\u1EEDa ho\u1EB7c qu\u1EA3n tr\u1ECB c\xE1c c\u1EA3nh b\xE1o ri\xEAng l\u1EBB',
    alertViewer: 'Tr\xECnh xem c\u1EA3nh b\xE1o',
    dashboardAdmin: 'Qu\u1EA3n tr\u1ECB vi\xEAn trang t\u1ED5ng quan',
    dashboardEditor: 'Ch\u1EC9nh s\u1EEDa vi\xEAn trang t\u1ED5ng quan',
    dashboardRequireInvite:
      'Y\xEAu c\u1EA7u l\u1EDDi m\u1EDDi xem, ch\u1EC9nh s\u1EEDa ho\u1EB7c qu\u1EA3n tr\u1ECB trang t\u1ED5ng quan ri\xEAng l\u1EBB',
    dashboardViewer: 'Tr\xECnh xem trang t\u1ED5ng quan',
    dataAccessDescription:
      'Ch\u1ECDn d\u1EEF li\u1EC7u m\xE0 vai tr\xF2 n\xE0y s\u1EBD c\u1EA5p quy\u1EC1n truy c\u1EADp khi \u0111\u01B0\u1EE3c ch\u1EC9 \u0111\u1ECBnh cho ng\u01B0\u1EDDi d\xF9ng ho\u1EB7c nh\xF3m.',
    dataExportDisclaimer:
      'L\u01B0u \xFD: ng\u01B0\u1EDDi d\xF9ng c\xF3 quy\u1EC1n \u0111\u1ED1i v\u1EDBi vai tr\xF2 n\xE0y c\u0169ng c\xF3 th\u1EC3 c\xF3 quy\u1EC1n truy c\u1EADp xu\u1EA5t d\u1EEF li\u1EC7u th\xF4ng qua vai tr\xF2 kh\xE1c.',
    datasourceCount: {
      one: '1 ngu\u1ED3n d\u1EEF li\u1EC7u',
      other: '%(count)s ngu\u1ED3n d\u1EEF li\u1EC7u',
      zero: 'Kh\xF4ng c\xF3 ngu\u1ED3n d\u1EEF li\u1EC7u',
    },
    dimensionCount: {
      one: '1 %(dimensionName)s',
      other: '%(count)s %(dimensionName)ss',
      zero: 'Kh\xF4ng %(dimensionName)ss',
    },
    firstName: 'T\xEAn',
    geographyCount: {
      one: '1 \u0111\u1ECBa l\xFD',
      other: '%(count)s khu v\u1EF1c \u0111\u1ECBa l\xFD',
      zero: 'Kh\xF4ng c\xF3 khu v\u1EF1c \u0111\u1ECBa l\xFD',
    },
    inactive: 'Kh\xF4ng ho\u1EA1t \u0111\u1ED9ng',
    lastName: 'H\u1ECD',
    nameDescription:
      'T\xEAn vai tr\xF2 \u0111\u01B0\u1EE3c hi\u1EC3n th\u1ECB khi ch\u1ECDn vai tr\xF2 \u0111\u1EC3 g\xE1n cho ng\u01B0\u1EDDi d\xF9ng ho\u1EB7c nh\xF3m v\xE0 s\u1EBD \u0111\u01B0\u1EE3c hi\u1EC3n th\u1ECB b\xEAn c\u1EA1nh t\xEAn ng\u01B0\u1EDDi d\xF9ng v\xE0 nh\xF3m tr\xEAn n\u1EC1n t\u1EA3ng.',
    noRoleName:
      'Kh\xF4ng th\u1EC3 th\xEAm ho\u1EB7c c\u1EADp nh\u1EADt vai tr\xF2 m\xE0 kh\xF4ng c\xF3 t\xEAn.',
    pending: 'Ch\u01B0a gi\u1EA3i quy\u1EBFt',
    siteAdminTitleTooltip:
      'Kh\xF4ng th\u1EC3 s\u1EEDa \u0111\u1ED5i ho\u1EB7c x\xF3a vai tr\xF2 n\xE0y',
    sitewideDescription:
      'Theo m\u1EB7c \u0111\u1ECBnh, ng\u01B0\u1EDDi d\xF9ng c\u1EA7n \u0111\u01B0\u1EE3c m\u1EDDi v\xE0o t\u1EEBng trang t\u1ED5ng quan ho\u1EB7c c\u1EA3nh b\xE1o \u0111\u1EC3 c\xF3 quy\u1EC1n truy c\u1EADp v\xE0o ch\xFAng. C\xE0i \u0111\u1EB7t b\xEAn d\u01B0\u1EDBi cho ph\xE9p b\u1EA1n th\u1EF1c hi\u1EC7n vai tr\xF2 n\xE0y, c\u1EA5p quy\u1EC1n truy c\u1EADp v\xE0o t\u1EA5t c\u1EA3 c\xE1c trang t\u1ED5ng quan ho\u1EB7c c\u1EA3nh b\xE1o trong n\u1EC1n t\u1EA3ng khi \u0111\u01B0\u1EE3c ch\u1EC9 \u0111\u1ECBnh cho ng\u01B0\u1EDDi d\xF9ng ho\u1EB7c nh\xF3m.',
    toolsDescription:
      'Ch\u1ECDn c\xF4ng c\u1EE5 n\u1EC1n t\u1EA3ng n\xE0o m\xE0 vai tr\xF2 n\xE0y s\u1EBD c\u1EA5p quy\u1EC1n truy c\u1EADp khi \u0111\u01B0\u1EE3c ch\u1EC9 \u0111\u1ECBnh cho ng\u01B0\u1EDDi d\xF9ng ho\u1EB7c nh\xF3m.',
    userRoles: 'Vai tr\xF2 ng\u01B0\u1EDDi d\xF9ng',
    'All %(dimensionName)ss': 'T\u1EA5t c\u1EA3 %(dimensionName)ss',
    'All Users': 'T\u1EA5t c\u1EA3 ng\u01B0\u1EDDi s\u1EED d\u1EE5ng',
    'All data sources': 'T\u1EA5t c\u1EA3 c\xE1c ngu\u1ED3n d\u1EEF li\u1EC7u',
    'All geographies':
      'T\u1EA5t c\u1EA3 c\xE1c khu v\u1EF1c \u0111\u1ECBa l\xFD',
    'Allow access to all %(dimensionText)s':
      'Cho ph\xE9p truy c\u1EADp v\xE0o t\u1EA5t c\u1EA3 %(dimensionText)s',
    'Allow data exports (CSV, JSON)':
      'Cho ph\xE9p xu\u1EA5t d\u1EEF li\u1EC7u (CSV, JSON)',
    'Closing this will remove any unsaved changes_ Do you wish to proceed?':
      '\u0110\xF3ng \u0111i\u1EC1u n\xE0y s\u1EBD x\xF3a m\u1ECDi thay \u0111\u1ED5i ch\u01B0a \u0111\u01B0\u1EE3c l\u01B0u. B\u1EA1n c\xF3 mu\u1ED1n ti\u1EBFp t\u1EE5c?',
    'Could not invite user because user already exists_':
      'Kh\xF4ng th\u1EC3 m\u1EDDi ng\u01B0\u1EDDi d\xF9ng v\xEC ng\u01B0\u1EDDi d\xF9ng \u0111\xE3 t\u1ED3n t\u1EA1i.',
    'Could not invite user_':
      'Kh\xF4ng th\u1EC3 m\u1EDDi ng\u01B0\u1EDDi d\xF9ng.',
    'Create role': 'T\u1EA1o vai tr\xF2',
    'Data access': 'Truy c\u1EADp d\u1EEF li\u1EC7u',
    'Data export': 'Xu\u1EA5t d\u1EEF li\u1EC7u',
    'Data quality': 'Ch\u1EA5t l\u01B0\u1EE3ng d\u1EEF li\u1EC7u',
    'Discard changes': 'Lo\u1EA1i b\u1ECF nh\u1EEFng thay \u0111\u1ED5i',
    'Edit role': 'Ch\u1EC9nh s\u1EEDa vai tr\xF2',
    'Enter email': 'Nh\u1EADp email',
    'Enter name': 'Nh\u1EADp t\xEAn',
    'Force Delete': 'Bu\u1ED9c x\xF3a',
    'Hide advanced options': '\u1EA8n c\xE1c t\xF9y ch\u1ECDn n\xE2ng cao',
    'Invite User': 'M\u1EDDi ng\u01B0\u1EDDi d\xF9ng',
    'Phone Number': 'S\u1ED1 \u0111i\u1EC7n tho\u1EA1i',
    'Role Management': 'Qu\u1EA3n l\xFD vai tr\xF2',
    'Select %(dimensionText)s': 'Ch\u1ECDn %(dimensionText)s',
    'Select specific %(dimensionText)s':
      'Ch\u1ECDn %(dimensionText)s c\u1EE5 th\u1EC3',
    'Show advanced options':
      'Hi\u1EC3n th\u1ECB c\xE1c t\xF9y ch\u1ECDn n\xE2ng cao',
    'Site Configuration': 'C\u1EA5u h\xECnh trang web',
    'Sitewide Item Access':
      'Quy\u1EC1n truy c\u1EADp m\u1EE5c tr\xEAn trang web',
    'Successfully invited user_':
      '\u0110\xE3 m\u1EDDi th\xE0nh c\xF4ng ng\u01B0\u1EDDi d\xF9ng.',
    'Take ownership of the following resources:':
      'C\xF3 quy\u1EC1n s\u1EDF h\u1EEFu c\xE1c t\xE0i nguy\xEAn sau:',
    'Tools access': 'Quy\u1EC1n truy c\u1EADp c\xF4ng c\u1EE5',
    'Transfer and Delete': 'Chuy\u1EC3n v\xE0 X\xF3a',
    'data sources': 'ngu\u1ED3n d\u1EEF li\u1EC7u',
    'invalid-url':
      'T\xEAn tab URL kh\xF4ng h\u1EE3p l\u1EC7. M\u1EB7c \u0111\u1ECBnh cho tab ng\u01B0\u1EDDi d\xF9ng.',
  },
  am: {
    Alerts: '\u121B\u1295\u1242\u12EB\u12CE\u127D',
    Cancel: '\u1230\u122D\u12DD',
    Close: '\u12ED\u12D8\u1309',
    Dashboards: '\u12F3\u123D\u1266\u122D\u12F6\u127D',
    Groups: '\u1261\u12F5\u1296\u127D',
    Sending___: 'በመላክ ላይ...',
    Users: '\u1270\u1320\u1243\u121A\u12CE\u127D',
    active: 'ንቁ',
    alertAdmin: '\u121B\u1295\u1242\u12EB \u12A0\u1235\u1270\u12F3\u12F3\u122A',
    alertEditor: '\u121B\u1295\u1242\u12EB \u12A4\u12F2\u1270\u122D',
    alertRequireInvite:
      '\u12E8\u130D\u1208\u1230\u1265 \u121B\u1295\u1242\u12EB\u12CE\u127D\u1295 \u1208\u121B\u12E8\u1275\u1363 \u1208\u121B\u12F0\u1235 \u12C8\u12ED\u121D \u1208\u121B\u1235\u1270\u12F3\u12F0\u122D \u130D\u1265\u12E3 \u12ED\u1320\u12ED\u1243\u120D',
    alertViewer: '\u121B\u1295\u1242\u12EB \u1270\u1218\u120D\u12AB\u127D',
    dashboardAdmin:
      '\u12F3\u123D\u1266\u122D\u12F5 \u12A0\u1235\u1270\u12F3\u12F3\u122A',
    dashboardEditor: '\u12F3\u123D\u1266\u122D\u12F5 \u12A4\u12F2\u1270\u122D',
    dashboardRequireInvite:
      '\u12F3\u123D\u1266\u122D\u12F6\u127D\u1295 \u1208\u121B\u12E8\u1275\u1363 \u1208\u121B\u12F0\u1235 \u12C8\u12ED\u121D \u1208\u121B\u1235\u1270\u12F3\u12F0\u122D \u1218\u130B\u1260\u12DD \u12EB\u1235\u134D\u120D\u130B\u120D',
    dashboardViewer:
      '\u12F3\u123D\u1266\u122D\u12F5 \u1218\u1218\u120D\u12A8\u127B',
    dataAccessDescription:
      '\u12ED\u1205 \u121A\u1293 \u1208\u1270\u1320\u1243\u121A \u12C8\u12ED\u121D \u1261\u12F5\u1295 \u1232\u1218\u12F0\u1265 \u12E8\u1275\u129B\u12CD\u1295 \u12CD\u1202\u1265 \u12A5\u1295\u12F0\u121A\u1230\u1325 \u12ED\u121D\u1228\u1321\u1362',
    dataExportDisclaimer:
      '\u121B\u1235\u1273\u12C8\u123B\u1361 \u12E8\u12DA\u1205 \u121A\u1293 \u134D\u1243\u12F5 \u12EB\u120B\u1278\u12CD \u1270\u1320\u1243\u121A\u12CE\u127D \u1260\u120C\u120B \u121A\u1293 \u12E8\u12CD\u1202\u1265 \u12C8\u12F0 \u12CD\u132A \u1218\u120B\u12AD\u121D \u120A\u12EB\u1308\u1299 \u12ED\u127D\u120B\u1209\u1362',
    datasourceCount: {
      one: '1 \u12E8\u12F3\u1273 \u121D\u1295\u132D',
      other: '%(count)s \u12E8\u12F3\u1273 \u121D\u1295\u132E\u127D',
      zero:
        '\u121D\u1295\u121D \u12E8\u1218\u1228\u1303 \u121D\u1295\u132E\u127D \u12E8\u1209\u121D',
    },
    dimensionCount: {
      one: '1 %(dimensionName)s',
      other: '%(count)s %(dimensionName)ss',
      zero: '\u12E8\u1208\u121D %(dimensionName)ss',
    },
    firstName: 'የመጀመሪያ ስም',
    geographyCount: {
      one: '1 \u1302\u12A6\u130D\u122B\u134A',
      other: '%(count)s \u1302\u12A6\u130D\u122B\u134A\u12CE\u127D',
      zero:
        '\u121D\u1295\u121D \u1302\u12A6\u130D\u122B\u134A\u12CE\u127D \u12E8\u1209\u121D',
    },
    inactive: 'እንቅስቃሴ-አልባ',
    lastName: 'ያባት ስም',
    nameDescription:
      '\u121A\u1293 \u1235\u1219 \u1208\u1270\u1320\u1243\u121A\u12CE\u127D \u12C8\u12ED\u121D \u1261\u12F5\u1296\u127D \u1208\u1218\u1218\u12F0\u1265 \u121A\u1293\u12CE\u127D \u1232\u1218\u1228\u1325 \u12ED\u1273\u12EB\u120D \u12A5\u1293 \u12A8\u1270\u1320\u1243\u121A \u12A5\u1293 \u12E8\u1261\u12F5\u1295 \u1235\u121E\u127D \u1260\u1270\u1328\u121B\u122A \u1260\u1218\u12F5\u1228\u12A9 \u120B\u12ED \u12ED\u1273\u12EB\u120D\u1362',
    noRoleName:
      '\u12EB\u1208 \u1235\u121D \u121A\u1293 \u121B\u12A8\u120D \u12C8\u12ED\u121D \u121B\u12D8\u1218\u1295 \u12A0\u12ED\u127B\u120D\u121D\u1362',
    pending: 'በመጠባበቅ ላይ',
    siteAdminTitleTooltip: 'ይህ ሚና ሊቀየር ወይም ሊሰረዝ አይችልም።',
    sitewideDescription:
      '\u1260\u1290\u1263\u122A\u1290\u1275 \u1270\u1320\u1243\u121A\u12CE\u127D \u12A5\u1290\u1231\u1295 \u1208\u121B\u130D\u1298\u1275 \u12C8\u12F0 \u1290\u1320\u120B \u12F3\u123D\u1266\u122D\u12F6\u127D \u12C8\u12ED\u121D \u121B\u1295\u1242\u12EB\u12CE\u127D \u1218\u130B\u1260\u12DD \u12A0\u1208\u1263\u1278\u12CD\u1362 \u12A8\u1273\u127D \u12EB\u1209\u1275 \u1245\u1295\u1305\u1276\u127D \u12ED\u1205\u1295\u1295 \u121A\u1293 \u1208\u1270\u1320\u1243\u121A \u12C8\u12ED\u121D \u1261\u12F5\u1295 \u1232\u1218\u12F0\u1261 \u12E8\u1201\u1209\u1295\u121D \u12F3\u123D\u1266\u122D\u12F6\u127D \u12C8\u12ED\u121D \u121B\u1295\u1242\u12EB\u12CE\u127D \u1260\u1218\u12F5\u1228\u12AD \u120B\u12ED \u12A5\u1295\u12F2\u12F0\u122D\u1231 \u12EB\u1235\u127D\u1209\u12CE\u1273\u120D\u1362',
    toolsDescription:
      '\u12ED\u1205 \u121A\u1293 \u1208\u1270\u1320\u1243\u121A \u12C8\u12ED\u121D \u1261\u12F5\u1295 \u1232\u1218\u12F0\u1265 \u12E8\u1275\u129B\u12CE\u1279\u1295 \u12E8\u1218\u1233\u122A\u12EB \u1235\u122D\u12D3\u1275 \u1218\u1233\u122A\u12EB\u12CE\u127D \u12A5\u1295\u12F0\u121A\u1230\u1325 \u12ED\u121D\u1228\u1321\u1362',
    userRoles: 'የተጠቃሚ ሚናዎች',
    'All %(dimensionName)ss': '\u1201\u1209\u121D %(dimensionName)ss',
    'All Users': 'ሁሉም ተጠቃሚዎች',
    'All data sources':
      '\u1201\u1209\u121D \u12E8\u12F3\u1273 \u121D\u1295\u132E\u127D',
    'All geographies':
      '\u1201\u1209\u121D \u1302\u12A6\u130D\u122B\u134A\u12CE\u127D',
    'Allow access to all %(dimensionText)s':
      '\u1208\u1201\u1209\u121D %(dimensionText)s \u12ED\u134D\u1240\u12F1',
    'Allow data exports (CSV, JSON)':
      '\u12E8\u12F3\u1273 \u1218\u120B\u12AD \u134D\u1240\u12F5 (CSV\u1363 JSON)',
    'Closing this will remove any unsaved changes_ Do you wish to proceed?':
      '\u12ED\u1205\u1295\u1295 \u1218\u12DD\u130B\u1275 \u12EB\u120D\u1270\u1240\u1218\u1321 \u1208\u12CD\u1326\u127D\u1295 \u12EB\u1235\u12C8\u130D\u12F3\u120D\u1362 \u1218\u1240\u1320\u120D \u12ED\u1348\u120D\u130B\u1209?',
    'Could not invite user because user already exists_':
      'ተጠቃሚ አስቀድሞ ስላለ ተጠቃሚን መጋበዝ አልተቻለም።',
    'Could not invite user_': 'ተጠቃሚን መጋበዝ አልተቻለም።',
    'Create role': '\u121A\u1293 \u12ED\u134D\u1320\u1229',
    'Data access': '\u12E8\u12F3\u1273 \u12A0\u12AD\u1230\u1235',
    'Data export': '\u12F3\u1273 \u12C8\u12F0 \u12CD\u132D \u1218\u120B\u12AD',
    'Data quality': '\u12E8\u12F3\u1273 \u1325\u122B\u1275',
    'Discard changes':
      '\u1208\u12CD\u1326\u127D\u1295 \u12A0\u1235\u12C8\u130D\u12F5',
    'Edit role': '\u121A\u1293 \u12EB\u12F5\u1231',
    'Enter email': 'ኢሜይል አስገባ',
    'Enter name': 'ስም አስገባ',
    'Force Delete': '\u12A0\u1235\u1308\u12F5\u12F0 \u1230\u122D\u12DD',
    'Hide advanced options':
      '\u12E8\u120B\u1241 \u12A0\u121B\u122B\u132E\u127D\u1295 \u12F0\u1265\u1245',
    'Invite User': 'ተጠቃሚን ይጋብዙ',
    'Phone Number': 'ስልክ ቁጥር',
    'Role Management':
      '\u12E8\u121A\u1293 \u12A0\u1235\u1270\u12F3\u12F0\u122D',
    'Select %(dimensionText)s':
      '%(DimensionText)s \u1295 \u12ED\u121D\u1228\u1321',
    'Select specific %(dimensionText)s':
      '\u12E8\u1270\u12C8\u1230\u1290 %(dimensionText)s \u1295 \u12ED\u121D\u1228\u1321',
    'Show advanced options':
      '\u12E8\u120B\u1241 \u12A0\u121B\u122B\u132E\u127D\u1295 \u12A0\u1233\u12ED',
    'Site Configuration': '\u12E8\u1323\u1262\u12EB \u12CD\u1245\u122D',
    'Sitewide Item Access': 'Sitewide Item Access',
    'Successfully invited user_': 'ተጠቃሚ በተሳካ ሁኔታ ተጋብዟል።',
    'Take ownership of the following resources:': 'የሚከተሉትን ሀብቶች በባለቤትነት ይያዙ።',
    'Tools access':
      '\u12E8\u1218\u1233\u122A\u12EB\u12CE\u127D \u12A0\u12AD\u1230\u1235',
    'Transfer and Delete':
      '\u12EB\u1235\u1270\u120B\u120D\u1349 \u12A5\u1293 \u12ED\u1230\u122D\u12D9',
    'data sources': '\u12E8\u1218\u1228\u1303 \u121D\u1295\u132E\u127D',
    'invalid-url':
      '\u120D\u12AD \u12EB\u120D\u1206\u1290 \u12E8\u12E9\u12A0\u122D\u12A4\u120D  \u1235\u121D\u1362 \u12C8\u12F0 \u1270\u1328\u1243\u121A\u12CE\u127D \u12F2\u134E\u120D\u1275 \u12A0\u12F5\u122D\u1313\u120D',
  },
  fr: {
    Alerts: 'Alertes',
    Cancel: 'Annuler',
    Close: 'Fermer',
    Dashboards: 'Tableaux de bord',
    Groups: 'Groupes',
    Sending___: 'Envoi...',
    Users: 'Utilisateurs',
    active: 'Actif',
    alertAdmin: "Administrateur d'alerte",
    alertEditor: "\xC9diteur d'alertes",
    alertRequireInvite:
      'Exiger une invitation pour afficher, modifier ou administrer des alertes individuelles',
    alertViewer: "Visionneuse d'alertes",
    dashboardAdmin: 'Administrateur du tableau de bord',
    dashboardEditor: '\xC9diteur de tableau de bord',
    dashboardRequireInvite:
      'Exiger une invitation pour afficher, modifier ou administrer des tableaux de bord individuels',
    dashboardViewer: 'Visionneuse de tableau de bord',
    dataAccessDescription:
      "S\xE9lectionnez les donn\xE9es auxquelles ce r\xF4le accordera l'acc\xE8s lorsqu'il sera attribu\xE9 \xE0 un utilisateur ou \xE0 un groupe.",
    dataExportDisclaimer:
      "Remarque : les utilisateurs disposant d'autorisations pour ce r\xF4le peuvent \xE9galement obtenir un acc\xE8s \xE0 l'exportation de donn\xE9es via un autre r\xF4le.",
    datasourceCount: {
      one: '1 source de donn\xE9es',
      other: '%(count)s sources de donn\xE9es',
      zero: 'Aucune source de donn\xE9es',
    },
    dimensionCount: {
      one: '1 %(dimensionName)s',
      other: '%(count)s %(dimensionName)ss',
      zero: 'Non %(dimensionName)ss',
    },
    firstName: 'Prénom',
    geographyCount: {
      one: '1 g\xE9ographie',
      other: '%(count)s zones g\xE9ographiques',
      zero: 'Aucune zone g\xE9ographique',
    },
    inactive: 'Inactif',
    lastName: 'Nom',
    nameDescription:
      "Le nom du r\xF4le est affich\xE9 lors de la s\xE9lection des r\xF4les \xE0 attribuer aux utilisateurs ou aux groupes et sera affich\xE9 \xE0 c\xF4t\xE9 des noms d'utilisateurs et de groupes sur la plateforme.",
    noRoleName:
      "Impossible d'ajouter ou de mettre \xE0 jour un r\xF4le sans nom.",
    pending: 'En Attente',
    siteAdminTitleTooltip:
      'Ce r\xF4le ne peut pas \xEAtre modifi\xE9 ou supprim\xE9',
    sitewideDescription:
      "Par d\xE9faut, les utilisateurs doivent \xEAtre invit\xE9s \xE0 des tableaux de bord ou des alertes individuels pour y acc\xE9der. Les param\xE8tres ci-dessous vous permettent de faire en sorte que ce r\xF4le accorde l'acc\xE8s \xE0 tous les tableaux de bord ou alertes de la plateforme lorsqu'il est attribu\xE9 \xE0 un utilisateur ou \xE0 un groupe.",
    toolsDescription:
      "S\xE9lectionnez les outils de plateforme auxquels ce r\xF4le accordera l'acc\xE8s lorsqu'il sera attribu\xE9 \xE0 un utilisateur ou \xE0 un groupe.",
    userRoles: "Rôles d'Utilisateurs",
    'All %(dimensionName)ss': 'Tous les %(dimensionName)ss',
    'All Users': 'Tous les utilisateurs',
    'All data sources': 'Toutes les sources de donn\xE9es',
    'All geographies': 'Toutes les zones g\xE9ographiques',
    'Allow access to all %(dimensionText)s':
      "Autoriser l'acc\xE8s \xE0 tous les %(dimensionText)s",
    'Allow data exports (CSV, JSON)':
      'Autoriser les exportations de donn\xE9es (CSV, JSON)',
    'Closing this will remove any unsaved changes_ Do you wish to proceed?':
      'La fermeture supprimera toutes les modifications non enregistr\xE9es. Voulez-vous continuer?',
    'Could not invite user because user already exists_':
      "Impossible d'inviter l'utilisateur car l'utilisateur existe déjà.",
    'Could not invite user_': 'Incapacité de donner accès à l’utilisateur.',
    'Create role': 'Cr\xE9er un r\xF4le',
    'Data access': 'Acc\xE8s aux donn\xE9es',
    'Data export': 'Exportation de donn\xE9es',
    'Data quality': 'Qualit\xE9 des donn\xE9es',
    'Discard changes': 'Annuler les modifications',
    'Edit role': 'Modifier le r\xF4le',
    'Enter email': 'Entrer un email',
    'Enter name': 'Entrer un nom',
    'Force Delete': 'Forcer la suppression',
    'Hide advanced options': 'Masquer les options avanc\xE9es',
    'Invite User': "Inviter l'Utilisateur",
    'Phone Number': 'Numéro de Téléphone',
    'Role Management': 'Gestion des r\xF4les',
    'Select %(dimensionText)s': 'S\xE9lectionnez %(dimensionText)s',
    'Select specific %(dimensionText)s':
      'S\xE9lectionnez des %(dimensionText)s sp\xE9cifiques',
    'Show advanced options': 'Montrer les options avanc\xE9es',
    'Site Configuration': 'Configuration du Site',
    'Sitewide Item Access': 'Acc\xE8s aux articles sur tout le site',
    'Successfully invited user_': 'Accès Utilisateur est un succès.',
    'Take ownership of the following resources:':
      'Prendre en charge des tableaux de bord suivants :',
    'Tools access': 'Acc\xE8s aux outils',
    'Transfer and Delete': 'Transfert et suppression',
    'data sources': 'les sources de donn\xE9es',
    'invalid-url':
      "Nom d'onglet d'URL non valide. Par d\xE9faut \xE0 l'onglet utilisateurs.",
  },
  br: {
    Alerts: 'Alertas',
    Cancel: 'Cancelar',
    Close: 'Fechar',
    Dashboards: 'Painéis',
    Groups: 'Grupos',
    Sending___: 'Enviando...',
    Users: 'Usuários',
    active: 'Activo',
    alertAdmin: 'Administrador de Alerta',
    alertEditor: 'Editor de Alerta',
    alertRequireInvite:
      'Exigir convite para visualizar, editar ou administrar alertas individuais',
    alertViewer: 'Visualizador de Alerta',
    dashboardAdmin: 'Administrador de Painel',
    dashboardEditor: 'Editor de Painel',
    dashboardRequireInvite:
      'Exigir convite para visualizar, editar ou administrar painéis individuais',
    dashboardViewer: 'Visualizador de Painel',
    dataAccessDescription:
      'Selecione os dados a que esta função irá conceder acesso, quando atribuída a um utilizador ou grupo.',
    dataExportDisclaimer:
      'Nota: Usuários com permissões para esse papel também pode ter acesso a exportação de dados através de um outro papel.',
    datasourceCount: {
      one: '1 fonte de dados',
      other: '%(count)s fontes de dados',
      zero: 'Nenhuma fonte de dados',
    },
    dimensionCount: {
      one: '1 %(dimensionName)s',
      other: '%(count)s %(dimensionName)ss',
      zero: 'Sem %(dimensionName)ss',
    },
    firstName: 'Primeiro Nome',
    geographyCount: {
      one: '1 geografia',
      other: '%(count)s geografias',
      zero: 'Nenhuma geografia',
    },
    inactive: 'Inactivo',
    lastName: 'Último nome',
    nameDescription:
      'O nome da função é exibida ao selecionar funções a serem atribuídas a usuários ou grupos e será exibido além de nomes de utilizadores e grupos durante toda a plataforma.',
    noRoleName: 'Não é possível adicionar ou actualizar uma função sem nome.',
    pending: 'Pendente',
    siteAdminTitleTooltip: 'Esta função não pode ser modificada ou excluída',
    sitewideDescription:
      'Por padrão, os usuários precisam ser convidados para aceder a painéis ou alertas individuais. As configurações abaixo permitem que esta Função passe a garantir acesso a todos os painéis ou alertas na plataforma, quando atribuído a um utilizador ou grupo.',
    toolsDescription:
      'Escolha quais as ferramentas a que esta função irá conceder acesso, quando atribuído a um utilizador ou grupo.',
    userRoles: 'Fun\xE7\xF5es do usu\xE1rio',
    'All %(dimensionName)ss': 'Todos %(dimensionName)ss',
    'All Users': 'Todos usuários',
    'All data sources': 'Todas as fontes de dados',
    'All geographies': 'Todas as geografias',
    'Allow access to all %(dimensionText)s':
      'Permitir o acesso a todos os %(dimensionText)s',
    'Allow data exports (CSV, JSON)': 'Permitir exportar dados (CSV, JSON)',
    'Closing this will remove any unsaved changes_ Do you wish to proceed?':
      'Fechar irá remover todas as alterações não guardadas. Deseja continuar?',
    'Could not invite user because user already exists_':
      'Não foi Possível convidar o utilizador Porque o utilizador Já Existe.',
    'Could not invite user_': 'Não foi possível convidar o utilizador.',
    'Create role': 'Criar Função',
    'Data access': 'Acesso de dados',
    'Data export': 'Exportar dados',
    'Data quality': 'Qualidade dos dados',
    'Discard changes': 'Descartar mudanças',
    'Edit role': 'Editar Função',
    'Enter email': 'Escreva o email',
    'Enter name': 'Escreva o nome',
    'Force Delete': 'Apagar',
    'Hide advanced options': 'Ocultar opções avançadas',
    'Invite User': 'Convidar usuários',
    'Phone Number': 'Número de telefone',
    'Role Management': 'Administração de Funções',
    'Select %(dimensionText)s': 'Selecione %(dimensionText)s',
    'Select specific %(dimensionText)s':
      'Selecione %(dimensionText)s espec\xEDficos',
    'Show advanced options': 'Mostrar opções avançadas',
    'Site Configuration': 'Configurações do Site',
    'Sitewide Item Access': 'Acesso ao item em todo o site',
    'Successfully invited user_': 'Utilizador convidado com sucesso',
    'Take ownership of the following resources:':
      'Assumir a propriedade dos seguintes recursos:',
    'Tools access': 'Acesso a Ferramentas',
    'Transfer and Delete': 'Transferir e apagar',
    'data sources': 'fonte de dados',
    'invalid-url': 'URL inválido. Retornando para a guia do utilizador',
  },
};
I18N.mergeSupplementalTranslations(translations, [
  i18n_components_AdminApp_AccessSelectionView,
  i18n_components_AdminApp_ConfigurationTab,
  i18n_components_AdminApp_GroupsTab,
  i18n_components_AdminApp_RoleManagementTab,
  i18n_components_AdminApp_UsersTab,
]);
export default translations;
