// @flow
import autobind from 'decorators/autobind';
import {
  executeSubscriptionCallbacks,
  subscribe,
  unsubscribe,
} from 'services/ui/eventServiceUtil';
import { getScrollTop, getScrollLeft } from 'util/domUtil';
import type {
  EventSubscriptionService,
  Subscription,
  SubscriptionId,
} from 'services/ui/types';

export type ScrollData = {
  scrollX: number,
  scrollY: number,
};

const SUBSCRIPTION_ID_PREFIX = 'scrollSubscription';

class ScrollService implements EventSubscriptionService<ScrollData> {
  _subscriptions: Array<Subscription<ScrollData>> = [];
  _lastKnownScrollPosition: ScrollData = { scrollX: 0, scrollY: 0 };
  _requestedAnimationFrame: boolean = false;

  constructor() {
    window.addEventListener('scroll', this._scrollCallback);
  }

  /**
   * The scroll callback is throttled by using `window.requestAnimationFrame`
   * This keeps things performant by only executing the callbacks when the
   * browser requests a new page paint.
   */
  @autobind
  _scrollCallback(event: Event): void {
    this._lastKnownScrollPosition = {
      scrollX: getScrollLeft(),
      scrollY: getScrollTop(),
    };

    if (!this._requestedAnimationFrame) {
      window.requestAnimationFrame(() => {
        executeSubscriptionCallbacks(
          this._subscriptions,
          event,
          this._lastKnownScrollPosition,
        );
        this._requestedAnimationFrame = false;
      });
      this._requestedAnimationFrame = true;
    }
  }

  /**
   * Subscribe a callback to the service
   * @param {(Event, ScrollData) => void} callback
   * @return {SubscriptionId}
   */
  subscribe(
    callback: (event: Event, scrollPosition: ScrollData) => void,
  ): SubscriptionId {
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

export default (new ScrollService(): ScrollService);
