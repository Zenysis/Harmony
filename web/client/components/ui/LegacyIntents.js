// @flow
/**
 * @deprecated
 * This file is deprecated and should not be imported anymore.
 * Use `components/ui/Intents` instead.
 */

export type Intent =
  | 'default'
  | 'primary'
  | 'success'
  | 'info'
  | 'warning'
  | 'danger'
  | 'link';

const Intents = {
  DANGER: 'danger',
  DEFAULT: 'default',
  INFO: 'info',
  LINK: 'link',
  PRIMARY: 'primary',
  SUCCESS: 'success',
  WARNING: 'warning',
};

export const INTENTS_VALUES: $ReadOnlyArray<Intent> = Object.keys(Intents).map(
  key => Intents[key],
);

export default Intents;
