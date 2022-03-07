// @flow
import autobind from 'decorators/autobind';
import {
  executeSubscriptionCallbacks,
  subscribe,
  unsubscribe,
} from 'services/ui/eventServiceUtil';
import type {
  EventSubscriptionService,
  Subscription,
  SubscriptionId,
} from 'services/ui/types';

export const TIMEOUT_EVENT = 'sessionTimeout';

const SUBSCRIPTION_ID_PREFIX = 'sessionTimeoutSubscription';

/**
 * A service to allow components to subscribe to session timeouts and provide a
 * callback function to be called when that happens. For function components, it
 * is reccomended to use the useSessionTimeout hook in this directory
 */
class SessionTimeoutService implements EventSubscriptionService<void> {
  _subscriptions: Array<Subscription<void>> = [];

  constructor() {
    window.addEventListener('sessionTimeout', this._timeoutCallback);
  }

  @autobind
  _timeoutCallback(event: Event): void {
    executeSubscriptionCallbacks(this._subscriptions, event, undefined);
  }

  /**
   * Subscribe a callback to the service
   * @param {(Event) => void} callback
   * @return {SubscriptionId}
   */
  subscribe(callback: (event: Event) => void): SubscriptionId {
    return subscribe(callback, this._subscriptions, SUBSCRIPTION_ID_PREFIX);
  }

  /**
   * Unsubscribe a callback from the service. We use a subscription object
   * (returned by the subscribe function) to identify the callback to
   * unsubscribe
   * @param {SubscriptionId} subscriptionToRemove
   */
  unsubscribe(subscriptionToRemove: ?SubscriptionId): void {
    return unsubscribe(subscriptionToRemove, this._subscriptions);
  }
}

export default (new SessionTimeoutService(): SessionTimeoutService);
