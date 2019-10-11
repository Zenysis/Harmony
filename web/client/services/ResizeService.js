// @flow
import autobind from 'decorators/autobind';
import { uniqueId } from 'util/util';
import type { Dimensions } from 'types/common';

export type SubscriptionObject = {
  id: string,
};

type ResizeHandler = (event: Event, windowDimensions: Dimensions) => void;

type Subscription = {
  subscriptionObj: SubscriptionObject,
  callback: ResizeHandler,
};

function createSubscriptionObject(): SubscriptionObject {
  return {
    id: `resize_subscription_${uniqueId()}`,
  };
}

class ResizeService {
  _$window: JQuery;
  _subscriptions: Array<Subscription> = [];

  constructor() {
    this._$window = $(window);
    window.addEventListener('resize', this._resizeCallback);
  }

  @autobind
  _resizeCallback(event: Event): void {
    const windowDimensions = {
      width: this._$window.width(),
      height: this._$window.height(),
    };

    this._subscriptions.forEach(({ callback }) => {
      callback(event, windowDimensions);
    });
  }

  /**
   * Subscribe a callback to the service
   * @param {ResizeHandler} callback
   * @return {SubscriptionObject}
   */
  subscribe(callback: ResizeHandler): SubscriptionObject {
    const subscriptionObj = createSubscriptionObject();
    this._subscriptions.push({
      subscriptionObj,
      callback,
    });
    return subscriptionObj;
  }

  /**
   * Unsubscribe a callback from the service. We use a subscription object
   * (returned by the subscribe function) to identify the callback to
   * unsubscribe
   * @param {SubscriptionObject} subscriptionToRemove
   */
  unsubscribe(subscriptionToRemove: ?SubscriptionObject): void {
    if (
      typeof subscriptionToRemove === 'undefined' ||
      subscriptionToRemove === null
    ) {
      return;
    }
    const idx = this._subscriptions.findIndex(
      ({ subscriptionObj }) => subscriptionObj === subscriptionToRemove,
    );

    if (idx === -1) {
      console.error(
        `[ResizeService] attempting to remove invalid subscription: ${
          subscriptionToRemove.id
        }`,
      );
    }

    this._subscriptions.splice(idx, 1);
  }
}

export default new ResizeService();
