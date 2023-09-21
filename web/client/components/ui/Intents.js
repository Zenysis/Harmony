// @flow

type IntentsMap = {
  DANGER: 'danger',
  PRIMARY: 'primary',
  SUCCESS: 'success',
};

const Intents: IntentsMap = {
  DANGER: 'danger',
  PRIMARY: 'primary',
  SUCCESS: 'success',
};

export type Intent = $Values<IntentsMap>;
export default Intents;
