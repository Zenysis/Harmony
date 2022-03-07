// @flow
import Promise from 'bluebird';

import ZenClient from 'util/ZenClient';
import autobind from 'decorators/autobind';
import { pick } from 'util/objUtil';

export type FieldInfo = {
  count: number,
  endDate: string | null,
  formula: string | null,
  humanReadableFormulaHtml: string,
  startDate: string | null,
};

class FieldInfoService {
  _fieldInfoCache: { [string]: FieldInfo, ... };
  constructor() {
    this._fieldInfoCache = {};
  }

  @autobind
  fetchMultiple(
    fieldIds: Array<string>,
  ): Promise<{ [string]: FieldInfo, ... }> {
    // Only request fieldIds that we haven't queried yet.
    const fieldIdsToQuery = fieldIds.filter(
      fieldId => !this._fieldInfoCache[fieldId],
    );
    if (!fieldIdsToQuery.length) {
      return new Promise(resolve => {
        resolve(pick(this._fieldInfoCache, fieldIds));
      });
    }

    return new Promise((resolve, reject) => {
      ZenClient.request(`field/${fieldIdsToQuery.join(',')}`)
        .then(resp => {
          Object.keys(resp).forEach(fieldId => {
            this._fieldInfoCache[fieldId] = resp[fieldId];
          });
          resolve(pick(this._fieldInfoCache, fieldIds));
        })
        .catch(error => reject(error));
    });
  }

  @autobind
  fetchSingle(fieldId: string): Promise<FieldInfo> {
    return this.fetchMultiple([fieldId]).then(fields => fields[fieldId]);
  }
}

export default (new FieldInfoService(): FieldInfoService);
