// @flow
/* eslint-disable */
import I18N from 'lib/I18N';
import SecurityGroup from 'services/models/SecurityGroup';

export type ShareDashboardEmailInfo = $ReadOnly<{
  dashboardUrl?: string,
  externalRecipients: $ReadOnlyArray<string>,
  message: string,
  noAccessRecipients: $ReadOnlyArray<string>,
  recipients: $ReadOnlyArray<string>,
  recipientUserGroups: $ReadOnlyArray<SecurityGroup>,
  sender: string,
  shouldAttachPdf: boolean,
  shouldEmbedImage: boolean,
  subject: string,
  useRecipientQueryPolicy: boolean,
  useSingleEmailThread: boolean,
}>;

export type AttachmentOptions = $ReadOnly<{
  shouldAttachPdf: boolean,
  shouldEmbedImage: boolean,
  useRecipientQueryPolicy: boolean,
}>;

type Weekdays = {
  MONDAY: string,
  TUESDAY: string,
  WEDNESDAY: string,
  THURSDAY: string,
  FRIDAY: string,
  SATURDAY: string,
  SUNDAY: string,
};

type Cadences = {
  MONTHLY: string,
  WEEKLY: string,
  DAILY: string,
  QUARTERLY: string,
  SEMIANNUALLY: string,
};

export const EXCEL = 'EXCEL';
export const PDF = 'PDF';
export const JPEG = 'JPEG';

export const MONTHLY = 'MONTHLY';
export const WEEKLY = 'WEEKLY';
export const DAILY = 'DAILY';
export const QUARTERLY = 'QUARTERLY';
export const SEMIANNUALLY = 'SEMIANNUALLY';

export const TIMES = [
  '00:00',
  '00:30',
  '01:00',
  '01:30',
  '02:00',
  '02:30',
  '03:00',
  '03:30',
  '04:00',
  '04:30',
  '05:00',
  '05:30',
  '06:00',
  '06:30',
  '07:00',
  '07:30',
  '08:00',
  '08:30',
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
  '18:00',
  '18:30',
  '19:00',
  '19:30',
  '20:00',
  '20:30',
  '21:00',
  '21:30',
  '22:00',
  '22:30',
  '23:00',
  '23:30',
];

export const WEEKDAYS: Weekdays = {
  MONDAY: I18N.textById('Monday'),
  TUESDAY: I18N.textById('Tuesday'),
  WEDNESDAY: I18N.textById('Wednesday'),
  THURSDAY: I18N.textById('Thursday'),
  FRIDAY: I18N.textById('Friday'),
  SATURDAY: I18N.textById('Saturday'),
  SUNDAY: I18N.textById('Sunday'),
};

export const CADENCES: Cadences = {
  MONTHLY: I18N.text('Monthly'),
  WEEKLY: I18N.text('Weekly'),
  DAILY: I18N.text('Daily'),
  SEMIANNUALLY: I18N.text('Semi-Annually'),
  QUARTERLY: I18N.textById('Quarterly'),
};
