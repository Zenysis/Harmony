// @flow
import * as React from 'react';

import SimpleLegendItem from 'components/ui/visualizations/MapCore/SimpleLegend/SimpleLegendItem';
import { MapContext } from 'components/ui/visualizations/MapCore';
import type { StyleObject } from 'types/jsCore';

type Props = {
  children:
    | React.Element<typeof SimpleLegendItem>
    | $ReadOnlyArray<
        React.Element<
          React.AbstractComponent<React.ElementConfig<typeof SimpleLegendItem>>,
        >,
      >,

  className?: string,
  style?: StyleObject,
};

const DEFAULT_MAX_HEIGHT = 500;
const BASE_FONT_SIZE = 14;

/**
 * The SimpleLegend is a standard legend container that will render one or more
 * collections of rows, each with its own color and label.
 */
function SimpleLegend({ children, className = '', style = undefined }: Props) {
  const { viewport } = React.useContext(MapContext);

  // TODO(nina): We want to depend on the height, not the viewport itself, but
  // we are running into a weird bug where the viewport is sometimes null.
  // It has to do with the recent use of the EntityLayerLegend component in
  // the GeoMappingApp.
  const heightStyle = React.useMemo<{ maxHeight: string }>(() => {
    if (viewport !== null) {
      const { height } = viewport;
      const maxHeightPx = Math.min(height - 85, DEFAULT_MAX_HEIGHT);
      // HACK(nina): We want the maxHeight property to be in em units, which
      // is better for scaling between different window dimensions
      return { maxHeight: `${maxHeightPx / BASE_FONT_SIZE}em` };
    }
    return { maxHeight: `${DEFAULT_MAX_HEIGHT / BASE_FONT_SIZE}em` };
  }, [viewport]);

  return (
    <div
      className={`map-simple-legend ${className}`}
      style={{ ...heightStyle, ...style }}
    >
      {children}
    </div>
  );
}

export default (React.memo(SimpleLegend): React.AbstractComponent<Props>);
