// @flow
import GISDots from 'components/ui/Icon/internal/SVGs/GISChartTypeIcons/GISDots';
import GISDotsDisabled from 'components/ui/Icon/internal/SVGs/GISChartTypeIcons/GISDotsDisabled';
import GISHeatMap from 'components/ui/Icon/internal/SVGs/GISChartTypeIcons/GISHeatMap';
import GISHeatMapDisabled from 'components/ui/Icon/internal/SVGs/GISChartTypeIcons/GISHeatMapDisabled';
import GISScaledDots from 'components/ui/Icon/internal/SVGs/GISChartTypeIcons/GISScaledDots';
import GISScaledDotsDisabled from 'components/ui/Icon/internal/SVGs/GISChartTypeIcons/GISScaledDotsDisabled';
import GISSymbols from 'components/ui/Icon/internal/SVGs/GISChartTypeIcons/GISSymbols';
import GISSymbolsDisabled from 'components/ui/Icon/internal/SVGs/GISChartTypeIcons/GISSymbolsDisabled';
import GISTiles from 'components/ui/Icon/internal/SVGs/GISChartTypeIcons/GISTiles';
import GISTilesDisabled from 'components/ui/Icon/internal/SVGs/GISChartTypeIcons/GISTilesDisabled';

export type GISChartTypeSVGMap = {
  'svg-gis-dots': typeof GISDots,
  'svg-gis-dots-disabled': typeof GISDotsDisabled,
  'svg-gis-heat-map': typeof GISHeatMap,
  'svg-gis-heat-map-disabled': typeof GISHeatMapDisabled,
  'svg-gis-scaled-dots': typeof GISScaledDots,
  'svg-gis-scaled-dots-disabled': typeof GISScaledDotsDisabled,
  'svg-gis-symbols': typeof GISSymbols,
  'svg-gis-symbols-disabled': typeof GISSymbolsDisabled,
  'svg-gis-tiles': typeof GISTiles,
  'svg-gis-tiles-disabled': typeof GISTilesDisabled,
};

export const GIS_CHART_TYPE_SVG_MAP: GISChartTypeSVGMap = {
  'svg-gis-dots': GISDots,
  'svg-gis-dots-disabled': GISDotsDisabled,
  'svg-gis-heat-map': GISHeatMap,
  'svg-gis-heat-map-disabled': GISHeatMapDisabled,
  'svg-gis-scaled-dots': GISScaledDots,
  'svg-gis-scaled-dots-disabled': GISScaledDotsDisabled,
  'svg-gis-symbols': GISSymbols,
  'svg-gis-symbols-disabled': GISSymbolsDisabled,
  'svg-gis-tiles': GISTiles,
  'svg-gis-tiles-disabled': GISTilesDisabled,
};
