// @flow
import moment from 'moment';

export default function buildFilename(
  fieldLabel: string,
  extension?: string | void = undefined,
): string {
  const fieldName = fieldLabel.replace(/[|&;$%@"<>()+,]/g, '');
  const baseName = `${moment().format()} ${fieldName}`;
  if (extension === undefined || extension === '') {
    return baseName;
  }
  return `${baseName}.${extension}`;
}
