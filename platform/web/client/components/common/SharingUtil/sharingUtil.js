// @flow
import Promise from 'bluebird';
import invariant from 'invariant';

import I18N from 'lib/I18N';
import Toaster from 'components/ui/Toaster';

const EMAIL_PATTERN = '(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$)';
const EMAIL_REGEX = RegExp(EMAIL_PATTERN);

function isEmailValid(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

function isEmpty(value: string): boolean {
  return value.length === 0;
}

export function validateInputs(
  recipients: $ReadOnlyArray<string>,
  message: string,
  subject: string,
  isPreview: boolean = false,
  recipientUserGroups: $ReadOnlyArray<string>,
): Array<{ key: string, value: string }> {
  const errors = [];
  if (isEmpty(message))
    errors.push({ key: 'message', value: I18N.text('Please enter a message') });
  if (isEmpty(subject))
    errors.push({ key: 'subject', value: I18N.text('Please enter a subject') });
  if (!recipients.length && !isPreview && !recipientUserGroups.length) {
    errors.push({
      key: 'to',
      value: I18N.text('Please enter a correct recipient email'),
    });
  }

  const groupSet = new Set(recipientUserGroups);

  recipients.forEach(value => {
    if (!groupSet.has(value) && !isEmpty(value) && !isEmailValid(value)) {
      errors.push({
        key: value,
        value: I18N.text(
          '"%(value)s" is not a valid email address or group name',
          {
            value,
          },
        ),
      });
    }
  });
  return errors;
}

export function copyTextToClipboard(text: string): Promise<void> {
  // Use Clipboard API
  if (navigator.clipboard) {
    return Promise.resolve(navigator.clipboard.writeText(text)).then(() => {
      Toaster.success(
        I18N.text(
          'Shareable link was successfully copied to clipboard',
          'copyToClipboardSuccess',
        ),
      );
    });
  }

  invariant(document.body, 'Document body must be loaded.');
  const { body } = document;

  // Else use the document.execCommand function
  const span = document.createElement('span');
  span.textContent = text;
  body.appendChild(span);

  const selection = window.getSelection();
  const range = window.document.createRange();
  selection.removeAllRanges();
  range.selectNode(span);
  selection.addRange(range);

  document.execCommand('copy');
  selection.removeAllRanges();

  // clean up
  body.removeChild(span);
  Toaster.success(I18N.textById('copyToClipboardSuccess'));
  return Promise.resolve();
}
