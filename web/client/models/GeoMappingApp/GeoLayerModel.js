// @flow
import * as Zen from 'lib/Zen';
import LayerStyleSettings from 'models/GeoMappingApp/LayerStyleSettings';

export interface GeoLayerModel<Self: Zen.AnyModel, Tag: string> {
  // TODO(nina): GeoLayerModel will comprise of a union of different ZenModels,
  // and we will be refining that union (narrowing down to a single type) from
  // time to time. This is a quick and dirty way of representing the now 2
  // different types of layers supported by the GIS tool. As we continue to
  // iterate, we will revise this.
  +tag: Tag;

  getId(): string;

  getLayerStyleSettings(): LayerStyleSettings;

  isLayerVisible(): boolean;

  updateLayerStyleSettings(newStyleSettings: LayerStyleSettings): Self;
}
