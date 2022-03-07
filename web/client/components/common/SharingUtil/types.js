// @flow

import SecurityGroup from 'services/models/SecurityGroup';

export type ExportSelectionMap = {
  EXCEL_ALL: 'EXCEL_ALL',
  EXCEL_WITH_CONSTITUENTS: 'EXCEL_WITH_CONSTITUENTS',
  EXCEL_TIME_SERIES: 'EXCEL_TIME_SERIES',
  FIELD_MAPPING: 'FIELD_MAPPING',
  FHIR_DATA: 'FHIR_DATA',
  JSON: 'JSON',
};

export type ExportSelection = $Keys<ExportSelectionMap>;

export type EmailInfo = $ReadOnly<{
  recipients: $ReadOnlyArray<string>,
  externalRecipients: $ReadOnlyArray<string>,
  message: string,
  subject: string,
  sender: string,
  attachments: {
    [key: string]: {
      filename: string,
      content: string,
    },
  },
  attachmentOptions: $ReadOnlyArray<ExportSelection>,
  imageUrl: string,
  isEmbedImage: boolean,
  recipientUserGroups: $ReadOnlyArray<SecurityGroup>,
}>;
