// @flow
import * as React from 'react';
import ReactDOM from 'react-dom';
import invariant from 'invariant';

import ToastManager from 'components/ui/Toaster/internal/ToastManager';
import autobind from 'decorators/autobind';
import type { ToastSettings } from 'components/ui/Toaster/internal/types';

/**
 * The Toaster manages the interactions between the ToastManager and the
 * toast API.
 */
class Toaster {
  _toastManagerRef: { current: ToastManager | null } = React.createRef();

  constructor() {
    const { body } = document;
    if (!body) {
      return;
    }

    // Mount a new instance of the ToastManager immediately when the class is
    // instantiated.
    const container = document.createElement('div');
    body.appendChild(container);
    ReactDOM.render(<ToastManager ref={this._toastManagerRef} />, container);
  }

  _getManager(): ToastManager {
    const { current } = this._toastManagerRef;
    invariant(current, 'ToastManager reference should always exist');
    return current;
  }

  @autobind
  notify(title: string, settings: ToastSettings = {}) {
    this._getManager().notify(title, settings);
  }

  @autobind
  success(title: string, settings: ToastSettings = {}) {
    this.notify(title, { ...settings, intent: 'success' });
  }

  @autobind
  warning(title: string, settings: ToastSettings = {}) {
    this.notify(title, { ...settings, intent: 'warning' });
  }

  @autobind
  error(title: string, settings: ToastSettings = {}) {
    this.notify(title, { ...settings, intent: 'error' });
  }

  @autobind
  closeAll() {
    this._getManager().closeAll();
  }

  @autobind
  getToasts() {
    this._getManager().getToasts();
  }

  @autobind
  removeToast(id: string) {
    this._getManager().removeToast(id);
  }
}

export default (new Toaster(): Toaster);
