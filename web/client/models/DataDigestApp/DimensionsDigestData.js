// @flow
import * as Zen from 'lib/Zen';
import type { Deserializable } from 'lib/Zen';

export type DimensionValueInfo = {
  canonicalValue: string,
  dimensionId: string,
  sourceValue: string,
  successfulMatch: boolean,
};

type RequiredValues = {
  datasourceName: string,
  dimensionValues: $ReadOnlyArray<DimensionValueInfo>,
  filepath: string,
};

type SerializedDimensionsDigestData = Array<Array<string>>;

type DeserializationConfig = {
  datasourceName: string,
  filepath: string,
  treatAllDimensionsAsMapped: boolean,
};

// the column name we use for dimensions as they show up in zenysis
const CANONICAL_COLUMN =
  window.__JSON_FROM_BACKEND.dataDigestAppOptions.canonicalPrefix;
// the column name we use for dimensions as they show up in source data
const CLEANED_COLUMN =
  window.__JSON_FROM_BACKEND.dataDigestAppOptions.cleanedPrefix;

/**
 * Convert a map of a dimension's source data and canonical data into a single
 * concatenated string. This is only useful for when you need a unique
 * identifier, for example to use as a React node key.
 */
export function dimensionInfoToIdentifier(
  dimensionValueInfo: DimensionValueInfo,
): string {
  const { canonicalValue, dimensionId, sourceValue } = dimensionValueInfo;
  return `${dimensionId}__${sourceValue}__${canonicalValue}`;
}

/**
 * This holds the non hierarchical dimension values for a datasource.
 * This model is deserialized from a CSV we pull from s3.
 */
class DimensionsDigestData
  extends Zen.BaseModel<DimensionsDigestData, RequiredValues>
  implements
    Deserializable<SerializedDimensionsDigestData, DeserializationConfig> {
  static deserialize(
    values: SerializedDimensionsDigestData,
    extraConfig: DeserializationConfig,
  ): Zen.Model<DimensionsDigestData> {
    const {
      datasourceName,
      filepath,
      treatAllDimensionsAsMapped,
    } = extraConfig;
    const [headerRow, ...dataRows] = values;
    const headerLookup = {
      canonical: headerRow.indexOf(CANONICAL_COLUMN),
      dimension: headerRow.indexOf('dimension'),
      source: headerRow.indexOf(CLEANED_COLUMN),
    };

    const dimensionValueObjects = [];

    dataRows.forEach(row => {
      // skip any empty rows and the empty value row
      if (row.length > 0 && row[headerLookup.source]) {
        const dimensionValueInfo = {
          canonicalValue: row[headerLookup.canonical],
          dimensionId: row[headerLookup.dimension],
          sourceValue: row[headerLookup.source],
          successfulMatch: treatAllDimensionsAsMapped,
        };

        dimensionValueObjects.push(dimensionValueInfo);
      }
    });

    return DimensionsDigestData.create({
      datasourceName,
      filepath,
      dimensionValues: dimensionValueObjects,
    });
  }
}

export default ((DimensionsDigestData: $Cast): Class<
  Zen.Model<DimensionsDigestData>,
>);
