// @flow
import * as Zen from 'lib/Zen';
import type { Deserializable } from 'lib/Zen';

export type LocationInfo = {
  sourceData: $ReadOnlyMap<string, string>,
  canonicalData: $ReadOnlyMap<string, string>,
  successfulMatch: boolean,
};

type RequiredValues = {
  filepath: string,
  datasourceName: string,

  /**
   * An array of the dimensions we track for each location. For example,
   * RegionName, DistrictName, etc.
   * */
  dimensions: $ReadOnlyArray<string>,
  locations: $ReadOnlyArray<LocationInfo>,
};

type SerializedLocationsDigestData = Array<Array<string>>;

type DeserializationConfig = {
  filepath: string,
  datasourceName: string,
  treatAllLocationsAsMapped: boolean,
};

// the prefix we use for locations as they show up in zenysis
const CANONICAL_LOCATION_PREFIX =
  window.__JSON_FROM_BACKEND.dataDigestAppOptions.canonicalPrefix;

// the prefix we use for locations as they show up in source data
const CLEANED_LOCATION_PREFIX =
  window.__JSON_FROM_BACKEND.dataDigestAppOptions.cleanedPrefix;
/**
 * Convert a map of a location's source data and canonical data into a single
 * concatenated string. This is only useful for when you need a unique
 * identifier, for example to use as a React node key.
 */
export function locationDataToIdentifier(
  sourceData: $ReadOnlyMap<string, string>,
  canonicalData: $ReadOnlyMap<string, string>,
): string {
  const values = [];
  sourceData.forEach(v => values.push(v));
  canonicalData.forEach(v => values.push(v));
  return values.join('_');
}

/**
 * This holds the unmatched locations for a datasource. This model is
 * deserialized from a CSV we pull from s3.
 */
class LocationsDigestData
  extends Zen.BaseModel<LocationsDigestData, RequiredValues>
  implements
    Deserializable<SerializedLocationsDigestData, DeserializationConfig> {
  static deserialize(
    values: SerializedLocationsDigestData,
    extraConfig: DeserializationConfig,
  ): Zen.Model<LocationsDigestData> {
    const { filepath, datasourceName, treatAllLocationsAsMapped } = extraConfig;
    const [headerRow, ...dataRows] = values;

    const locationObjects = [];

    const dimensions = headerRow
      // NOTE(camden): Because Zambia's cleaned location prefix is an
      // empty string, we must check both that it starts with clean location
      // and not with canonical location.
      .filter(
        header =>
          !header.startsWith(CANONICAL_LOCATION_PREFIX) &&
          header.startsWith(CLEANED_LOCATION_PREFIX),
      )
      .map(header => header.substring(CLEANED_LOCATION_PREFIX.length));

    dataRows.forEach(row => {
      // ignore any rows that have less columns than the header row
      if (row.length >= headerRow.length) {
        const locationInfo = {
          sourceData: new Map<string, string>(),
          canonicalData: new Map<string, string>(),
          successfulMatch: treatAllLocationsAsMapped,
        };

        row.forEach((valStr, i) => {
          const colName = headerRow[i];
          if (colName.startsWith(CANONICAL_LOCATION_PREFIX)) {
            locationInfo.canonicalData.set(
              colName.substring(CANONICAL_LOCATION_PREFIX.length),
              valStr,
            );
          } else if (colName.startsWith(CLEANED_LOCATION_PREFIX)) {
            locationInfo.sourceData.set(
              colName.substring(CLEANED_LOCATION_PREFIX.length),
              valStr,
            );
          } else {
            throw new Error(`Invalid column found: ${colName}`);
          }
        });
        locationObjects.push(locationInfo);
      }
    });

    return LocationsDigestData.create({
      filepath,
      dimensions,
      datasourceName,
      locations: locationObjects,
    });
  }
}

export default ((LocationsDigestData: $Cast): Class<
  Zen.Model<LocationsDigestData>,
>);
