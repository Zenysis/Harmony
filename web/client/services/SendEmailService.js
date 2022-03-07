// @flow
import Promise from 'bluebird';

import APIService, { API_VERSION } from 'services/APIService';
import SecurityGroup from 'services/models/SecurityGroup';
import autobind from 'decorators/autobind';
import type { HTTPService } from 'services/APIService';

class SendEmailService {
  _httpService: HTTPService;

  constructor(httpService: HTTPService) {
    this._httpService = httpService;
  }

  /**
   * Post query data to server to send an email.
   * @returns {Promise<string>} Promise returning message
   */
  @autobind
  sendQueryDataEmail(
    subject: string,
    recipients: $ReadOnlyArray<string>,
    sender: string,
    message: string,
    isPreview: boolean,
    imageUrl: string,
    queryUrl: string | void,
    attachments: $ReadOnlyArray<{ content: string, filename: string }> | void,
    attachmentOptions: $ReadOnlyArray<string> | void,
    recipientUserGroups: $ReadOnlyArray<SecurityGroup>,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const segment = {
        recipients,
        numberOfRecipients: recipients.length,
        dataExportTypes: attachmentOptions,
        isImageEmbedded: imageUrl.length !== 0,
        isPreviewEmail: isPreview,
        emailSender: sender,
        message,
        queryUrl,
      };
      const allRecipients = new Set([...recipients]);
      if (!isPreview) {
        recipientUserGroups.forEach(group => {
          group.users().forEach(user => allRecipients.add(user.username()));
        });
      }

      const emailData = {
        subject,
        recipients: [...allRecipients],
        sender,
        message,
        isPreview,
        imageUrl,
        attachments,
        queryUrl,
      };

      this._httpService
        .post(API_VERSION.V2, '/share/email', emailData)
        .then(response => {
          analytics.track('Shared Analysis via Email', {
            ...segment,
            status: 'accepted',
          });
          return resolve(response.message);
        })
        .catch(error => {
          analytics.track('Shared Analysis via Email', {
            ...segment,
            status: 'failed',
          });
          return reject(error);
        });
    });
  }
}

export default (new SendEmailService(APIService): SendEmailService);
