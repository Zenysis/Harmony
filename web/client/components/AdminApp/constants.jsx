// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import Dropdown from 'components/ui/Dropdown';
import I18N from 'lib/I18N';
import Option from 'components/ui/Dropdown/Option';
import { RESOURCE_ROLE_MAP } from 'services/AuthorizationService/registry';
import { USER_STATUS } from 'services/models/User';
import type ItemLevelACL from 'services/models/ItemLevelACL';
import type RoleDefinition from 'services/models/RoleDefinition';
import type SecurityGroup from 'services/models/SecurityGroup';
import type User from 'services/models/User';

export type UserWithGroups = {
  groups: Zen.Array<SecurityGroup>,
  user: User,
};

export type GroupACLPair = {
  acl: ItemLevelACL,
  group: SecurityGroup,
};

export type GroupWithRoles = {
  group: SecurityGroup,
  role: RoleDefinition,
};

export type UserStatusEntry = {
  displayContents: string,
  key: string,
};

export type UserProfileField = {
  fieldName: string,
  label: string,
};

export function filterACLs(
  acls: $ReadOnlyArray<ItemLevelACL>,
  type: string,
): $ReadOnlyArray<ItemLevelACL> {
  return acls.filter(acl => acl.resource().resourceType() === type);
}

type UserStatusEntryMap = {
  active: UserStatusEntry,
  inactive: UserStatusEntry,
  pending: UserStatusEntry,
};

type UserProfileFields = {
  EMAIL: UserProfileField,
  FIRST_NAME: UserProfileField,
  LAST_NAME: UserProfileField,
  PHONE_NUMBER: UserProfileField,
  STATUS: UserProfileField,
  USER_ROLES: UserProfileField,
};

// User status options (formatted so they can be easily added to a Dropdown)
export const USER_STATUS_TRANSLATIONS: UserStatusEntryMap = {
  [USER_STATUS.ACTIVE]: {
    displayContents: I18N.text('Active', 'active'),
    key: USER_STATUS.ACTIVE,
  },
  [USER_STATUS.INACTIVE]: {
    displayContents: I18N.text('Inactive', 'inactive'),
    key: USER_STATUS.INACTIVE,
  },
  [USER_STATUS.PENDING]: {
    displayContents: I18N.text('Pending', 'pending'),
    key: USER_STATUS.PENDING,
  },
};

export const USER_PROFILE_FIELD: UserProfileFields = {
  EMAIL: {
    fieldName: 'username',
    label: I18N.textById('Email'),
  },
  FIRST_NAME: {
    fieldName: 'firstName',
    label: I18N.text('First Name', 'firstName'),
  },
  LAST_NAME: {
    fieldName: 'lastName',
    label: I18N.text('Last Name', 'lastName'),
  },
  PHONE_NUMBER: {
    fieldName: 'phoneNumber',
    label: I18N.text('Phone Number'),
  },
  STATUS: {
    fieldName: 'status',
    label: I18N.textById('status'),
  },
  USER_ROLES: {
    fieldName: 'roles',
    label: I18N.text('User Roles', 'userRoles'),
  },
};

type AlertAndDashboardTextToOptionsMap = {
  +[text: string]: string,
};

export const DASHBOARD_SITEWIDE_OPTIONS_MAP: AlertAndDashboardTextToOptionsMap = {
  [I18N.text(
    'Require invite to view, edit or admin individual dashboards',
    'dashboardRequireInvite',
  )]: '',
  [I18N.text(
    'Dashboard Viewer',
    'dashboardViewer',
  )]: RESOURCE_ROLE_MAP.DASHBOARD_VIEWER,
  [I18N.text(
    'Dashboard Editor',
    'dashboardEditor',
  )]: RESOURCE_ROLE_MAP.DASHBOARD_EDITOR,
  [I18N.text(
    'Dashboard Admin',
    'dashboardAdmin',
  )]: RESOURCE_ROLE_MAP.DASHBOARD_ADMIN,
};

export const ALERT_SITEWIDE_OPTIONS_MAP: AlertAndDashboardTextToOptionsMap = {
  [I18N.text(
    'Require invite to view, edit or admin individual alerts',
    'alertRequireInvite',
  )]: '',
  [I18N.text('Alert Viewer', 'alertViewer')]: RESOURCE_ROLE_MAP.ALERT_VIEWER,
  [I18N.text('Alert Editor', 'alertEditor')]: RESOURCE_ROLE_MAP.ALERT_EDITOR,
  [I18N.text('Alert Admin', 'alertAdmin')]: RESOURCE_ROLE_MAP.ALERT_ADMIN,
};

export const SINGLE_DASHBOARD_OPTIONS_MAP: AlertAndDashboardTextToOptionsMap = {
  [I18N.textById('dashboardViewer')]: RESOURCE_ROLE_MAP.DASHBOARD_VIEWER,
  [I18N.textById('dashboardEditor')]: RESOURCE_ROLE_MAP.DASHBOARD_EDITOR,
  [I18N.textById('dashboardAdmin')]: RESOURCE_ROLE_MAP.DASHBOARD_ADMIN,
};

export const SINGLE_ALERT_OPTIONS_MAP: AlertAndDashboardTextToOptionsMap = {
  [I18N.textById('alertViewer')]: RESOURCE_ROLE_MAP.ALERT_VIEWER,
  [I18N.textById('alertEditor')]: RESOURCE_ROLE_MAP.ALERT_EDITOR,
  [I18N.textById('alertAdmin')]: RESOURCE_ROLE_MAP.ALERT_ADMIN,
};

/**
 * Creates dropdown options for a given map
 */
export function createDropOptions(
  map: AlertAndDashboardTextToOptionsMap,
): Array<React.Element<typeof Option>> {
  return Object.keys(map).map(key => (
    <Dropdown.Option key={map[key]} value={map[key]}>
      {key}
    </Dropdown.Option>
  ));
}
