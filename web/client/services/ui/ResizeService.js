// @flow
import autobind from 'decorators/autobind';
import {
  executeSubscriptionCallbacks,
  subscribe,
  unsubscribe,
} from 'services/ui/eventServiceUtil';
import type { Dimensions } from 'types/common';
import type {
  EventSubscriptionService,
  Subscription,
  SubscriptionId,
} from 'services/ui/types';

const SUBSCRIPTION_ID_PREFIX = 'resizeSubscription';

class ResizeService implements EventSubscriptionService<Dimensions> {
  _subscriptions: Array<Subscription<Dimensions>> = [];

  constructor() {
    window.addEventListener('resize', this._resizeCallback);
  }

  @autobind
  _resizeCallback(event: Event): void {
    const windowDimensions = {
      width: window.innerWidth,
      height: window.innerHeight,
    };
    executeSubscriptionCallbacks(this._subscriptions, event, windowDimensions);
  }

  /**
   * Subscribe a callback to the service
   * @param {(Event, Dimensions) => void} callback
   * @return {SubscriptionId}
   */
  subscribe(
    callback: (event: Event, windowDimensions: Dimensions) => void,
  ): SubscriptionId {
    return subscribe(callback, this._subscriptions, SUBSCRIPTION_ID_PREFIX);
  }

  /**
   * Unsubscribe a callback from the service. We use a subscription object
   * (returned by the subscribe function) to identify the callback to
   * unsubscribe.
   *
   * @param {?SubscriptionId} subscriptionToRemove The subscription to remove.
   * If this value is null or undefined then this function is a noop.
   */
  unsubscribe(subscriptionToRemove: ?SubscriptionId): void {
    return unsubscribe(subscriptionToRemove, this._subscriptions);
  }
}

export default (new ResizeService(): ResizeService);
