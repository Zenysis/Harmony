// @flow
import * as Zen from 'lib/Zen';
import DataActionGroup from 'models/core/QueryResultSpec/DataActionGroup';
import DataActionRule from 'models/core/QueryResultSpec/DataActionRule';
import QueryResultSeries, {
  NO_DATA_DISPLAY_VALUE,
  ZERO_DISPLAY_VALUE,
} from 'models/core/QueryResultSpec/QueryResultSeries';
import {
  getAvailableSeriesColor,
  indexToSeriesColor,
} from 'components/QueryResult/graphUtil';
import type Field from 'models/core/wip/Field';
import type { Serializable } from 'lib/Zen';

const Y1_AXIS = 'y1Axis';
const Y2_AXIS = 'y2Axis';

type SerializedSeriesSettings = {
  seriesObjects?: {
    [seriesId: string]: Zen.Serialized<QueryResultSeries>,
    ...,
  },
  seriesOrder?: Array<string>,
  dataActionRules: $ReadOnlyArray<Zen.Serialized<DataActionRule>>,
};

type Values = {
  seriesObjects: { +[string]: QueryResultSeries, ... },
  seriesOrder: $ReadOnlyArray<string>,
  dataActionRules: Zen.Array<DataActionRule>,
};

type SeriesByAxes = {
  xAxisSeries: $ReadOnlyArray<QueryResultSeries>,
  y1AxisSeries: $ReadOnlyArray<QueryResultSeries>,
  y2AxisSeries: $ReadOnlyArray<QueryResultSeries>,
};

class SeriesSettings extends Zen.BaseModel<SeriesSettings, Values>
  implements Serializable<SerializedSeriesSettings> {
  static fromFields(fields: $ReadOnlyArray<Field>): Zen.Model<SeriesSettings> {
    const seriesOrder = fields.map(field => field.get('id'));

    const series = fields.map((field, i) => {
      const nullValueDisplay = field.showNullAsZero()
        ? ZERO_DISPLAY_VALUE
        : NO_DATA_DISPLAY_VALUE;
      return QueryResultSeries.create({
        id: field.get('id'),
        label: field.label(),
        color: indexToSeriesColor(i),
        nullValueDisplay,
      });
    });
    const seriesObjects = Zen.ModelUtil.modelArrayToObject(series, 'id');

    return SeriesSettings.create({
      seriesObjects,
      seriesOrder,
      dataActionRules: Zen.Array.create(),
    });
  }

  static deserialize(
    values: SerializedSeriesSettings,
  ): Zen.Model<SeriesSettings> {
    const seriesObjects = values.seriesObjects || {};
    const seriesOrder = values.seriesOrder || [];
    const { dataActionRules } = values;
    const seriesModels = seriesOrder.map((id, i) =>
      QueryResultSeries.deserialize(seriesObjects[id], { seriesIndex: i }),
    );

    return SeriesSettings.create({
      seriesOrder,
      seriesObjects: Zen.ModelUtil.modelArrayToObject(seriesModels, 'id'),
      dataActionRules: Zen.deserializeToZenArray(
        DataActionRule,
        dataActionRules,
      ),
    });
  }

  getSeriesDataActionGroup(seriesId: string): DataActionGroup {
    const dataActions = this._.dataActionRules()
      .filter(rule => rule.series().has(seriesId))
      .flatMap(rule => rule.dataActions());

    return DataActionGroup.create({ dataActions });
  }

  getSeriesByAxes(): SeriesByAxes {
    const seriesObjects = this._.seriesObjects();
    const series = this._.seriesOrder().map(id => seriesObjects[id]);
    const getByYAxis = axisType => series.filter(s => s.yAxis() === axisType);
    return {
      xAxisSeries: series,
      y1AxisSeries: getByYAxis(Y1_AXIS),
      y2AxisSeries: getByYAxis(Y2_AXIS),
    };
  }

  updateSeries<K: Zen.SettableValueKeys<QueryResultSeries>>(
    seriesId: string,
    settingKey: K,
    settingValue: Zen.SettableValueType<QueryResultSeries, K>,
  ): Zen.Model<SeriesSettings> {
    // $FlowIssue[incompatible-call] - this is fine
    const seriesObjects = this._.seriesObjects();
    const series = seriesObjects[seriesId];

    // TODO(stephen): Potentially log when this happens. Users should not be
    // updating series that do not exist.
    if (series === undefined) {
      return this._;
    }
    return this._.seriesObjects({
      ...seriesObjects,
      [seriesId]: series.set(settingKey, settingValue),
    });
  }

  addNewSeries(
    seriesId: string,
    label: string,
    showNullAsZero: boolean,
  ): Zen.Model<SeriesSettings> {
    const seriesOrder = this._.seriesOrder();
    const seriesObjects = this._.seriesObjects();

    if (seriesOrder.includes(seriesId)) {
      throw new Error(
        `Attempting to add series that already exists! Series ID: ${seriesId}`,
      );
    }

    const takenColors = new Set(
      Object.keys(seriesObjects).map((id: string) => seriesObjects[id].color()),
    );

    const newColor =
      getAvailableSeriesColor(takenColors) ||
      indexToSeriesColor(seriesOrder.length);

    return this.modelValues({
      seriesOrder: [...seriesOrder, seriesId],
      seriesObjects: {
        ...this._.seriesObjects(),
        [seriesId]: QueryResultSeries.create({
          label,
          id: seriesId,
          color: newColor,
          nullValueDisplay: showNullAsZero
            ? ZERO_DISPLAY_VALUE
            : NO_DATA_DISPLAY_VALUE,
        }),
      },
    });
  }

  removeSeries(seriesId: string): Zen.Model<SeriesSettings> {
    const newSeriesOrder = this._.seriesOrder().filter(id => id !== seriesId);

    const currSeriesObjects = this._.seriesObjects();
    const newSeriesObjects = {};
    newSeriesOrder.forEach(id => {
      newSeriesObjects[id] = currSeriesObjects[id];
    });
    return this.modelValues({
      seriesOrder: newSeriesOrder,
      seriesObjects: newSeriesObjects,
    });
  }

  getSeriesObject(fieldId: string): QueryResultSeries | void {
    return this._.seriesObjects()[fieldId];
  }

  visibleSeriesOrder(): $ReadOnlyArray<string> {
    const seriesObjects = this._.seriesObjects();
    return this._.seriesOrder().filter(
      fieldId =>
        seriesObjects[fieldId] !== undefined &&
        seriesObjects[fieldId].isVisible(),
    );
  }

  serialize(): SerializedSeriesSettings {
    return {
      seriesObjects: Zen.serializeMap(this._.seriesObjects()),
      seriesOrder: this._.seriesOrder().slice(),
      dataActionRules: Zen.serializeArray(this._.dataActionRules()),
    };
  }
}

export default ((SeriesSettings: $Cast): Class<Zen.Model<SeriesSettings>>);
