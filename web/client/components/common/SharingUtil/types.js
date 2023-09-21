// @flow

import SecurityGroup from 'services/models/SecurityGroup';

export type ExportSelectionMap = {
  EXCEL_ALL: 'EXCEL_ALL',
  EXCEL_TIME_SERIES: 'EXCEL_TIME_SERIES',
  EXCEL_WITH_CONSTITUENTS: 'EXCEL_WITH_CONSTITUENTS',
  FHIR_DATA: 'FHIR_DATA',
  FIELD_MAPPING: 'FIELD_MAPPING',
  JSON: 'JSON',
};

export type ExportSelection = $Keys<ExportSelectionMap>;

export type EmailInfo = $ReadOnly<{
  attachmentOptions: $ReadOnlyArray<ExportSelection>,
  attachments: {
    [key: string]: {
      content: string,
      filename: string,
    },
  },
  externalRecipients: $ReadOnlyArray<string>,
  imageUrl: string,
  isEmbedImage: boolean,
  message: string,
  recipients: $ReadOnlyArray<string>,
  recipientUserGroups: $ReadOnlyArray<SecurityGroup>,
  sender: string,
  subject: string,
}>;
