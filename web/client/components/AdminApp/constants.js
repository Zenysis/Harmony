// @flow

import { USER_STATUS } from 'services/models/User';
import type { UserStatus } from 'services/models/User';

export type UserStatusEntry = {
  key: string,
  displayContents: string,
};

export type UserProfileField = {
  fieldName: string,
  label: string,
};

type UserStatuses = { [status: UserStatus]: UserStatusEntry };
type UserProfileFields = { [field: string]: UserProfileField };

// User status options (formatted so they can be easily added to a Dropdown)
export const USER_STATUS_TRANSLATIONS: UserStatuses = {
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
