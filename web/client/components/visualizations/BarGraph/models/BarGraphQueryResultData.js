// @flow
import Promise from 'bluebird';
import moment from 'moment';

import * as Zen from 'lib/Zen';
import memoizeOne from 'decorators/memoizeOne';
import { RESULT_VIEW_TYPES } from 'components/QueryResult/viewTypes';
import {
  SORT_ASCENDING,
  SORT_ALPHABETICAL,
} from 'components/QueryResult/graphUtil';
import {
  addEmptyBars,
  buildBarSettings,
  filterQueryResultData,
} from 'components/visualizations/BarGraph/util';
import { defaultApplyTransformations } from 'models/core/QueryResultState/interfaces/QueryResultData';
import { sortAlphabetic, sortNumeric } from 'util/util';
import type CustomField from 'models/core/Field/CustomField';
import type DataFilter from 'models/core/QueryResultSpec/QueryResultFilter/DataFilter';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';
import type {
  DataPoint,
  BarSeries,
  BarValue,
} from 'components/visualizations/BarGraph/types';
import type { QueryResultData } from 'models/core/QueryResultState/interfaces/QueryResultData';
import type { Serializable } from 'lib/Zen';
import type { ViewSpecificSettings } from 'components/visualizations/common/commonTypes';

type DefaultValues = {|
  bars: $ReadOnlyArray<BarSeries>,
  data: $ReadOnlyArray<DataPoint>,
  totals: { [string]: number },
|};

// The serialized result is identical to the deserialized version.
type SerializedBarGraphQueryResult = $Shape<DefaultValues>;

function _createBarValues(
  data: $ReadOnlyArray<DataPoint>,
  fieldId: string,
  total: number,
): $ReadOnlyArray<BarValue> {
  // Format the values data in x,y pairs to be ingested by d3.
  // HACK(stephen): Track cumulative total of results. This is only useful for
  // standard SUM fields and is incorrect for all other value types. It is used
  // for the Tooltip.
  let cumulativeTotal = 0;
  return data.map((d, idx) => {
    const value = d[fieldId];

    // HACK(stephen): Exclude the ET nation as region hack from the cumulative
    // total.
    if (d.key !== 'Nation') {
      cumulativeTotal += value || 0;
    }

    return {
      cumulativePercent: cumulativeTotal / total,
      label: d.key,
      x: idx,
      y: value,
    };
  });
}

/**
 * BarGraphQueryResultData represents the data format used to render the
 * BarGraph data:
 *   array of objects
 *   Each object represents the bars on one key along the x-axis:
 *     {
 *       key: string (the label used in X-axis, e.g. the region name)
 *       [fieldId]: number (these are the values for the bars)
 *       backend_region_sort: int
 *     }
 *
 * fields:
 *   array of Fields that were queried
 *
 * totals:
 *   object mapping string -> number
 *   Each string is a field ID
 *   The value is the sum of all values of all bars for this field ID
 */

// TODO(pablo): add sub-models to this class to make the `data` easier to
// understand. The `data` array is very opaque and hard to follow right now :'(
class BarGraphQueryResultData
  extends Zen.BaseModel<BarGraphQueryResultData, {}, DefaultValues>
  implements
    QueryResultData<BarGraphQueryResultData>,
    Serializable<SerializedBarGraphQueryResult> {
  static defaultValues = {
    bars: [],
    data: [],
    totals: {},
  };

  static deserialize(
    values: SerializedBarGraphQueryResult,
  ): Zen.Model<BarGraphQueryResultData> {
    return BarGraphQueryResultData.create({ ...values });
  }

  /**
   * Generate a new `data` array by evaluating the custom field calculations
   * for each data object. Example:
   * @param {Array<CustomField>} customFields
   * @returns {Array<dataObj>} new array of data objects, where each object
   *   now has a new entry for each custom field's calculation
   *   Example:
   *     Old data array: [{ a: 10, b: 10, key: 'SomeRegion' }]
   *     Calculation: a + b
   *     New data array: [{ a: 10, b: 10, c: 20, key: 'SomeRegion' }]
   */
  _calculateNewData(
    customFields: $ReadOnlyArray<CustomField>,
  ): $ReadOnlyArray<DataPoint> {
    return this._.data().map(dataObj => {
      const newDataObj = { ...dataObj };
      customFields.forEach(field => {
        newDataObj[field.id()] = field.formula().evaluateFormula(newDataObj);
      });
      return newDataObj;
    });
  }

  /**
   * Generate a new `totals` object by evaluating each custom field calculation
   * and adding a new entry into the `totals` object for each custom field.
   * @param {Array<CustomField>} customFields
   * @returns {Object<fieldId, number>} new totals
   *   Old totals: { a: 100, b: 200 }
   *   Calculation: a + b
   *   New totals: { a: 100, b: 200, c: 300 }
   */
  _calculateNewTotals(
    customFields: $ReadOnlyArray<CustomField>,
  ): { [string]: number } {
    const oldTotals = this._.totals();
    const newTotals = { ...oldTotals };
    customFields.forEach(field => {
      newTotals[field.id()] = field.formula().evaluateFormula(newTotals);
    });
    return newTotals;
  }

  /**
   * Apply custom fields to the BarGraphQueryResultData
   * @param {Array<CustomField>} customFields
   * @returns {BarGraphQueryResultData} new model with updated `data` and
   * `totals` values that include the evaluated custom fields.
   */
  applyCustomFields(
    customFields: $ReadOnlyArray<CustomField>,
  ): Zen.Model<BarGraphQueryResultData> {
    return this.modelValues({
      data: this._calculateNewData(customFields),
      totals: this._calculateNewTotals(customFields),
    });
  }

  applyFilters(
    filterMap: Zen.Map<DataFilter>,
  ): Zen.Model<BarGraphQueryResultData> {
    return this._.data(filterQueryResultData(this._.data(), filterMap));
  }

  // NOTE(stephen): This is a mess. The reason it is a mess is because the
  // NVD3 data format makes it very hard to apply customizations and settings
  // across all bars. It is much easier to work with the data in its original
  // form, but that means we have to generate new bars every time for nvd3.
  applySettings(
    controls: ViewSpecificSettings<'CHART'>,
    seriesSettings: SeriesSettings,
  ): Zen.Model<BarGraphQueryResultData> {
    if (!this._.data().length) {
      return this._.bars([]);
    }
    const {
      disabledFields,
      sortOn,
      sortOrder,
      stackBars,
      y2LineGraph,
    } = controls;
    const seriesObjects = seriesSettings.seriesObjects();
    const sortAlpha =
      sortOrder === SORT_ALPHABETICAL || this.isDataBucketedByTime();

    const data = this._.data()
      .slice()
      .sort((a, b) => {
        if (sortAlpha) {
          return sortAlphabetic(a.key, b.key);
        }
        return sortNumeric(a[sortOn], b[sortOn], sortOrder !== SORT_ASCENDING);
      });

    let y1AxisUsed = false;
    let y2AxisUsed = false;
    const bars = seriesSettings.seriesOrder().map(fieldId => {
      const {
        disabled,
        showValues,
        strokeWidth,
        valueFontSize,
        y2Axis,
      } = buildBarSettings(seriesObjects[fieldId], !!disabledFields[fieldId]);

      /* eslint-disable no-bitwise */
      y1AxisUsed = y1AxisUsed || (!disabled && !y2Axis);
      y2AxisUsed = y2AxisUsed || (!disabled && y2Axis);
      /* eslint-enable no-bitwise */
      const total = this._.totals()[fieldId];
      return {
        key: fieldId,
        total,
        values: _createBarValues(data, fieldId, total),

        // The second y axis uses lines instead of a second set of bars.
        // If a field was chosen to be displayed on the second y axis, mark
        // the data item as "not a bar" and NVD3 will pick up on it.
        bar: !y2Axis,

        // Data sort order is needed by the tooltip.
        dataSortOrder: sortOrder,

        // Don't remove a field's data when it is disabled, just mark it
        // as disabled and NVD3 will pick up on it. This lets the animations be
        // smoother.
        disabled,

        // We have to set the stroke width for lines on each data item instead
        // of specifying it at the chart level for all lines.
        strokeWidth,

        // Designate whether the series should have its values displayed on
        // the chart and pass over any value display options.
        showValues,
        valueFontSize,
      };
    });

    // HACK(stephen): To properly space the bars when they are displayed on the
    // second y-axis, we need to add an "empty" series that will occupy space
    // on the chart but not render.
    // Ref: T2090
    if (
      // Check that the Y2Axis is not a line graph
      !y2LineGraph &&
      // Stacked bars don't work with the empty bar treatment
      !stackBars &&
      // Test that bars will be displayed on both Y1Axis and Y2Axis
      y1AxisUsed &&
      y2AxisUsed
    ) {
      return this._.bars(addEmptyBars(bars));
    }
    return this._.bars(bars);
  }

  applyTransformations(
    queryResultSpec: QueryResultSpec,
  ): Promise<Zen.Model<BarGraphQueryResultData>> {
    if (!this._.data().length) {
      return Promise.resolve(this);
    }

    return defaultApplyTransformations(this._, queryResultSpec).then(
      queryResult => {
        const settings = queryResultSpec.visualizationSettings()[
          RESULT_VIEW_TYPES.CHART
        ];
        return queryResult.applySettings(
          // TODO(stephen, pablo): Fix up type definition of
          // ViewSpecificSettings.
          (settings.viewSpecificSettings(): any),
          settings.seriesSettings(),
        );
      },
    );
  }

  barGroupCount(): number {
    const bars = this._.bars();
    if (bars.length === 0) {
      return 0;
    }
    return bars[0].values.length;
  }

  // HACK(pablo): if a bar graph's values are all bucketed by time then we
  // want to enable data label formatting. Remove this hack once you
  // find a good way to represent label formatting for visualizations.
  @memoizeOne
  isDataBucketedByTime(): boolean {
    // check if every data object in the query result is a valid time bucket
    return this._.data().every(dataObj =>
      moment(dataObj.key, 'YYYY-MM-DD', true).isValid(),
    );
  }

  isEmpty(): boolean {
    return this.barGroupCount() === 0;
  }

  serialize(): SerializedBarGraphQueryResult {
    return this.modelValues();
  }
}

export default ((BarGraphQueryResultData: any): Class<
  Zen.Model<BarGraphQueryResultData>,
>);
