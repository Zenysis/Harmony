// @flow

// This is the shape of the original `properties` object stored on each Entity
// feature in the geojson file. This structure is very loose, however we know
// that a Name property will be there (unfortunately it is capitalized).
export type SerializedEntityProperties = {
  Name: string,
  ...
};
