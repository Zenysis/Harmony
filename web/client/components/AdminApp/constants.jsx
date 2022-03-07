// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import Dropdown from 'components/ui/Dropdown';
import Option from 'components/ui/Dropdown/Option';
import { RESOURCE_ROLE_MAP } from 'services/AuthorizationService/registry';
import { USER_STATUS } from 'services/models/User';
import type ItemLevelACL from 'services/models/ItemLevelACL';
import type RoleDefinition from 'services/models/RoleDefinition';
import type SecurityGroup from 'services/models/SecurityGroup';
import type User from 'services/models/User';

export type UserWithGroups = {
  user: User,
  groups: Zen.Array<SecurityGroup>,
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
  key: string,
  displayContents: string,
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
  FIRST_NAME: UserProfileField,
  LAST_NAME: UserProfileField,
  EMAIL: UserProfileField,
  PHONE_NUMBER: UserProfileField,
  STATUS: UserProfileField,
  USER_ROLES: UserProfileField,
};

// User status options (formatted so they can be easily added to a Dropdown)
export const USER_STATUS_TRANSLATIONS: UserStatusEntryMap = {
  [USER_STATUS.ACTIVE]: {
    key: USER_STATUS.ACTIVE,
    displayContents: t('admin_app.user_status_values.active'),
  },
  [USER_STATUS.INACTIVE]: {
    key: USER_STATUS.INACTIVE,
    displayContents: t('admin_app.user_status_values.inactive'),
  },
  [USER_STATUS.PENDING]: {
    key: USER_STATUS.PENDING,
    displayContents: t('admin_app.user_status_values.pending'),
  },
};

export const USER_PROFILE_FIELD: UserProfileFields = {
  FIRST_NAME: {
    fieldName: 'firstName',
    label: t('admin_app.userProfileModal.firstName'),
  },
  LAST_NAME: {
    fieldName: 'lastName',
    label: t('admin_app.userProfileModal.lastName'),
  },
  EMAIL: {
    fieldName: 'username',
    label: t('admin_app.userProfileModal.email'),
  },
  PHONE_NUMBER: {
    fieldName: 'phoneNumber',
    label: t('admin_app.userProfileModal.phoneNumber'),
  },
  STATUS: {
    fieldName: 'status',
    label: t('admin_app.userProfileModal.status'),
  },
  USER_ROLES: {
    fieldName: 'roles',
    label: t('admin_app.userProfileModal.user_roles'),
  },
};

const TEXT = t('admin_app.constants');

type AlertAndDashboardTextToOptionsMap = {
  +[text: string]: string,
};

export const DASHBOARD_SITEWIDE_OPTIONS_MAP: AlertAndDashboardTextToOptionsMap = {
  [TEXT.dashboardRequireInvite]: '',
  [TEXT.dashboardViewer]: RESOURCE_ROLE_MAP.DASHBOARD_VIEWER,
  [TEXT.dashboardEditor]: RESOURCE_ROLE_MAP.DASHBOARD_EDITOR,
  [TEXT.dashboardAdmin]: RESOURCE_ROLE_MAP.DASHBOARD_ADMIN,
};

export const ALERT_SITEWIDE_OPTIONS_MAP: AlertAndDashboardTextToOptionsMap = {
  [TEXT.alertRequireInvite]: '',
  [TEXT.alertViewer]: RESOURCE_ROLE_MAP.ALERT_VIEWER,
  [TEXT.alertEditor]: RESOURCE_ROLE_MAP.ALERT_EDITOR,
  [TEXT.alertAdmin]: RESOURCE_ROLE_MAP.ALERT_ADMIN,
};

export const SINGLE_DASHBOARD_OPTIONS_MAP: AlertAndDashboardTextToOptionsMap = {
  [TEXT.dashboardViewer]: RESOURCE_ROLE_MAP.DASHBOARD_VIEWER,
  [TEXT.dashboardEditor]: RESOURCE_ROLE_MAP.DASHBOARD_EDITOR,
  [TEXT.dashboardAdmin]: RESOURCE_ROLE_MAP.DASHBOARD_ADMIN,
};

export const SINGLE_ALERT_OPTIONS_MAP: AlertAndDashboardTextToOptionsMap = {
  [TEXT.alertViewer]: RESOURCE_ROLE_MAP.ALERT_VIEWER,
  [TEXT.alertEditor]: RESOURCE_ROLE_MAP.ALERT_EDITOR,
  [TEXT.alertAdmin]: RESOURCE_ROLE_MAP.ALERT_ADMIN,
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
