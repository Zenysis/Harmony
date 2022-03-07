// @flow
import * as Zen from 'lib/Zen';
import DataQuality from 'models/DataQualityApp/DataQuality';
import type { Serializable } from 'lib/Zen';

type Values = {
  byLocation: Zen.Map<DataQuality>,
  overall: DataQuality,
};

type SerializedDataQualityMap = {
  dataQuality: {
    overall: Zen.Serialized<DataQuality>,
    [dimensionValueName: string]: Zen.Serialized<DataQuality>,
    ...
  },
};

/**
 * A map to DataQuality objects by dimensionValueName. This will include an
 * 'Overall' key for the indicator over the entire filter as well as
 * dimensionValues for any grouped by dimension.
 */
class DataQualityMap extends Zen.BaseModel<DataQualityMap, Values>
  implements Serializable<SerializedDataQualityMap> {
  static deserialize(
    serializedDataQualityMap: SerializedDataQualityMap,
  ): Zen.Model<DataQualityMap> {
    const { overall, ...byLocation } = serializedDataQualityMap.dataQuality;

    // NOTE(david): This is needed as for some reason flow infers byLocation as
    // { ... } and subsequently shows an error when calling deserializeToZenMap.
    const byLocationCast = ((byLocation: $Cast): {
      [dimensionValueName: string]: Zen.Serialized<DataQuality>,
      ...,
    });

    return DataQualityMap.create({
      overall: DataQuality.deserialize(overall),
      byLocation: Zen.deserializeToZenMap(DataQuality, byLocationCast),
    });
  }

  serialize(): SerializedDataQualityMap {
    return {
      dataQuality: {
        ...Zen.serializeMap(this._.byLocation()),
        overall: this._.overall().serialize(),
      },
    };
  }
}

export default ((DataQualityMap: $Cast): Class<Zen.Model<DataQualityMap>>);
