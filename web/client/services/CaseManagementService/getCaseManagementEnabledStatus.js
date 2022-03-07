import Promise from 'bluebird';

export default function getCaseManagementEnabledStatus(): Promise<boolean> {
  return Promise.resolve(false);
}
