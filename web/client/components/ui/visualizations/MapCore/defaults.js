// @flow
/* eslint-disable */

import I18N from 'lib/I18N';

// TODO: Fix the capitalization of these layer IDs all over the place
// (backend dashboard spec and frontend usage) since it shouldn't be like this.
export const MAP_LAYERS = {
  Blank: 'mapbox://styles/mapbox/empty-v9',
  Dark: 'mapbox://styles/mapbox/dark-v10',
  Light: 'mapbox://styles/mapbox/light-v10',
  Satellite: 'mapbox://styles/mapbox/satellite-v9',
  Streets: 'mapbox://styles/mapbox/streets-v11',
};

export const ADMIN_BOUNDARIES_WIDTHS: Object = {
  thin: I18N.text('Thin'),
  normal: I18N.textById('Normal'),
  thick: I18N.text('Thick'),
};

export const SHAPE_OUTLINE_WIDTHS: Object = {
  none: I18N.textById('None'),
  ...ADMIN_BOUNDARIES_WIDTHS,
};

export const MAP_LAYER_OPTIONS: Object = {
  Satellite: I18N.text('Satellite'),
  Streets: I18N.text('Streets'),
  Light: I18N.textById('Light'),
  Blank: I18N.text('Blank'),
};

export const OUTLINE_WIDTH_TO_PX = Object.freeze({
  none: 0,
  thin: 0.5,
  normal: 1,
  thick: 2,
});
