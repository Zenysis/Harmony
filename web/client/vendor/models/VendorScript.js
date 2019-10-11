// @flow
import Promise from 'bluebird';
import PropTypes from 'prop-types';

import CachedScriptLoaderService from 'vendor/services/CachedScriptLoaderService';
import ZenModel, { def } from 'util/ZenModel';
import { noop } from 'util/util';
// eslint-disable-next-line import/extensions
import { VENDOR_SCRIPT_PATH } from 'backend_config.js';

export default class VendorScript extends ZenModel.withTypes({
  scriptPath: def(PropTypes.string.isRequired),
  before: def(PropTypes.func, noop),
  after: def(PropTypes.func, noop),

  loadFn: def(
    PropTypes.func.isRequired, // f(script: string).then()
    CachedScriptLoaderService.fetchScript,
    ZenModel.PRIVATE,
  ),
}) {
  static create(scriptFile: string) {
    return new this({
      scriptPath: this.resolvePath(scriptFile),
    });
  }

  static resolvePath(scriptFile: string): string {
    return `${VENDOR_SCRIPT_PATH}/${scriptFile}`;
  }

  static loadAll(vendorScripts: Array<VendorScript>): Promise<Array<void>> {
    return Promise.all(vendorScripts.map(s => s.load()));
  }

  load(): Promise<void> {
    this.before()();
    return this.loadFn()(this.scriptPath()).then(this.after());
  }
}
