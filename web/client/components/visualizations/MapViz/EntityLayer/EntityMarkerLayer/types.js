// @flow

// TODO(stephen, nina): See if we can remove this and just use the exported
// `LayerStyle` from `components/ui/visualizations/MapCore/types';`
/** A quick and easy way to store multiple pieces of information about each
 * layer, respecting that certain properties may change due to enabled
 * clustering or other style specifications.
 *
 * Properties that are required for the react-map-gl Layer component, like id,
 * are defined outside of the style property. The style property is
 * deliberately ambiguous to allow for different definitions, depending on
 * the layer. However, the Layer component does not remove props like
 * 'filter={undefined}', and will throw an error if it receives this. So
 * we need to think about treatment for optional props that may sometimes
 * be undefined. */
export type EntityMarkerLayerStyle = {
  beforeId: string | void,
  id: string,
  type: 'circle' | 'symbol',
  // Stores values all non required properties
  style?: mixed,
};
