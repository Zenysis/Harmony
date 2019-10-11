// @flow
import numeral from 'numeral';

import * as Zen from 'lib/Zen';
import { Y1_AXIS } from 'components/visualizations/common/SettingsModal/AxesSettingsTab/constants';
import { formatFieldValueForDisplay } from 'indicator_fields';
import { indexToSeriesColor } from 'components/QueryResult/graphUtil';
import type { Serializable } from 'lib/Zen';

const NO_DATA_TEXT = t('visualizations.common.noData');

type Values = {
  id: string,
  label: string,
};

type DefaultValues = {
  color: string,
  dataLabelFormat: string,
  dataLabelFontSize: string,
  isVisible: boolean,
  showConstituents: boolean,
  showSeriesValue: boolean,

  // TODO(pablo): change to 'y1Axis' | 'y2Axis', imported from AxesSettingsTab
  yAxis: string,
};

type SerializedQueryResultSeries = {
  id: string,
  label: string,
  color?: string,
  dataLabelFormat?: string,
  dataLabelFontSize?: string,
  isVisible?: boolean,
  showConstituents?: boolean,
  showSeriesValue?: boolean,
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
  static defaultValues = {
    color: indexToSeriesColor(0),
    dataLabelFormat: 'none',
    dataLabelFontSize: '12px',
    isVisible: true,
    showConstituents: false,
    showSeriesValue: false,
    yAxis: Y1_AXIS,
  };

  static deserialize(
    values: SerializedQueryResultSeries,
    extraConfig?: DeserializationConfig = { seriesIndex: 0 },
  ): QueryResultSeries {
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
      return NO_DATA_TEXT;
    }

    // NOTE(toshi): Checking dataLabelFormat for BarGraph and BumpChart
    const dataLabelFormat = this._.dataLabelFormat();
    if (dataLabelFormat && dataLabelFormat !== 'none') {
      return numeral(value).format(dataLabelFormat);
    }

    return formatFieldValueForDisplay(value, this._.id());
  }

  serialize(): SerializedQueryResultSeries {
    return { ...this.modelValues() };
  }
}

export default ((QueryResultSeries: any): Class<Zen.Model<QueryResultSeries>>);
