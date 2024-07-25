// @flow
import { SERIES_COLORS } from 'components/QueryResult/graphUtil';

export const DEFAULT_BUBBLE_COLOR: string = SERIES_COLORS[0];

export const LABEL_LAYER_ID = 'data-point-label-layer';

export const GEO_FIELD_ORDERING: Array<string> = (
  window.__JSON_FROM_BACKEND.geoFieldOrdering || []
).slice();
