import Promise from 'bluebird';
import PropTypes from 'prop-types';

import VendorScript from 'vendor/models/VendorScript';
import { def } from 'util/ZenModel';
import { noop } from 'util/util';

// TODO(stephen, pablo): There should be a way to configure this globally.
Promise.config({ cancellation: true });

export default class DependentVendorScript extends VendorScript.withTypes({
  dependencies: def(
    PropTypes.arrayOf(PropTypes.instanceOf(VendorScript)).isRequired,
  ),
  afterDependencyLoad: def(PropTypes.func, noop),
}) {
  static create(scriptFile, ...args) {
    return new this({
      scriptPath: this.resolvePath(scriptFile),
      dependencies: args,
    });
  }

  load() {
    this.before()();
    return Promise.all(this.dependencies().map(d => d.load()))
      .then(this.afterDependencyLoad())
      .then(() => this.loadFn()(this.scriptPath()))
      .then(this.after());
  }
}
