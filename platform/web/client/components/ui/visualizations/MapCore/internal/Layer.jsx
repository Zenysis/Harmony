// @flow
import * as React from 'react';

const Layer = React.lazy(() =>
  import('react-map-gl/dist/es6/components/layer'),
);

export type Props = {
  'source-layer'?: string,
  beforeId?: string,
  filter?: $ReadOnlyArray<mixed>,
  id?: string,
  layout?: mixed,
  maxzoom?: number,
  minzoom?: number,
  paint?: mixed,
  source?: string,
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
};

// NOTE: A `Layer` must be nested inside a `Source`. Our `Source`
// component handles the `React.Suspense` call so we do not need to do that
// here.
export default (Layer: React.AbstractComponent<Props>);
