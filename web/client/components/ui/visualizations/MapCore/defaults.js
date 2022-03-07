// @flow

// TODO(stephen, nina): Fix the capitalization of these layer IDs all over the place
// (backend dashboard spec and frontend usage) since it shouldn't be like this.
export const MAP_LAYERS = {
  Blank: 'mapbox://styles/mapbox/empty-v9',
  Dark: 'mapbox://styles/mapbox/dark-v10',
  Light: 'mapbox://styles/mapbox/light-v10',
  Satellite: 'mapbox://styles/mapbox/satellite-v9',
  Streets: 'mapbox://styles/mapbox/streets-v11',
};

export const ADMIN_BOUNDARIES_WIDTHS: $ReadOnlyArray<string> = [
  'thin',
  'normal',
  'thick',
];

export const SHAPE_OUTLINE_WIDTHS: $ReadOnlyArray<string> = ['none'].concat(
  ADMIN_BOUNDARIES_WIDTHS,
);

export const OUTLINE_WIDTH_TO_PX = Object.freeze({
  none: 0,
  thin: 0.5,
  normal: 1,
  thick: 2,
});
