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
  DEFAULT: 'default',
  PRIMARY: 'primary',
  SUCCESS: 'success',
  INFO: 'info',
  WARNING: 'warning',
  DANGER: 'danger',
  LINK: 'link',
};

export const INTENTS_VALUES: $ReadOnlyArray<Intent> = Object.keys(Intents).map(
  key => Intents[key],
);

export default Intents;
