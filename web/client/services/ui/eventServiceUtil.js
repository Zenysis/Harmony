// @flow
import { uniqueId } from 'util/util';
import type {
  SubscriptionCallback,
  SubscriptionId,
  Subscription,
} from 'services/ui/types';

function _createSubscriptionId(idPrefix: string): SubscriptionId {
  return {
    id: `${idPrefix}_${uniqueId()}`,
  };
}

/**
 * Subscribe a `callback` to the passed `service`.
 * Side effect: this mutates the `currentSubscriptions` array
 * @param {SubscriptionCallback<Payload>} callback
 * @param {Array<Subscription<Payload>>} currentSubscriptions
 * @param {string} subscriptionIdPrefix
 * @return {SubscriptionId} The identifier for this subscription
 */
export function subscribe<Payload>(
  callback: SubscriptionCallback<Payload>,
  currentSubscriptions: Array<Subscription<Payload>>,
  subscriptionIdPrefix: string,
): SubscriptionId {
  const subscriptionObj = _createSubscriptionId(subscriptionIdPrefix);
  currentSubscriptions.push({
    subscriptionObj,
    callback,
  });
  return subscriptionObj;
}

/**
 * Unsubscribe a callback from the service. We use a subscription object
 * (returned by the subscribe function) to identify the callback to
 * unsubscribe
 * Side effect: this mutates the `currentSubscriptions` array
 * @param {?SubscriptionId} subscriptionToRemove The subscription to remove.
 * If this value is null or undefined then this function is a noop.
 * @param {Array<Subscription<Payload>>} currentSubscriptions
 */
export function unsubscribe<Payload>(
  subscriptionToRemove: ?SubscriptionId,
  currentSubscriptions: Array<Subscription<Payload>>,
): void {
  if (subscriptionToRemove === undefined || subscriptionToRemove === null) {
    return;
  }

  const idx = currentSubscriptions.findIndex(
    ({ subscriptionObj }) => subscriptionObj === subscriptionToRemove,
  );

  if (idx === -1) {
    console.error(
      `Attempting to remove invalid subscription: ${subscriptionToRemove.id}`,
    );
  }

  currentSubscriptions.splice(idx, 1);
}

/**
 * Iterate through the array of subscriptions and execute the callback for
 * each one.
 * @param {Array<Subscription<Payload>>} subscriptions
 * @param {Event} event The event object
 * @param {Payload} payload Additional data to pass to the subscription callback
 */
export function executeSubscriptionCallbacks<Payload>(
  subscriptions: Array<Subscription<Payload>>,
  event: Event,
  payload: Payload,
): void {
  subscriptions.forEach(({ callback }) => {
    callback(event, payload);
  });
}
