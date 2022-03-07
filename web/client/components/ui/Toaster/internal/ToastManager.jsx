// @flow
import * as React from 'react';

import Toast from 'components/ui/Toaster/internal/Toast';
import autobind from 'decorators/autobind';
import type { ToastSettings } from 'components/ui/Toaster/internal/types';

type ToastProps = {
  id: string,
  ...React.ElementConfig<typeof Toast>,
};

type State = {
  toasts: $ReadOnlyArray<ToastProps>,
};

export default class ToastManager extends React.PureComponent<{}, State> {
  static idCounter: number = 0;
  state: State = { toasts: [] };

  @autobind
  getToasts(): $ReadOnlyArray<ToastProps> {
    return this.state.toasts;
  }

  @autobind
  closeAll() {
    this.getToasts().forEach(toast => toast.onClose());
  }

  @autobind
  remove(publicToastId: string) {
    // A unique ID is appended after the toast's actual ID so we need to just
    // check the prefix.
    const toastIdPrefix = `${publicToastId}-#~#-`;
    this.state.toasts.forEach(({ id }) => {
      if (id.startsWith(toastIdPrefix)) {
        this.closeToast(id);
      }
    });
  }

  @autobind
  notify(title: string, settings: ToastSettings) {
    // If there's a custom toast ID passed, close existing toasts with the same
    // custom ID.
    if (settings.id !== undefined) {
      this.remove(settings.id);
    }

    this.setState(({ toasts }) => ({
      toasts: [this.createToastInstance(title, settings), ...toasts],
    }));
  }

  createToastInstance(
    title: string,
    { description, duration, hasCloseButton, id, intent }: ToastSettings,
  ): ToastProps {
    const uniqueToastId = ++ToastManager.idCounter;
    const toastId =
      id !== undefined ? `${id}-#~#-${uniqueToastId}` : `${uniqueToastId}`;

    return {
      hasCloseButton,
      description,
      title,
      duration: duration || 5,
      id: toastId,
      intent: intent || 'none',
      onClose: () => this.closeToast(toastId),
      open: true,
    };
  }

  /**
   * This will mark the toast as not "open" anymore. This will allow the Toast
   * component to animate out. Once the animation is complete, we can fully
   * remove the toast data from state.
   */
  closeToast(id: string) {
    this.setState(
      ({ toasts }) => ({
        toasts: toasts.map(toast => ({
          ...toast,
          open: toast.id === id ? false : toast.open,
        })),
      }),
      () => {
        // HACK(stephen): Allow the Toast removal animation to complete before
        // removing it from the DOM.
        setTimeout(() => this.removeToast(id), 240);
      },
    );
  }

  removeToast(id: string) {
    this.setState(({ toasts }) => ({
      toasts: toasts.filter(toast => toast.id !== id),
    }));
  }

  render(): React.Element<'div'> {
    return (
      <div className="ui-toast-manager">
        {this.state.toasts.map(({ id, ...props }) => (
          <Toast key={id} {...props} />
        ))}
      </div>
    );
  }
}
