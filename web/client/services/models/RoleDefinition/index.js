// @flow
import * as Zen from 'lib/Zen';
import QueryPolicy from 'services/models/QueryPolicy';
import { RESOURCE_ROLE_MAP } from 'services/AuthorizationService/registry';
import type { Serializable } from 'lib/Zen';

// All tools that can be selected and given access to within a role definition.
export type RoleTools =
  | 'analyzeTool'
  | 'dashboardCreator'
  | 'dataQualityLab'
  | 'alertsApp'
  | 'caseManagementApp';

export const ADMIN_ROLE_NAME = 'admin';
export const MANAGER_ROLE_NAME = 'manager';

export const IMMUTABLE_ROLES = [ADMIN_ROLE_NAME, MANAGER_ROLE_NAME];

// Mapping between tool to its default permission.
const TOOL_TO_PERMISSION_DATA = {
  alertsApp: { permission: 'create_resource', resource_type_id: 6 },
  analyzeTool: { permission: 'view_query_form', resource_type_id: 1 },
  caseManagementApp: {
    permission: 'view_case_management',
    resource_type_id: 1,
  },
  dashboardCreator: { permission: 'create_resource', resource_type_id: 2 },
  dataQualityLab: { permission: 'view_data_quality', resource_type_id: 1 },
};

export const SELECTABLE_TOOLS: $ReadOnlyArray<RoleTools> = [
  'analyzeTool',
  'dashboardCreator',
  'dataQualityLab',
  'alertsApp',
  'caseManagementApp',
];
export type SerializedPermission = {
  permission: string,
  resource_type_id: number,
};

type SerializedRoleDefinition = {
  $uri: string,
  alertResourceRoleName: string,
  dashboardResourceRoleName: string,
  dataExport: boolean,
  label: string,
  name: string,
  permissions: $ReadOnlyArray<SerializedPermission>,
  queryPolicies: Array<Zen.Serialized<QueryPolicy>>,
  usernames: $ReadOnlyArray<string>,
};

type DefaultValues = {
  /**
   * The alert resource role name for this role.
   * NOTE(all): empty string means there is no associated alertResourceRole
   */
  alertResourceRoleName: string,

  /**
   * The dashboard resource role name for this role.
   * NOTE(all): empty string means there is no associated dashboardResourceRole
   */
  dashboardResourceRoleName: string,

  /**
   * Defines whether users tied to this role have access to export data.
   */
  dataExport: boolean,

  /**
   * The human-readable representation of the Role Definition
   */
  label: string,

  /**
   * The unique string value that is used to represent this role on the backend
   * and in user/security group permissions
   */
  name: string,

  /**
   * The list of query policies associated with this role.
   */
  queryPolicies: Zen.Array<QueryPolicy>,

  /**
   * The list of permission objects indicating what activities that that users with
   * this particular role can perform.
   */
  tools: Zen.Array<RoleTools>,

  /**
   * The unique uri that can be used to locate this role definition on the
   * server.
   */
  uri: string,

  /**
   * The list of usernames of users with permissions to this role.
   */
  usernames: Zen.Array<string>,
};

class RoleDefinition extends Zen.BaseModel<RoleDefinition, {}, DefaultValues>
  implements Serializable<SerializedRoleDefinition> {
  static defaultValues: DefaultValues = {
    alertResourceRoleName: '',
    dashboardResourceRoleName: '',
    dataExport: false,
    label: '',
    name: '',
    queryPolicies: Zen.Array.create(),
    tools: Zen.Array.create(),
    uri: '',
    usernames: Zen.Array.create(),
  };

  static deserialize({
    $uri,
    alertResourceRoleName,
    dashboardResourceRoleName,
    dataExport,
    label,
    name,
    permissions,
    queryPolicies,
    usernames,
  }: SerializedRoleDefinition): Zen.Model<RoleDefinition> {
    const tools = [];
    Object.keys(TOOL_TO_PERMISSION_DATA).forEach(toolName => {
      const toolPermission = TOOL_TO_PERMISSION_DATA[toolName];
      if (
        permissions.some(
          permission =>
            permission.resource_type_id === toolPermission.resource_type_id &&
            permission.permission === toolPermission.permission,
        )
      ) {
        tools.push(toolName);
      }
    });

    return RoleDefinition.create({
      alertResourceRoleName,
      dashboardResourceRoleName,
      dataExport,
      label,
      name,
      queryPolicies: Zen.deserializeToZenArray(QueryPolicy, queryPolicies),
      tools: Zen.Array.create(tools),
      uri: $uri,
      usernames: Zen.Array.create(usernames),
    });
  }

  /**
   * Accessor to account for implicit Site Admin access.
   */
  isAdmin(): boolean {
    return this._.name() === ADMIN_ROLE_NAME;
  }

  /**
   * Accessor to account for implicit Site Admin access.
   */
  getTools(): Zen.Array<RoleTools> {
    const { tools } = this.modelValues();
    return this.isAdmin() ? Zen.Array.create(SELECTABLE_TOOLS) : tools;
  }

  /**
   * Accessor to account for implicit Site Admin access.
   */
  getQueryPolicies(): Zen.Array<QueryPolicy> {
    const { queryPolicies } = this.modelValues();
    return this.isAdmin()
      ? Zen.Array.create(QueryPolicy.getAllPolicies())
      : queryPolicies;
  }

  /**
   * Accessor to account for implicit Site Admin access.
   */
  getSitewideDashboardRoleName(): string {
    return this.isAdmin()
      ? RESOURCE_ROLE_MAP.DASHBOARD_ADMIN
      : this._.dashboardResourceRoleName();
  }

  /**
   * Accessor to account for implicit Site Admin access.
   */
  getSitewideAlertRoleName(): string {
    return this.isAdmin()
      ? RESOURCE_ROLE_MAP.ALERT_ADMIN
      : this._.alertResourceRoleName();
  }

  serialize(): SerializedRoleDefinition {
    const {
      alertResourceRoleName,
      dashboardResourceRoleName,
      dataExport,
      label,
      name,
      queryPolicies,
      tools,
      uri,
      usernames,
    } = this.modelValues();
    const toolPermissions = tools.map(tool => TOOL_TO_PERMISSION_DATA[tool]);
    return {
      alertResourceRoleName,
      dashboardResourceRoleName,
      dataExport,
      label,
      name,
      $uri: uri,
      permissions: toolPermissions.toArray(),
      queryPolicies: Zen.serializeArray(queryPolicies),
      usernames: usernames.toArray(),
    };
  }
}

export default ((RoleDefinition: $Cast): Class<Zen.Model<RoleDefinition>>);
