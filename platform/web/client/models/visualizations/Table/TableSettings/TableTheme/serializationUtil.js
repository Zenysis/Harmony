//  @flow
import * as Zen from 'lib/Zen';
import type {
  PerColumnTheme,
  SerializedPerColumnTheme,
  Theme,
} from 'models/visualizations/Table/TableSettings/TableTheme/types';

export function serializePerColumnTheme<ThemeModel: Theme>(
  perColumnTheme: PerColumnTheme<ThemeModel>,
): SerializedPerColumnTheme<ThemeModel> {
  if (perColumnTheme.isPerColumn) {
    return {
      isPerColumn: true,
      value: Zen.serializeMap(perColumnTheme.map),
    };
  }

  return {
    isPerColumn: false,

    // this is totally safe, just using a cast so Flow doesn't complain
    value: {
      ALL_COLUMNS: ((perColumnTheme.value.serialize(): $Cast): Zen.Serialized<ThemeModel>),
    },
  };
}

export function deserializePerColumnTheme<ThemeModel: Theme>(
  ModelClass: Zen.DeserializableModel<ThemeModel>,
  serializedPerColumnTheme: SerializedPerColumnTheme<ThemeModel>,
): PerColumnTheme<ThemeModel> {
  if (serializedPerColumnTheme.isPerColumn) {
    return {
      isPerColumn: true,
      map: Zen.deserializeToZenMap(ModelClass, serializedPerColumnTheme.value),
    };
  }
  return {
    isPerColumn: false,
    value: ModelClass.deserialize(serializedPerColumnTheme.value.ALL_COLUMNS),
  };
}
