// @flow
/* eslint-disable no-use-before-define */
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import CachedScriptLoaderService from 'vendor/services/CachedScriptLoaderService';
import { buildVendorScript } from 'vendor/models/util';
import { noop } from 'util/util';
import type VendorScript from 'vendor/models/VendorScript';

// TODO: There should be a way to configure this globally.
Promise.config({ cancellation: true });

type RequiredValues = {
  dependencies: $ReadOnlyArray<DependentVendorScript | VendorScript>,
  scriptFile: string,
};

type DefaultValues = {
  after: () => void,
  afterDependencyLoad: () => void,
  before: () => void,
  loadFn: string => Promise<void>,
};

type DerivedValues = {
  scriptPath: string,
};

class DependentVendorScript extends Zen.BaseModel<
  DependentVendorScript,
  RequiredValues,
  DefaultValues,
  DerivedValues,
> {
  static defaultValues: DefaultValues = {
    after: noop,
    afterDependencyLoad: noop,
    before: noop,
    loadFn: CachedScriptLoaderService.fetchScript,
  };

  static derivedConfig: Zen.DerivedConfig<
    DependentVendorScript,
    DerivedValues,
  > = {
    scriptPath: [
      Zen.hasChanged('scriptFile'),
      vendorScript => buildVendorScript(vendorScript),
    ],
  };

  load(): Promise<void> {
    this._.before()();
    return Promise.all(this._.dependencies().map(d => d.load()))
      .then(this._.afterDependencyLoad())
      .then(() => this._.loadFn()(this._.scriptPath()))
      .then(this._.after());
  }
}

export default ((DependentVendorScript: $Cast): Class<
  Zen.Model<DependentVendorScript>,
>);
