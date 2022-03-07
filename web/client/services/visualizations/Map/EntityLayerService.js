// @flow

import APIService from 'services/APIService';
import type { HTTPService } from 'services/APIService';

/**
 * EntityLayerService is used to extract values necessary to render the
 * Entity Layer on a Map.
 */
class EntityLayerService {
  _httpService: HTTPService;
  constructor(httpService: HTTPService) {
    this._httpService = httpService;
  }

  /**
   * Returns the key used to display value in entity marker labels
   */
  getLabelKey(): string {
    return window.__JSON_FROM_BACKEND.geoDataLabelKey || '';
  }

  /**
   * Returns ordered list of entity types
   */
  getEntityTypeOrder(): $ReadOnlyArray<string> {
    return Object.keys(window.__JSON_FROM_BACKEND.geoDataDimensions || {});
  }

  /**
   * Returns source URL of entity data
   */
  getGeoDataUrl(): string {
    return window.__JSON_FROM_BACKEND.geoDataOverlay || '';
  }

  /**
   * Returns list of keys to be displayed when selecting any particular marker.
   */
  getTooltipLabels(): $ReadOnlyArray<string> {
    return window.__JSON_FROM_BACKEND.geoDataLabels || [];
  }
}

export default (new EntityLayerService(APIService): EntityLayerService);
