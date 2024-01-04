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
    Active: 'Active',
    Copy: 'Copy',
    Group: 'Group',
    ID: 'ID',
    Inactive: 'Inactive',
    Password: 'Password',
    Pending: 'Pending',
    Revoke: 'Revoke',
    Revoked: 'Revoked',
    revokedTokensCount: {
      one: '1 revoked access token',
      other: '%(count)s revoked access tokens',
      zero: '',
    },
    '%(username)s has access to this alert through the %(groupName)s group_ To change, you will have to modify access from %(groupName)s':
      '%(username)s has access to this alert through the %(groupName)s group. To change, you will have to modify access from %(groupName)s',
    '%(username)s has access to this alert through the %(groupName)s group_ To delete, you will have to remove %(username)s from %(groupName)s':
      '%(username)s has access to this alert through the %(groupName)s group. To delete, you will have to remove %(username)s from %(groupName)s',
    '%(username)s has access to this dashboard through the %(groupName)s group_ To change, you will have to modify access from %(groupName)s':
      '%(username)s has access to this dashboard through the %(groupName)s group. To change, you will have to modify access from %(groupName)s',
    '%(username)s has access to this dashboard through the %(groupName)s group_ To delete, you will have to remove %(username)s from %(groupName)s':
      '%(username)s has access to this dashboard through the %(groupName)s group. To delete, you will have to remove %(username)s from %(groupName)s',
    '%(username)s has access to this role through the %(groupName)s group_ To delete, you will have to remove %(username)s from %(groupName)s':
      '%(username)s has access to this role through the %(groupName)s group. To delete, you will have to remove %(username)s from %(groupName)s',
    '+ Add Alerts': '+ Add Alerts',
    '+ Add Dashboards': '+ Add Dashboards',
    '+ Add Groups': '+ Add Groups',
    '+ Add Roles': '+ Add Roles',
    'API Access Tokens': 'API Access Tokens',
    'API Tokens': 'API Tokens',
    'API access tokens are used to authenticate and authorize access to the Integrated Data API_':
      'API access tokens are used to authenticate and authorize access to the Integrated Data API.',
    'Access Granted': 'Access Granted',
    'Added Through': 'Added Through',
    'Are you sure you wish to proceed?': 'Are you sure you wish to proceed?',
    'Be sure to copy your new token below_ It won\u2019t be shown in full again_':
      'Be sure to copy your new token below. It won\u2019t be shown in full again.',
    'Dashboards & Alerts': 'Dashboards & Alerts',
    'Direct Access': 'Direct Access',
    'Generate Access Token': 'Generate Access Token',
    'Group Access': 'Group Access',
    'New token generated': 'New token generated',
    'Please note that all changes will only be saved once a user clicks \u201CSave\u201D in the main User Profile_':
      'Please note that all changes will only be saved once a user clicks \u201CSave\u201D in the main User Profile.',
    'Profile Details': 'Profile Details',
    'Resend Invite': 'Resend Invite',
    'Revoke Token': 'Revoke Token',
    'Roles & Groups': 'Roles & Groups',
    'Send password reset via email': 'Send password reset via email',
    'There was a problem generating a token':
      'There was a problem generating a token',
    'There was a problem updating this user':
      'There was a problem updating this user',
    'Token has been copied to your clipboard_ Do not forget to save changes before using it!':
      'Token has been copied to your clipboard. Do not forget to save changes before using it!',
    "User can't remember their password?":
      "User can't remember their password?",
    'User successfully updated': 'User successfully updated',
    "When you revoke an access token, it becomes invalid and can no longer be used to access the API_ This means that any API requests made using that token will fail and the user or application associated with the token will no longer have access to the API's resources_":
      "When you revoke an access token, it becomes invalid and can no longer be used to access the API. This means that any API requests made using that token will fail and the user or application associated with the token will no longer have access to the API's resources.",
    "You don't have any API access tokens":
      "You don't have any API access tokens",
  },
  pt: {
    Active: 'Activo',
    Copy: 'Copia',
    Group: 'Grupo',
    ID: 'ID',
    Inactive: 'Inactivo',
    Password: 'Senha',
    Pending: 'Pendente',
    Revoke: 'Revogar',
    Revoked: 'Revogado',
    revokedTokensCount: {
      one: '1 accesso revogado levado',
      other: '%(count)s acessos revogados levados',
      zero: '',
    },
    '%(username)s has access to this alert through the %(groupName)s group_ To change, you will have to modify access from %(groupName)s':
      '%(username)s tem acesso a este alerta atrav\xE9s do grupo %(groupName)s. Para alterar, voc\xEA ter\xE1 de modificar o acesso no %(GroupName)s',
    '%(username)s has access to this alert through the %(groupName)s group_ To delete, you will have to remove %(username)s from %(groupName)s':
      '%(username)s tem acesso a este alerta atrav\xE9s do grupo %(groupName)s. Para excluir, voc\xEA ter\xE1 que remover %(username)s do grupo %(GroupName)s',
    '%(username)s has access to this dashboard through the %(groupName)s group_ To change, you will have to modify access from %(groupName)s':
      '%(username)s tem acesso a este painel atrav\xE9s do grupo %(groupName)s. Para alterar, voc\xEA ter\xE1 de modificar o acesso de %(GroupName)s',
    '%(username)s has access to this dashboard through the %(groupName)s group_ To delete, you will have to remove %(username)s from %(groupName)s':
      '%(username)s tem acesso a este painel atrav\xE9s do grupo %(groupName)s. Para excluir, voc\xEA ter\xE1 que remover %(username)s de do grupo %(GroupName)s',
    '%(username)s has access to this role through the %(groupName)s group_ To delete, you will have to remove %(username)s from %(groupName)s':
      '%(username)s tem acesso a esta fun\xE7\xE3o atrav\xE9s do grupo %(groupName)s. Para excluir, voc\xEA ter\xE1 que remover %(username)s do grupo %(groupName)s',
    '+ Add Alerts': '+ Adicionar Alertas',
    '+ Add Dashboards': '+ Adicionar Pain\xE9is',
    '+ Add Groups': '+ Adicionar grupos',
    '+ Add Roles': '+ Adicionar fun\xE7\xF5es',
    'API Access Tokens': '',
    'API Tokens': '',
    'API access tokens are used to authenticate and authorize access to the Integrated Data API_':
      '',
    'Access Granted': 'Acesso Concedido',
    'Added Through': 'Adicionado Atrav\xE9s',
    'Are you sure you wish to proceed?': 'Tem certeza que deseja continuar?',
    'Be sure to copy your new token below_ It won\u2019t be shown in full again_':
      '',
    'Dashboards & Alerts': 'Pain\xE9is e Alertas',
    'Direct Access': 'Acesso Directo',
    'Generate Access Token': '',
    'Group Access': 'Acesso de Grupo',
    'New token generated': '',
    'Please note that all changes will only be saved once a user clicks \u201CSave\u201D in the main User Profile_':
      '',
    'Profile Details': 'Detalhes de perfil',
    'Resend Invite': 'Reenviar convite.',
    'Revoke Token': '',
    'Roles & Groups': 'Fun\xE7\xF5es e Grupos',
    'Send password reset via email': 'Enviar email para redefinir senha',
    'There was a problem generating a token': '',
    'There was a problem updating this user':
      'Ocorreu um problema ao actualizar este utilizador',
    'Token has been copied to your clipboard_ Do not forget to save changes before using it!':
      '',
    "User can't remember their password?":
      'Utilizador n\xE3o recorda da senha?',
    'User successfully updated': 'Utilizador actualizado com sucesso',
    "When you revoke an access token, it becomes invalid and can no longer be used to access the API_ This means that any API requests made using that token will fail and the user or application associated with the token will no longer have access to the API's resources_":
      '',
    "You don't have any API access tokens": 'N\xE3o tem nenhum acesso API ',
  },
  vn: {
    Active: 'Ho\u1EA1t \u0111\u1ED9ng',
    Copy: 'Sao ch\xE9p',
    Group: 'Nh\xF3m',
    ID: 'ID',
    Inactive: 'Kh\xF4ng ho\u1EA1t \u0111\u1ED9ng',
    Password: 'M\u1EADt kh\u1EA9u',
    Pending: 'Ch\u01B0a gi\u1EA3i quy\u1EBFt',
    Revoke: 'Thu h\u1ED3i',
    Revoked: '\u0110\xE3 \u0111\u01B0\u1EE3c thu h\u1ED3i',
    revokedTokensCount: {
      one: '1 token truy c\u1EADp \u0111\xE3 \u0111\u01B0\u1EE3c thu h\u1ED3i',
      other:
        '%(count)s token truy c\u1EADp \u0111\xE3 \u0111\u01B0\u1EE3c thu h\u1ED3i',
      zero: '',
    },
    '%(username)s has access to this alert through the %(groupName)s group_ To change, you will have to modify access from %(groupName)s':
      '%(username)s c\xF3 quy\u1EC1n truy c\u1EADp v\xE0o c\u1EA3nh b\xE1o n\xE0y th\xF4ng qua nh\xF3m %(groupName)s. \u0110\u1EC3 thay \u0111\u1ED5i, b\u1EA1n s\u1EBD ph\u1EA3i s\u1EEDa \u0111\u1ED5i quy\u1EC1n truy c\u1EADp t\u1EEB %(groupName)s',
    '%(username)s has access to this alert through the %(groupName)s group_ To delete, you will have to remove %(username)s from %(groupName)s':
      '%(username)s c\xF3 quy\u1EC1n truy c\u1EADp v\xE0o c\u1EA3nh b\xE1o n\xE0y th\xF4ng qua nh\xF3m %(groupName)s. \u0110\u1EC3 x\xF3a, b\u1EA1n s\u1EBD ph\u1EA3i x\xF3a %(username)s kh\u1ECFi %(groupName)s',
    '%(username)s has access to this dashboard through the %(groupName)s group_ To change, you will have to modify access from %(groupName)s':
      '%(username)s c\xF3 quy\u1EC1n truy c\u1EADp v\xE0o trang t\u1ED5ng quan n\xE0y th\xF4ng qua nh\xF3m %(groupName)s. \u0110\u1EC3 thay \u0111\u1ED5i, b\u1EA1n s\u1EBD ph\u1EA3i s\u1EEDa \u0111\u1ED5i quy\u1EC1n truy c\u1EADp t\u1EEB %(groupName)s',
    '%(username)s has access to this dashboard through the %(groupName)s group_ To delete, you will have to remove %(username)s from %(groupName)s':
      '%(username)s c\xF3 quy\u1EC1n truy c\u1EADp v\xE0o trang t\u1ED5ng quan n\xE0y th\xF4ng qua nh\xF3m %(groupName)s. \u0110\u1EC3 x\xF3a, b\u1EA1n s\u1EBD ph\u1EA3i x\xF3a %(username)s kh\u1ECFi %(groupName)s',
    '%(username)s has access to this role through the %(groupName)s group_ To delete, you will have to remove %(username)s from %(groupName)s':
      '%(username)s c\xF3 quy\u1EC1n truy c\u1EADp v\xE0o vai tr\xF2 n\xE0y th\xF4ng qua nh\xF3m %(groupName)s. \u0110\u1EC3 x\xF3a, b\u1EA1n s\u1EBD ph\u1EA3i x\xF3a %(username)s kh\u1ECFi %(groupName)s',
    '+ Add Alerts': '+ Th\xEAm c\u1EA3nh b\xE1o',
    '+ Add Dashboards': "+ Th\xEAm Trang t\u1ED5ng quan'",
    '+ Add Groups': '+ Th\xEAm nh\xF3m',
    '+ Add Roles': '+ Th\xEAm vai tr\xF2',
    'API Access Tokens': 'Tokens truy c\u1EADp API',
    'API Tokens': 'API Tokens',
    'API access tokens are used to authenticate and authorize access to the Integrated Data API_':
      'M\xE3 Tokens truy c\u1EADp API \u0111\u01B0\u1EE3c s\u1EED d\u1EE5ng \u0111\u1EC3 x\xE1c th\u1EF1c v\xE0 c\u1EA5p quy\u1EC1n truy c\u1EADp v\xE0o API D\u1EEF li\u1EC7u \u0111\u01B0\u1EE3c t\xEDch h\u1EE3p',
    'Access Granted': 'Ch\u1EA5p thu\u1EADn quy\u1EC1n truy c\u1EADp',
    'Added Through': '\u0110\xE3 th\xEAm th\xF4ng qua',
    'Are you sure you wish to proceed?':
      'B\u1EA1n c\xF3 ch\u1EAFc ch\u1EAFn mu\u1ED1n ti\u1EBFp t\u1EE5c kh\xF4ng?',
    'Be sure to copy your new token below_ It won\u2019t be shown in full again_':
      'H\xE3y \u0111\u1EA3m b\u1EA3o sao ch\xE9p m\xE3 token m\u1EDBi ph\xEDa d\u01B0\u1EDBi. N\xF3 s\u1EBD kh\xF4ng \u0111\u01B0\u1EE3c hi\u1EC3n th\u1ECB \u0111\u1EA7y \u0111\u1EE7 l\u1EA1i',
    'Dashboards & Alerts': 'Trang t\u1ED5ng quan & C\u1EA3nh b\xE1o',
    'Direct Access': 'Truy c\u1EADp tr\u1EF1c ti\u1EBFp',
    'Generate Access Token': 'Kh\u1EDFi t\u1EA1o m\xE3 token',
    'Group Access': 'Quy\u1EC1n truy c\u1EADp nh\xF3m',
    'New token generated':
      'M\xE3 token m\u1EDBi \u0111\xE3 \u0111\u01B0\u1EE3c t\u1EA1o',
    'Please note that all changes will only be saved once a user clicks \u201CSave\u201D in the main User Profile_':
      'Xin l\u01B0u \xFD r\u1EB1ng t\u1EA5t c\u1EA3 c\xE1c thay \u0111\u1ED5i s\u1EBD ch\u1EC9 \u0111\u01B0\u1EE3c l\u01B0u khi ng\u01B0\u1EDDi d\xF9ng nh\u1EA5p v\xE0o "L\u01B0u" trong H\u1ED3 s\u01A1 Ng\u01B0\u1EDDi d\xF9ng ch\xEDnh',
    'Profile Details': 'Chi ti\u1EBFt h\u1ED3 s\u01A1',
    'Resend Invite': 'G\u1EEDi l\u1EA1i l\u1EDDi m\u1EDDi',
    'Revoke Token': 'Thu h\u1ED3i m\xE3 token',
    'Roles & Groups': 'Vai tr\xF2 & Nh\xF3m',
    'Send password reset via email':
      'G\u1EEDi m\u1EADt kh\u1EA9u \u0111\u1EB7t l\u1EA1i qua email',
    'There was a problem generating a token':
      'X\u1EA3y ra l\u1ED7i khi kh\u1EDFi t\u1EA1o m\xE3 token',
    'There was a problem updating this user':
      '\u0110\xE3 x\u1EA3y ra s\u1EF1 c\u1ED1 khi c\u1EADp nh\u1EADt ng\u01B0\u1EDDi d\xF9ng n\xE0y',
    'Token has been copied to your clipboard_ Do not forget to save changes before using it!':
      'M\xE3 token \u0111\xE3 \u0111\u01B0\u1EE3c sao ch\xE9p v\xE0o clipboard c\u1EE7a b\u1EA1n. \u0110\u1EEBng qu\xEAn l\u01B0u c\xE1c thay \u0111\u1ED5i tr\u01B0\u1EDBc khi s\u1EED d\u1EE5ng n\xF3',
    "User can't remember their password?":
      'Ng\u01B0\u1EDDi d\xF9ng kh\xF4ng th\u1EC3 nh\u1EDB m\u1EADt kh\u1EA9u c\u1EE7a h\u1ECD?',
    'User successfully updated':
      'Ng\u01B0\u1EDDi d\xF9ng \u0111\xE3 \u0111\u01B0\u1EE3c c\u1EADp nh\u1EADt th\xE0nh c\xF4ng',
    "When you revoke an access token, it becomes invalid and can no longer be used to access the API_ This means that any API requests made using that token will fail and the user or application associated with the token will no longer have access to the API's resources_":
      'Khi b\u1EA1n thu h\u1ED3i m\u1ED9t m\xE3 token, m\xE3 n\xE0y s\u1EBD tr\u1EDF n\xEAn kh\xF4ng h\u1EE3p l\u1EC7 v\xE0 kh\xF4ng c\xF2n c\xF3 th\u1EC3 d\xF9ng n\xF3 \u0111\u1EC3 truy c\u1EADp API. \u0110i\u1EC1u n\xE0y c\xF3 ngh\u0129a l\xE0 m\u1ECDi y\xEAu c\u1EA7u API \u0111\u01B0\u1EE3c th\u1EF1c hi\u1EC7n b\u1EB1ng c\xE1ch s\u1EED d\u1EE5ng m\xE3 n\xE0y \u0111\u1EC1u kh\xF4ng th\xE0nh c\xF4ng v\xE0 ng\u01B0\u1EDDi d\xF9ng ho\u1EB7c \u1EE9ng d\u1EE5ng li\xEAn k\u1EBFt v\u1EDBi m\xE3 token n\xE0y s\u1EBD kh\xF4ng c\xF2n quy\u1EC1n truy c\u1EADp v\xE0o t\xE0i nguy\xEAn c\u1EE7a API',
    "You don't have any API access tokens":
      'B\u1EA1n kh\xF4ng c\xF3 m\xE3 token truy c\u1EADp API n\xE0o',
  },
  am: {
    Active: 'ንቁ',
    Copy: '\u1245\u12F3',
    Group: 'ቡድን',
    ID: '\u1218\u1273\u12C8\u1242\u12EB',
    Inactive: 'እንቅስቃሴ-አልባ',
    Password: 'ፕስወርድ',
    Pending: 'በመጠባበቅ ላይ',
    Revoke: '\u1218\u123B\u122D',
    Revoked: '\u1270\u123D\u122F\u120D',
    revokedTokensCount: {
      one:
        '1 \u12E8\u1218\u12F3\u1228\u123B \u121B\u1235\u1218\u1230\u12EB \u1270\u123D\u122F\u120D\u1362',
      other:
        '%(count)s \u12E8\u1270\u123B\u1229 \u12E8\u1218\u12F3\u1228\u123B \u1276\u12A8\u1296\u127D',
      zero: '',
    },
    '%(username)s has access to this alert through the %(groupName)s group_ To change, you will have to modify access from %(groupName)s':
      '%(username)s በ %(groupName)s ቡድን በኩል የዚህ ማንቂያ መዳረሻ አለው። ለመለወጥ፣ ከ %(groupName)s መዳረሻ መቀየር አለብህ',
    '%(username)s has access to this alert through the %(groupName)s group_ To delete, you will have to remove %(username)s from %(groupName)s':
      '%(username)s በ %(groupName)s ቡድን በኩል የዚህ ማንቂያ መዳረሻ አለው። ለመሰረዝ %(username)s ን ከ %(groupName)s ማስወገድ አለቦት',
    '%(username)s has access to this dashboard through the %(groupName)s group_ To change, you will have to modify access from %(groupName)s':
      '%(username)s በ %(groupName)s ቡድን በኩል የዚህ ዳሽቦርድ መዳረሻ አለው። ለመለወጥ፣ ከ %(groupName)s መዳረሻ መቀየር አለብህ',
    '%(username)s has access to this dashboard through the %(groupName)s group_ To delete, you will have to remove %(username)s from %(groupName)s':
      '%(username)s በ %(groupName)s ቡድን በኩል የዚህ ዳሽቦርድ መዳረሻ አለው። ለመሰረዝ %(username)sን ከ %(groupName)s ማስወገድ አለቦት',
    '%(username)s has access to this role through the %(groupName)s group_ To delete, you will have to remove %(username)s from %(groupName)s':
      '%(username)s በ%(groupName)s ቡድን በኩል የዚህ ሚና መዳረሻ አለው። ለመሰረዝ %(username)s ን ከ%(groupName)s ማስወገድ አለቦት',
    '+ Add Alerts': '+ ማንቂያዎችን ያክሉ',
    '+ Add Dashboards': '+ ዳሽቦርዶችን ያክሉ',
    '+ Add Groups': '+ ቡድኖችን ያክሉ',
    '+ Add Roles': '+ ሚናዎችን ያክሉ',
    'API Access Tokens':
      '\u12E8\u12A4\u1352\u12A0\u12ED \u1218\u12F3\u1228\u123B \u1276\u12A8\u1296\u127D',
    'API Tokens': '\u12E8\u12A4\u1352\u12A0\u12ED \u1276\u12A8\u1296\u127D',
    'API access tokens are used to authenticate and authorize access to the Integrated Data API_':
      '\u12E8\u12A4\u1352\u12A0\u12ED \u1218\u12F3\u1228\u123B \u1276\u12A8\u1296\u127D \u12E8\u1270\u12CB\u1203\u12F0 \u12F3\u1273 \u12A4\u1352\u12A0\u12ED\u1295 \u1208\u121B\u1228\u130B\u1308\u1325 \u12A5\u1293 \u1218\u12F3\u1228\u123B\u1295 \u1208\u1218\u134D\u1240\u12F5 \u12EB\u1308\u1208\u130D\u120B\u1209\u1362',
    'Access Granted': 'መዳረሻ ተሰጥቷል።',
    'Added Through': 'በኩል ታክሏል።',
    'Are you sure you wish to proceed?':
      '\u12A5\u122D\u130D\u1320\u129B \u1290\u12CE\u1275 \u1218\u1240\u1320\u120D \u12ED\u1348\u120D\u130B\u1209?',
    'Be sure to copy your new token below_ It won\u2019t be shown in full again_':
      '\u12A0\u12F2\u1231\u1295 \u1276\u12A8\u1296\u1278 \u12A8\u12DA\u1205 \u1260\u1273\u127D \u1218\u1245\u12F3\u1275\u12CE\u1295 \u12EB\u1228\u130B\u130D\u1321\u1362 \u12A5\u1295\u12F0\u1308\u1293 \u1219\u1209 \u1260\u1219\u1209 \u12A0\u12ED\u1273\u12ED\u121D\u1362',
    'Dashboards & Alerts': 'ዳሽቦርዶች እና ማንቂያዎች',
    'Direct Access': 'ቀጥተኛ መዳረሻ',
    'Generate Access Token':
      '\u12E8\u1218\u12F3\u1228\u123B \u1276\u12A8\u1295 \u12ED\u134D\u1320\u1229',
    'Group Access': 'የቡድን መዳረሻ',
    'New token generated':
      '\u12A0\u12F2\u1235 \u1276\u12A8\u1295 \u1270\u1348\u1325\u122F\u120D\u1362',
    'Please note that all changes will only be saved once a user clicks \u201CSave\u201D in the main User Profile_':
      '\u12A5\u1263\u12AD\u12CE\u1295 \u1201\u1209\u121D \u1208\u12CD\u1326\u127D \u12E8\u121A\u1240\u1218\u1321\u1275 \u1270\u1320\u1243\u121A\u12CD \u1260\u12CB\u1293\u12CD \u12E8\u1270\u1320\u1243\u121A \u1218\u1308\u1208\u132B \u12CD\u1235\u1325 "\u12A0\u1235\u1240\u121D\u1325" \u12E8\u121A\u1208\u12CD\u1295 \u1320\u1245 \u12AB\u12F0\u1228\u1308 \u1260\u128B\u120B \u1265\u127B \u1290\u12CD\u1362',
    'Profile Details': 'የመገለጫ ዝርዝሮች',
    'Resend Invite': 'ግብዣን እንደገና ላክ',
    'Revoke Token': '\u1276\u12A8\u1291\u1295 \u1230\u122D\u12DD',
    'Roles & Groups': 'ሚናዎች እና ቡድኖች',
    'Send password reset via email': 'የይለፍ ቃል ዳግም ማስጀመርን በኢሜል ይላኩ።',
    'There was a problem generating a token':
      '\u1276\u12A8\u1291\u1295 \u1260\u121B\u1218\u1295\u1328\u1275 \u120B\u12ED \u127D\u130D\u122D \u1290\u1260\u122D\u1362',
    'There was a problem updating this user': 'ይህን ተጠቃሚ ማዘመን ላይ ችግር ነበር።',
    'Token has been copied to your clipboard_ Do not forget to save changes before using it!':
      '\u1276\u12A8\u1291\u1295 \u12C8\u12F0 \u1245\u1295\u1325\u1265 \u1230\u120C\u12F3\u12CE \u1270\u1240\u12F5\u1277\u120D\u1362 \u12A8\u1218\u1320\u1240\u121D\u12CE \u1260\u134A\u1275 \u1208\u12CD\u1326\u127D\u1295 \u121B\u1235\u1240\u1218\u1325\u12CE\u1295 \u12A0\u12ED\u122D\u1231!',
    "User can't remember their password?": 'ተጠቃሚ የይለፍ ቃሉን ማስታወስ አይችልም?',
    'User successfully updated': 'ተጠቃሚ በተሳካ ሁኔታ ዘምኗል',
    "When you revoke an access token, it becomes invalid and can no longer be used to access the API_ This means that any API requests made using that token will fail and the user or application associated with the token will no longer have access to the API's resources_":
      '\u12E8\u1218\u12F3\u1228\u123B \u1276\u12A8\u1295 \u1232\u1230\u122D\u12D9 \u120D\u12AD \u12EB\u120D\u1206\u1290 \u12ED\u1206\u1293\u120D \u12A5\u1293 \u12A8\u12A0\u1201\u1295 \u1260\u128B\u120B \u12A4\u1352\u12A0\u12ED\u12CD\u1295 \u1208\u1218\u12F5\u1228\u1235 \u1218\u1320\u1240\u121D \u12A0\u12ED\u127B\u120D\u121D\u1362 \u12ED\u1205 \u121B\u1208\u1275 \u12EB\u1295\u1295 \u1276\u12A8\u1295 \u1270\u1320\u1245\u1218\u12CD \u12E8\u121A\u1240\u122D\u1261 \u121B\u1293\u1278\u12CD\u121D \u12E8\u12A4\u1352\u12A0\u12ED \u1325\u12EB\u1244\u12CE\u127D \u12A0\u12ED\u1233\u12A9\u121D \u12A5\u1293 \u12A8\u1276\u12A8\u1291 \u130B\u122D \u12E8\u1270\u130E\u12F3\u1298\u12CD \u1270\u1320\u1243\u121A \u12C8\u12ED\u121D \u1218\u1270\u130D\u1260\u122A\u12EB \u12A8\u12A0\u1201\u1295 \u1260\u128B\u120B \u12A4\u1352\u12A0\u12ED\u12E9\u1295 \u121B\u130D\u1298\u1275 \u12A0\u12ED\u127D\u1209\u121D \u121B\u1208\u1275 \u1290\u12CD\u1362',
    "You don't have any API access tokens":
      '\u121D\u1295\u121D \u12E8\u12A4\u1352\u12A0\u12ED \u1218\u12F3\u1228\u123B \u1276\u12A8\u1296\u127D \u12E8\u120E\u1275\u121D\u1362',
  },
  fr: {
    Active: 'Actif',
    Copy: 'Copier',
    Group: 'Groupe',
    ID: 'ID',
    Inactive: 'Inactif',
    Password: 'Mot de passe',
    Pending: 'En attente',
    Revoke: 'R\xE9voquer',
    Revoked: 'R\xE9voqu\xE9',
    revokedTokensCount: {
      one: "1 jeton d'acc\xE8s r\xE9voqu\xE9",
      other: "%(count)s jetons d'acc\xE8s r\xE9voqu\xE9s",
      zero: '',
    },
    '%(username)s has access to this alert through the %(groupName)s group_ To change, you will have to modify access from %(groupName)s':
      "%(username)s a acc\xE8s \xE0 cette alerte via le groupe %(groupName)s. Pour changer, vous devrez modifier l'acc\xE8s depuis %(groupName)s",
    '%(username)s has access to this alert through the %(groupName)s group_ To delete, you will have to remove %(username)s from %(groupName)s':
      '%(username)s a acc\xE8s \xE0 cette alerte via le groupe %(groupName)s. Pour supprimer, vous devrez supprimer %(username)s de %(groupName)s',
    '%(username)s has access to this dashboard through the %(groupName)s group_ To change, you will have to modify access from %(groupName)s':
      "%(username)s a acc\xE8s \xE0 ce tableau de bord via le groupe %(groupName)s. Pour changer, vous devrez modifier l'acc\xE8s depuis %(groupName)s",
    '%(username)s has access to this dashboard through the %(groupName)s group_ To delete, you will have to remove %(username)s from %(groupName)s':
      '%(username)s a acc\xE8s \xE0 ce tableau de bord via le groupe %(groupName)s. Pour supprimer, vous devrez supprimer %(username)s de %(groupName)s',
    '%(username)s has access to this role through the %(groupName)s group_ To delete, you will have to remove %(username)s from %(groupName)s':
      '%(username)s a acc\xE8s \xE0 ce r\xF4le via',
    '+ Add Alerts': 'Ajouter des alertes',
    '+ Add Dashboards': 'Ajouter des tableaux de bord',
    '+ Add Groups': 'Ajouter des groupes',
    '+ Add Roles': 'Ajouter des r\xF4les',
    'API Access Tokens': "Jetons d'acc\xE8s API",
    'API Tokens': 'Jetons API',
    'API access tokens are used to authenticate and authorize access to the Integrated Data API_':
      "Les jetons d'acc\xE8s API sont utilis\xE9s pour authentifier et autoriser l'acc\xE8s \xE0 l'API de donn\xE9es int\xE9gr\xE9e.",
    'Access Granted': 'Acc\xE8s autoris\xE9',
    'Added Through': 'Ajout\xE9 par',
    'Are you sure you wish to proceed?':
      '\xCAtes-vous s\xFBr(e) de vouloir continuer?',
    'Be sure to copy your new token below_ It won\u2019t be shown in full again_':
      'Assurez-vous de copier votre nouveau jeton ci-dessous. Il ne sera plus affich\xE9 int\xE9gralement.',
    'Dashboards & Alerts': 'Tableaux de bord et alertes',
    'Direct Access': 'Acc\xE8s direct',
    'Generate Access Token': "G\xE9n\xE9rer un jeton d'acc\xE8s",
    'Group Access': 'Acc\xE8s de groupe',
    'New token generated': 'Nouveau jeton g\xE9n\xE9r\xE9',
    'Please note that all changes will only be saved once a user clicks \u201CSave\u201D in the main User Profile_':
      "Veuillez noter que toutes les modifications ne seront enregistr\xE9es qu'une fois qu'un utilisateur aura cliqu\xE9 sur \xAB Enregistrer \xBB dans le profil utilisateur principal.",
    'Profile Details': 'D\xE9tails du profil',
    'Resend Invite': "Renvoyer l'invitation",
    'Revoke Token': 'R\xE9voquer le jeton ',
    'Roles & Groups': 'R\xF4les et groupes',
    'Send password reset via email':
      'Envoyer la r\xE9initialisation du mot de passe par e-mail',
    'There was a problem generating a token':
      "Un probl\xE8me est survenu lors de la g\xE9n\xE9ration d'un jeton ",
    'There was a problem updating this user':
      'Un probl\xE8me est survenu lors de la mise \xE0 jour de cet utilisateur',
    'Token has been copied to your clipboard_ Do not forget to save changes before using it!':
      "Le jeton a \xE9t\xE9 copi\xE9 dans votre presse-papiers. N'oubliez pas de sauvegarder les modifications avant de l'utiliser !",
    "User can't remember their password?":
      "L'utilisateur ne se souvient pas de son mot de passe\xA0?",
    'User successfully updated': 'Utilisateur mis \xE0 jour avec succ\xE8s',
    "When you revoke an access token, it becomes invalid and can no longer be used to access the API_ This means that any API requests made using that token will fail and the user or application associated with the token will no longer have access to the API's resources_":
      "Lorsque vous r\xE9voquez un jeton d'acc\xE8s, il devient invalide et ne peut plus \xEAtre utilis\xE9 pour acc\xE9der \xE0 l'API. Cela signifie que toutes les demandes d'API effectu\xE9es \xE0 l'aide de ce jeton \xE9choueront et que l'utilisateur ou l'application associ\xE9(e) au jeton n'aura plus acc\xE8s aux ressources de l'API.",
    "You don't have any API access tokens":
      "Vous n'avez aucun jeton d'acc\xE8s API",
  },
  br: {
    Active: 'Ativo',
    Copy: 'Copiar',
    Group: 'Grupo',
    ID: 'ID',
    Inactive: 'Inativo',
    Password: 'Senha',
    Pending: 'Pendente',
    Revoke: 'Revogar',
    Revoked: 'Revogado',
    revokedTokensCount: {
      one: '%(count)s de tokens de acesso revogados',
      other: '1 token de acesso revogado',
      zero: '2 de tokens de acesso revogados',
    },
    '%(username)s has access to this alert through the %(groupName)s group_ To change, you will have to modify access from %(groupName)s':
      '%(username)s tem acesso a este alerta atrav\xE9s do grupo %(groupName)s. Para alterar, voc\xEA ter\xE1 de modificar o acesso no %(GroupName)s',
    '%(username)s has access to this alert through the %(groupName)s group_ To delete, you will have to remove %(username)s from %(groupName)s':
      '%(username)s tem acesso a este alerta atrav\xE9s do grupo %(groupName)s. Para excluir, voc\xEA ter\xE1 que remover %(username)s do grupo %(GroupName)s',
    '%(username)s has access to this dashboard through the %(groupName)s group_ To change, you will have to modify access from %(groupName)s':
      '%(username)s tem acesso a este painel atrav\xE9s do grupo %(groupName)s. Para alterar, voc\xEA ter\xE1 de modificar o acesso de %(GroupName)s',
    '%(username)s has access to this dashboard through the %(groupName)s group_ To delete, you will have to remove %(username)s from %(groupName)s':
      '%(username)s tem acesso a este painel atrav\xE9s do grupo %(groupName)s. Para excluir, voc\xEA ter\xE1 que remover %(username)s de do grupo %(GroupName)s',
    '%(username)s has access to this role through the %(groupName)s group_ To delete, you will have to remove %(username)s from %(groupName)s':
      '%(username)s tem acesso a esta fun\xE7\xE3o atrav\xE9s do grupo %(groupName)s. Para excluir, voc\xEA ter\xE1 que remover %(username)s do grupo %(groupName)s',
    '+ Add Alerts': '+ Adicionar Alertas',
    '+ Add Dashboards': '+ Adicionar Pain\xE9is',
    '+ Add Groups': '+ Adicionar grupos',
    '+ Add Roles': '+ Adicionar fun\xE7\xF5es',
    'API Access Tokens': 'Tokens de acesso \xE0 API',
    'API Tokens': 'Tokens de API',
    'API access tokens are used to authenticate and authorize access to the Integrated Data API_':
      'Os tokens de acesso \xE0 API s\xE3o usados para autenticar e autorizar o acesso \xE0 API de dados integrados.',
    'Access Granted': 'Acesso Concedido',
    'Added Through': 'Adicionado Atrav\xE9s',
    'Are you sure you wish to proceed?': 'Tem certeza de que deseja continuar?',
    'Be sure to copy your new token below_ It won\u2019t be shown in full again_':
      'Certifique-se de copiar seu novo token abaixo. Ele n\xE3o ser\xE1 exibido por completo novamente.',
    'Dashboards & Alerts': 'Pain\xE9is e Alertas',
    'Direct Access': 'Acesso Direto',
    'Generate Access Token': 'Gerar token de acesso',
    'Group Access': 'Acesso de Grupo',
    'New token generated': 'Novo token gerado',
    'Please note that all changes will only be saved once a user clicks \u201CSave\u201D in the main User Profile_':
      'Observe que todas as altera\xE7\xF5es s\xF3 ser\xE3o salvas quando o usu\xE1rio clicar em "Save" (Salvar) no perfil principal do usu\xE1rio.',
    'Profile Details': 'Detalhes de perfil',
    'Resend Invite': 'Reenviar convite.',
    'Revoke Token': 'Revogar token',
    'Roles & Groups': 'Fun\xE7\xF5es e Grupos',
    'Send password reset via email': 'Enviar email para redefinir senha',
    'There was a problem generating a token':
      'Houve um problema ao gerar um token',
    'There was a problem updating this user':
      'Ocorreu um problema ao actualizar este utilizador',
    'Token has been copied to your clipboard_ Do not forget to save changes before using it!':
      'O token foi copiado para sua \xE1rea de transfer\xEAncia. N\xE3o se esque\xE7a de salvar as altera\xE7\xF5es antes de us\xE1-lo!',
    "User can't remember their password?":
      'Utilizador n\xE3o recorda da senha?',
    'User successfully updated': 'Utilizador actualizado com sucesso',
    "When you revoke an access token, it becomes invalid and can no longer be used to access the API_ This means that any API requests made using that token will fail and the user or application associated with the token will no longer have access to the API's resources_":
      'Quando voc\xEA revoga um token de acesso, ele se torna inv\xE1lido e n\xE3o pode mais ser usado para acessar a API. Isso significa que todas as solicita\xE7\xF5es de API feitas com esse token falhar\xE3o e o usu\xE1rio ou aplicativo associado ao token n\xE3o ter\xE1 mais acesso aos recursos da API.',
    "You don't have any API access tokens":
      'Voc\xEA n\xE3o tem nenhum token de acesso \xE0 API',
  },
};
export default translations;
