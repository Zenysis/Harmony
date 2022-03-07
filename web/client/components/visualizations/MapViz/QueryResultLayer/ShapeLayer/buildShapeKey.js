// @flow
import { GEO_FIELD_ORDERING } from 'components/visualizations/MapViz/QueryResultLayer/defaults';

// Build a unique key that is only based on the shape's dimensions.
export default function buildShapeKey(dimensions: {
  +[dimension: string]: string | null | void,
  ...,
}): string {
  return GEO_FIELD_ORDERING.map(dimension => dimensions[dimension] || '')
    .join('__')
    .toLowerCase();
}
