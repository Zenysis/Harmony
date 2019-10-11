// @flow

type IntentsMap = {
  PRIMARY: 'primary',
  DANGER: 'danger',
  SUCCESS: 'success',
};

const Intents: IntentsMap = {
  PRIMARY: 'primary',
  DANGER: 'danger',
  SUCCESS: 'success',
};

export type Intent = $Values<IntentsMap>;
export default Intents;
