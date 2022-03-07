// @flow
import * as React from 'react';

const Layer = React.lazy(() =>
  import(
    /* webpackChunkName: "asyncMapChunk" */
    'react-map-gl/dist/es6/components/layer'
  ),
);

export type Props = {
  type:
    | 'background'
    | 'circle'
    | 'fill'
    | 'fillExtrusion'
    | 'heatmap'
    | 'hillshade'
    | 'line'
    | 'raster'
    | 'symbol',

  beforeId?: string,
  filter?: $ReadOnlyArray<mixed>,
  id?: string,
  layout?: mixed,
  maxzoom?: number,
  minzoom?: number,
  paint?: mixed,
  source?: string,
  'source-layer'?: string,
};

// NOTE(stephen): A `Layer` must be nested inside a `Source`. Our `Source`
// component handles the `React.Suspense` call so we do not need to do that
// here.
export default (Layer: React.AbstractComponent<Props>);
