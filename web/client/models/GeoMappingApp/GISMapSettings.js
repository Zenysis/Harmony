// @flow
import * as Zen from 'lib/Zen';
import Colors from 'components/ui/Colors';
import type {
  LegendPositionType,
  ShapeLayerOutlineWidthType,
} from 'models/GeoMappingApp/types';
import type { Serializable } from 'lib/Zen';

const DEFAULT_ZOOM = window.__JSON_FROM_BACKEND.mapDefaultZoom || 5;
const DEFAULT_VIEW_LAT_LNG = window.__JSON_FROM_BACKEND.mapDefaultLatLng || [
  0,
  0,
];

type RequiredValues = {};

type DefaultValues = {
  /** Color of Admin Boundaries Layer */
  adminBoundariesColor: string,

  /** Thickness of Admin Boundaries Layer */
  adminBoundariesWidth: ShapeLayerOutlineWidthType,

  /** Name of layer to show on map background */
  baseLayer: string,

  /** The global legend position */
  globalLegendPosition: LegendPositionType,

  /** Boundary level with which to display the admin boundary layer */
  selectedGeoTiles: string,

  /** Flag to show/hide admin boundary layer */
  showAdminBoundaries: boolean,

  // TODO(nina): Eventually we want to replace zoom and lat/long with
  // a property that stores the bounding coordinates of a map instead. This
  // allows for consistency across different screen sizes
  viewport: { latitude: number, longitude: number, zoom: number },
};

type SerializedGISMapSettings = {
  adminBoundariesColor: string,
  adminBoundariesWidth: 'none' | 'thin' | 'normal' | 'thick',
  baseLayer: string,
  globalLegendPosition: LegendPositionType,
  selectedGeoTiles: string,
  showAdminBoundaries: boolean,
  viewport: { latitude: number, longitude: number, zoom: number },
};

/**
 * The GISMapSettings model stores settings used to power a map in the
 * GIS tool.
 */
class GISMapSettings
  extends Zen.BaseModel<GISMapSettings, RequiredValues, DefaultValues>
  implements Serializable<SerializedGISMapSettings> {
  static defaultValues: DefaultValues = {
    adminBoundariesColor: Colors.SLATE,
    adminBoundariesWidth: 'normal',
    baseLayer: 'Streets',
    globalLegendPosition: 'TOP_LEFT',
    selectedGeoTiles: '',
    showAdminBoundaries: false,
    viewport: {
      latitude: DEFAULT_VIEW_LAT_LNG[0],
      longitude: DEFAULT_VIEW_LAT_LNG[1],
      zoom: DEFAULT_ZOOM,
    },
  };

  static deserialize(
    values: SerializedGISMapSettings,
  ): Zen.Model<GISMapSettings> {
    return GISMapSettings.create(values);
  }

  serialize(): SerializedGISMapSettings {
    return {
      adminBoundariesColor: this._.adminBoundariesColor(),
      adminBoundariesWidth: this._.adminBoundariesWidth(),
      baseLayer: this._.baseLayer(),
      globalLegendPosition: this._.globalLegendPosition(),
      selectedGeoTiles: this._.selectedGeoTiles(),
      showAdminBoundaries: this._.showAdminBoundaries(),
      viewport: this._.viewport(),
    };
  }
}

export default ((GISMapSettings: $Cast): Class<Zen.Model<GISMapSettings>>);
