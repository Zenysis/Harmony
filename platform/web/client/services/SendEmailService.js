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
        message,
        queryUrl,
        recipients,
        dataExportTypes: attachmentOptions,
        emailSender: sender,
        isImageEmbedded: imageUrl.length !== 0,
        isPreviewEmail: isPreview,
        numberOfRecipients: recipients.length,
      };
      const allRecipients = new Set([...recipients]);
      if (!isPreview) {
        recipientUserGroups.forEach(group => {
          group.users().forEach(user => allRecipients.add(user.username()));
        });
      }

      const emailData = {
        attachments,
        imageUrl,
        isPreview,
        message,
        queryUrl,
        sender,
        subject,
        recipients: [...allRecipients],
      };

      this._httpService
        .post(API_VERSION.V2, '/share/email', emailData)
        .then(response => {
          return resolve(response.message);
        })
        .catch(error => {
          return reject(error);
        });
    });
  }
}

export default (new SendEmailService(APIService): SendEmailService);
