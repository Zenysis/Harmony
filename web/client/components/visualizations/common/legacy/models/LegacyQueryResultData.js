// @flow
import * as ss from 'simple-statistics';

import * as Zen from 'lib/Zen';
import { defaultApplyTransformations } from 'models/core/QueryResultState/interfaces/QueryResultData';
import { range } from 'util/util';
import type CustomField from 'models/core/Field/CustomField';
import type DataFilter from 'models/core/QueryResultSpec/QueryResultFilter/DataFilter';
import type Formula from 'models/core/Field/CustomField/Formula';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type { QueryResultData } from 'models/core/QueryResultState/interfaces/QueryResultData';
import type { Serializable } from 'lib/Zen';

// Date format '2017-07-08T00:00:00.000Z'
type RawDate = string;
type FieldID = string; // 'yValue_${fieldID}'
type Granularity = string; // 'all', 'month', 'year', etc.

type DataPoint = {
  [RawDate]: {
    [FieldID]: number,
    Real_Date: RawDate,
  },
};

export type SeriesObject = {
  geoKey: string,
  geoName: string,
  data: {
    [Granularity]: DataPoint,
  },
  dates: $ReadOnlyArray<string>,
  lat: number,
  lng: number,
  // Could hold a total value or a dated value based on horrible string
  // concatenation of the field name. `yValue_${fieldID}` or
  // `yValue_date_${fieldID}`
  [string]: any, // number | $ReadOnlyArray<number>,
};

type Metadata = {
  max: {},
  mean: {},
  median: {},
  min: {},
  first_quartile: {},
  num_nonzero: {},
  std: {},
  third_quartile: {},
  totals: {},
  variance: {},
};

function _calculateNewTotal(
  formula: Formula,
  seriesObj: SeriesObject,
): number | void {
  const env = {};
  formula.fields().forEach(field => {
    env[field.id()] = seriesObj[`yValue_${field.id()}`];
  });

  return formula.evaluateFormula(env);
}

function _calculateNewDateValues(
  formula: Formula,
  seriesObj: SeriesObject,
): $ReadOnlyArray<number | void> {
  const fields = formula.fields();
  const dateArrays = fields.mapValues(f => seriesObj[`yValue_date_${f.id()}`]);
  const indices = dateArrays[0] ? range(dateArrays[0].length) : [];

  const envs = indices.map(idx => {
    const env = {};
    fields.forEach(field => {
      const values = seriesObj[`yValue_date_${field.id()}`] || [];
      env[field.id()] = values[idx];
    });
    return env;
  });

  return envs.map(env => formula.evaluateFormula(env));
}

// Compute a mapping from geoKey to the series index that stores the data.
function _computeSeriesObjectMap(
  // eslint-disable-next-line no-use-before-define
  queryResultData: LegacyQueryResultData,
): { +[string]: number } {
  const output = {};
  queryResultData._.series().forEach(({ geoKey }, idx) => {
    output[geoKey] = idx;
  });
  return output;
}

// TODO(stephen): KILL THIS MODEL. IT IS SO BAD STOP USING IT.
// NOTE(stephen): I am not specifying all the types exactly because this model
// has been deprecated for over a year and needs to die.
type DefaultValues = {|
  errorMessage: string,
  hasError: boolean,
  metadata: Metadata,
  rawResponse: {},
  series: $ReadOnlyArray<SeriesObject>,
  unfilteredSeries: $ReadOnlyArray<SeriesObject>,
|};

type DerivedValues = {
  seriesObjectMap: { +[string]: number },
};

// The serialized result is identical to the deserialized version.
type SerializedLegacyQueryResult = DefaultValues;

class LegacyQueryResultData
  extends Zen.BaseModel<LegacyQueryResultData, {}, DefaultValues, DerivedValues>
  implements
    QueryResultData<LegacyQueryResultData>,
    Serializable<SerializedLegacyQueryResult> {
  static defaultValues = {
    errorMessage: '',
    hasError: false,
    metadata: {
      max: {},
      mean: {},
      median: {},
      min: {},
      first_quartile: {},
      num_nonzero: {},
      std: {},
      third_quartile: {},
      totals: {},
      variance: {},
    },
    rawResponse: {},
    series: [],
    unfilteredSeries: [],
  };

  static derivedConfig = {
    seriesObjectMap: [
      Zen.hasChanged<LegacyQueryResultData>('series'),
      _computeSeriesObjectMap,
    ],
  };

  static deserialize(
    values: SerializedLegacyQueryResult,
  ): Zen.Model<LegacyQueryResultData> {
    return LegacyQueryResultData.create({ ...values });
  }

  _calculateNewSeries(
    customFields: $ReadOnlyArray<CustomField>,
  ): $ReadOnlyArray<SeriesObject> {
    return this._.series().map(seriesObj => {
      const newSeriesObj = { ...seriesObj };
      customFields.forEach(field => {
        const { id, formula } = field.modelValues();
        newSeriesObj[`yValue_${id}`] = _calculateNewTotal(
          formula,
          newSeriesObj,
        );
        newSeriesObj[`yValue_date_${id}`] = _calculateNewDateValues(
          formula,
          newSeriesObj,
        );
      });

      return newSeriesObj;
    });
  }

  _calculateNewMetadata(
    customFields: $ReadOnlyArray<CustomField>,
    seriesData: $ReadOnlyArray<SeriesObject>,
  ): Metadata {
    const newMetadata = { ...this._.metadata() };
    customFields.forEach(field => {
      // collect all data for this field
      const id = field.id();
      const values = seriesData.map(seriesObj => seriesObj[`yValue_${id}`]);
      const numNonZero = values.filter(v => v > 0).length;

      if (values.length < 1) {
        return;
      }

      // calculate new statistical metadata
      newMetadata.max[id] = ss.max(values);
      newMetadata.mean[id] = ss.mean(values);
      newMetadata.median[id] = ss.median(values);
      newMetadata.min[id] = ss.min(values);
      newMetadata.first_quartile[id] = ss.quantile(values, 0.25);
      newMetadata.num_nonzero[id] = numNonZero;
      newMetadata.std[id] = ss.standardDeviation(values);
      newMetadata.third_quartile[id] = ss.quantile(values, 0.75);
      newMetadata.totals[id] = ss.sum(values);
      newMetadata.variance[id] = ss.variance(values);
    });

    return newMetadata;
  }

  applyCustomFields(
    customFields: $ReadOnlyArray<CustomField>,
  ): Zen.Model<LegacyQueryResultData> {
    const newSeries = this._calculateNewSeries(customFields);
    const newMetadata = this._calculateNewMetadata(customFields, newSeries);
    return this.modelValues({
      series: newSeries,
      metadata: newMetadata,
    });
  }

  // NOTE(stephen): Not implemented by the class. Users have to filter the data
  // themselves.
  applyFilters(
    // eslint-disable-next-line no-unused-vars
    filterMap: Zen.Map<DataFilter>,
  ): Zen.Model<LegacyQueryResultData> {
    return this._;
  }

  applyTransformations(
    queryResultSpec: QueryResultSpec,
  ): Promise<Zen.Model<LegacyQueryResultData>> {
    return defaultApplyTransformations(this._, queryResultSpec);
  }

  getSeriesObject(geoKey: string): SeriesObject {
    const idx = this._.seriesObjectMap()[geoKey];
    return this._.series()[idx];
  }

  serialize(): SerializedLegacyQueryResult {
    return this.modelValues();
  }
}

export default ((LegacyQueryResultData: any): Class<
  Zen.Model<LegacyQueryResultData>,
>);
