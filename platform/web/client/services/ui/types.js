// @flow

export type SubscriptionCallback<Payload> = (
  event: Event,
  payload: Payload,
) => void;

/**
 * An object used to identify a subscription to an EventSubscriptionService.
 */
export type SubscriptionId = {
  id: string,
};

/**
 * Pairs a subscription identifier with the event callback for an
 * EventSubscriptionService
 */
export type Subscription<Payload> = {
  callback: SubscriptionCallback<Payload>,
  subscriptionObj: SubscriptionId,
};

export interface EventSubscriptionService<Payload> {
  subscribe(callback: SubscriptionCallback<Payload>): SubscriptionId;
  unsubscribe(subscriptionToRemove: ?SubscriptionId): void;
}
