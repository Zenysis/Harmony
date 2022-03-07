// @flow

import College from 'components/ui/Icon/internal/SVGs/MapVisualizationIcons/College';
import Grocery from 'components/ui/Icon/internal/SVGs/MapVisualizationIcons/Grocery';
import Hospital from 'components/ui/Icon/internal/SVGs/MapVisualizationIcons/Hospital';
import Information from 'components/ui/Icon/internal/SVGs/MapVisualizationIcons/Information';
import School from 'components/ui/Icon/internal/SVGs/MapVisualizationIcons/School';
import Star from 'components/ui/Icon/internal/SVGs/MapVisualizationIcons/Star';
import TownHall from 'components/ui/Icon/internal/SVGs/MapVisualizationIcons/TownHall';

export type MapVisualizationSVGMap = {
  'svg-map-college': typeof College,
  'svg-map-grocery': typeof Grocery,
  'svg-map-hospital': typeof Hospital,
  'svg-map-school': typeof School,
  'svg-map-town-hall': typeof TownHall,
  'svg-map-information': typeof Information,
  'svg-map-star': typeof Star,
};

export const MAP_VISUALIZATION_SVG_MAP: MapVisualizationSVGMap = {
  'svg-map-college': College,
  'svg-map-grocery': Grocery,
  'svg-map-hospital': Hospital,
  'svg-map-school': School,
  'svg-map-town-hall': TownHall,
  'svg-map-information': Information,
  'svg-map-star': Star,
};
