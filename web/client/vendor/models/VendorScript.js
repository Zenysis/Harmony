// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import CachedScriptLoaderService from 'vendor/services/CachedScriptLoaderService';
// eslint-disable-next-line import/extensions
import { VENDOR_SCRIPT_PATH } from 'backend_config.js';
import { noop } from 'util/util';
import type DependentVendorScript from 'vendor/models/DependentVendorScript';

type RequiredValues = {
  scriptFile: string,
};

type DefaultValues = {
  after: () => void,
  before: () => void,
  loadFn: string => Promise<void>,
};

type DerivedValues = {
  scriptPath: string,
};

class VendorScript extends Zen.BaseModel<
  VendorScript,
  RequiredValues,
  DefaultValues,
  DerivedValues,
> {
  static defaultValues: DefaultValues = {
    after: noop,
    before: noop,
    loadFn: CachedScriptLoaderService.fetchScript,
  };

  static derivedConfig: Zen.DerivedConfig<VendorScript, DerivedValues> = {
    scriptPath: [
      Zen.hasChanged('scriptFile'),
      vendorScript => `${VENDOR_SCRIPT_PATH}/${vendorScript._.scriptFile()}`,
    ],
  };

  static loadAll(
    vendorScripts: $ReadOnlyArray<VendorScript | DependentVendorScript>,
  ): Promise<Array<void>> {
    return Promise.all(vendorScripts.map(s => s.load()));
  }

  load(): Promise<void> {
    this._.before()();
    return this._.loadFn()(this._.scriptPath()).then(this._.after());
  }
}

export default ((VendorScript: $Cast): Class<Zen.Model<VendorScript>>);
