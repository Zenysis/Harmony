// @flow
import numeral from 'numeral';

import * as Zen from 'lib/Zen';
import { Y1_AXIS } from 'components/visualizations/common/SettingsModal/AxesSettingsTab/constants';
import { formatFieldValueForDisplay } from 'util/valueDisplayUtil';
import { indexToSeriesColor } from 'components/QueryResult/graphUtil';
import type { Serializable } from 'lib/Zen';

const NOT_A_NUMBER_TEXT = t('visualizations.common.notANumber');
export const NO_DATA_DISPLAY_VALUE: string = t('visualizations.common.noData');
export const ZERO_DISPLAY_VALUE = '0';

type Values = {
  id: string,
  label: string,
};

export type ValuePosition = 'top' | 'center' | 'bottom';
export type VisualDisplayShape = 'bar' | 'line' | 'dotted';

type DefaultValues = {
  barLabelPosition: ValuePosition,
  color: string,
  dataLabelFontSize: string,
  dataLabelFormat: string,
  isVisible: boolean,

  /**
   * The value to display when a `null` is encountered during formatting.
   */
  nullValueDisplay: string,
  showSeriesValue: boolean,
  visualDisplayShape: VisualDisplayShape,

  // TODO(pablo): change to 'y1Axis' | 'y2Axis', imported from AxesSettingsTab
  yAxis: string,
};

type SerializedQueryResultSeries = {
  barLabelPosition?: ValuePosition,
  color?: string,
  dataLabelFontSize?: string,
  dataLabelFormat?: string,
  id: string,
  isVisible?: boolean,
  label: string,
  nullValueDisplay?: string,
  showSeriesValue?: boolean,
  visualDisplayShape: VisualDisplayShape,
  yAxis?: string,
};

type DeserializationConfig = {
  seriesIndex: number,
};

/**
 * QueryResultSeries is the metadata behind how a Field should be represented
 * in a visualization.
 * When we think of Bar Graphs, LineGraphs, Scatter Plots, etc. we think
 * in terms of data series. A Field is a representation of a queryable item,
 * whereas a QueryResultSeries is a representation of how it will be rendered
 * in a visualization.
 * The `id` of the QueryResultSeries should match the `id` of the Field it is
 * representing.
 */
class QueryResultSeries
  extends Zen.BaseModel<QueryResultSeries, Values, DefaultValues>
  implements Serializable<SerializedQueryResultSeries> {
  static defaultValues: DefaultValues = {
    barLabelPosition: 'top',
    color: indexToSeriesColor(0),
    dataLabelFontSize: '12px',
    dataLabelFormat: 'none',
    isVisible: true,
    nullValueDisplay: NO_DATA_DISPLAY_VALUE,
    showSeriesValue: false,
    visualDisplayShape: 'bar',
    yAxis: Y1_AXIS,
  };

  static deserialize(
    values: SerializedQueryResultSeries,
    extraConfig?: DeserializationConfig = { seriesIndex: 0 },
  ): Zen.Model<QueryResultSeries> {
    // in case a color isn't included from the backend (due to some older
    // dashboards that may not have this information), base it off of the
    // series index
    const newValues = {
      color: indexToSeriesColor(extraConfig.seriesIndex),
      ...values,
    };
    return QueryResultSeries.create(newValues);
  }

  formatFieldValue(value: number | string | void | null): string {
    if (value === undefined || value === null || value === '') {
      return this._.nullValueDisplay();
    }

    if (typeof value === 'number' && !Number.isFinite(value)) {
      return NOT_A_NUMBER_TEXT;
    }

    const dataLabelFormat = this._.dataLabelFormat();
    if (dataLabelFormat && dataLabelFormat !== 'none') {
      return numeral(value).format(dataLabelFormat);
    }

    return formatFieldValueForDisplay(value);
  }

  serialize(): SerializedQueryResultSeries {
    return {
      ...this.modelValues(),
    };
  }
}

export default ((QueryResultSeries: $Cast): Class<
  Zen.Model<QueryResultSeries>,
>);
