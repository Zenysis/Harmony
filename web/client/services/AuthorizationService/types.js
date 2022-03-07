// @flow
export type ResourceTypeMap = {
  ALERT: 'ALERT',
  DASHBOARD: 'DASHBOARD',
  QUERY_POLICY: 'QUERY_POLICY',
  SECURITY_GROUP: 'GROUP',
  SITE: 'SITE',
  USER: 'USER',
};

export type ResourceRoleMap = {
  ALERT_ADMIN: 'alert_admin',
  ALERT_EDITOR: 'alert_editor',
  ALERT_VIEWER: 'alert_viewer',
  DASHBOARD_ADMIN: 'dashboard_admin',
  DASHBOARD_EDITOR: 'dashboard_editor',
  DASHBOARD_VIEWER: 'dashboard_viewer',
};

export type AlertsPermissionMap = {
  CREATE: 'create_resource',
  DELETE: 'delete_resource',
  EDIT: 'edit_resource',
  UPDATE_USERS: 'update_users',
  VIEW: 'view_resource',
};

export type DashboardPermissionMap = {
  CREATE: 'create_resource',
  DELETE: 'delete_resource',
  EDIT: 'edit_resource',
  PUBLISH: 'publish_resource',
  UPDATE_USERS: 'update_users',
  VIEW: 'view_resource',
};

export type SitePermissionMap = {
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

export type ResourceType = $Values<ResourceTypeMap>;

export type DashboardPermission = $Values<DashboardPermissionMap>;

export type AlertPermission =
  | 'view_resource'
  | 'edit_resource'
  | 'update_users'
  | 'delete_resource'
  | 'create_resource';

export type SitePermission = $Values<SitePermissionMap>;

export type AuthPermission =
  | AlertPermission
  | DashboardPermission
  | SitePermission;

// TODO(stephen, pablo): This is an incomplete definition for a backend
// resource.
export type ResourceResponse = {
  label: string,
  name: string,
};

// TODO(stephen, pablo): This is an incomplete definition for a backend
// resource type.
export type ResourceTypeResponse = {
  label: string,
  name: string,
};

export type AuthorizationRequest = {
  permission: AuthPermission,
  resourceName?: string | null,
  resourceType: ResourceType,
};
