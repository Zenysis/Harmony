// @flow
import type {
  AlertsPermissionMap,
  DashboardPermissionMap,
  ResourceRoleMap,
  ResourceType,
  ResourceTypeMap,
  SitePermissionMap,
} from 'services/AuthorizationService/types';

export const RESOURCE_TYPES: ResourceTypeMap = {
  ALERT: 'ALERT',
  DASHBOARD: 'DASHBOARD',
  QUERY_POLICY: 'QUERY_POLICY',
  SECURITY_GROUP: 'GROUP',
  SITE: 'SITE',
  USER: 'USER',
};

export const RESOURCE_TYPE_VALUES: $ReadOnlyArray<ResourceType> = Object.keys(
  RESOURCE_TYPES,
).map(key => RESOURCE_TYPES[key]);

export const ALERTS_PERMISSIONS: AlertsPermissionMap = {
  CREATE: 'create_resource',
  DELETE: 'delete_resource',
  EDIT: 'edit_resource',
  UPDATE_USERS: 'update_users',
  VIEW: 'view_resource',
};

export const DASHBOARD_PERMISSIONS: DashboardPermissionMap = {
  CREATE: 'create_resource',
  DELETE: 'delete_resource',
  EDIT: 'edit_resource',
  PUBLISH: 'publish_resource',
  UPDATE_USERS: 'update_users',
  VIEW: 'view_resource',
};

export const SITE_PERMISSIONS: SitePermissionMap = {
  CAN_UPLOAD_DATA: 'can_upload_data',
  DELETE_USER: 'delete_user',
  EDIT_USER: 'edit_user',
  INIVTE_USER: 'invite_user',
  LIST_RESOURCES: 'list_resources',
  LIST_ROLES: 'list_roles',
  LIST_USERS: 'list_users',
  RESET_PASSWORD: 'reset_password',
  RUN_QUERY: 'run_query',
  VIEW_ADMIN_PAGE: 'view_admin_page',
  VIEW_CASE_MANAGEMENT: 'view_case_management',
  VIEW_DATA_QUALITY: 'view_data_quality',
  VIEW_QUERY_FORM: 'view_query_form',
  VIEW_USER: 'view_user',
};

export const RESOURCE_ROLE_MAP: ResourceRoleMap = {
  ALERT_ADMIN: 'alert_admin',
  ALERT_EDITOR: 'alert_editor',
  ALERT_VIEWER: 'alert_viewer',
  DASHBOARD_ADMIN: 'dashboard_admin',
  DASHBOARD_EDITOR: 'dashboard_editor',
  DASHBOARD_VIEWER: 'dashboard_viewer',
};
