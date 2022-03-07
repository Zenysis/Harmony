// @flow

// THESE COLORS SHOULD ALWAYS BE KEPT IN SYNC WITH _zen_variables.scss

// TODO(david): Come up with a better way of doing this either by working out
// how to import scss in js or autosyncing the two files.

const Colors = Object.freeze({
  // neutral colors
  GRAY_ACTIVE: '#abaeb4',
  GRAY: '#bfc2c9',
  GRAY_HOVER: '#c9ccd1',
  BLACK: '#000000',
  SLATE: '#313234',
  SLATE_HOVER: '#58585a',
  GRAY_LIGHT_ACTIVE: '#e9e9e9',
  GRAY_LIGHT: '#f9f9f9',
  GRAY_LIGHT_HOVER: '#f3f3f3',
  WHITE_ACTIVE: '#ececec',
  WHITE: '#ffffff',
  WHITE_HOVER: '#f9f9f9',

  // Brand Colors
  BLUE_PRIMARY_ACTIVE: '#2d80c2',
  BLUE_PRIMARY: '#3597E4',
  BLUE_PRIMARY_HOVER: '#53a6e8',
  BLUE_DARK_ACTIVE: '#266ca5',
  BLUE_DARK: '#2D80C2',
  BLUE_DARK_HOVER: '#4c92cb',
  BLUE_LIGHT: '#71B6Ec',
  BLUE_LIGHTEST: '#E8f0ff',

  // Validation Colors
  SUCCESS_ACTIVE: '#188d5c',
  SUCCESS: '#17A56c',
  SUCCESS_HOVER: '#4cb382',
  ERROR_ACTIVE: '#b7232f',
  ERROR: '#d62937',
  ERROR_HOVER: '#De4e57',
  WARNING_ACTIVE: '#cc9343',
  WARNING: '#f0ad4e',
  WARNING_HOVER: '#f3ba6b',
  INFO_ACTIVE: '#5baec8',
  INFO: '#6accea',
  INFO_HOVER: '#83d4ee',
});

export type Color = $Values<typeof Colors>;

export default Colors;
