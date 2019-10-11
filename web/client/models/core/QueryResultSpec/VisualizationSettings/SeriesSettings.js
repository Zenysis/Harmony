// @flow
import update from 'immutability-helper';

import * as Zen from 'lib/Zen';
import Field from 'models/core/Field';
import QueryResultSeries from 'models/core/QueryResultSpec/QueryResultSeries';
import { indexToSeriesColor } from 'components/QueryResult/graphUtil';
import type { Serializable } from 'lib/Zen';

const Y1_AXIS = 'y1Axis';
const Y2_AXIS = 'y2Axis';

type SerializedSeriesSettings = {
  seriesObjects?: { [seriesId: string]: Zen.Serialized<QueryResultSeries> },
  seriesOrder?: Array<string>,
};

type Values = {
  seriesObjects: { +[string]: QueryResultSeries },
  seriesOrder: $ReadOnlyArray<string>,
};

type SeriesByAxes = {
  xAxisSeries: $ReadOnlyArray<QueryResultSeries>,
  y1AxisSeries: $ReadOnlyArray<QueryResultSeries>,
  y2AxisSeries: $ReadOnlyArray<QueryResultSeries>,
};

class SeriesSettings extends Zen.BaseModel<SeriesSettings, Values>
  implements Serializable<SerializedSeriesSettings> {
  static fromFields(fields: $ReadOnlyArray<Field>): Zen.Model<SeriesSettings> {
    const seriesOrder = Field.pullIds(fields);

    const series = fields.map((field, i) =>
      QueryResultSeries.create({
        id: field.id(),
        label: field.label(),
        color: indexToSeriesColor(i),
      }),
    );
    const seriesObjects = Zen.ModelUtil.modelArrayToObject(series, 'id');

    return SeriesSettings.create({
      seriesObjects,
      seriesOrder,
    });
  }

  static deserialize(
    values: SerializedSeriesSettings,
  ): Zen.Model<SeriesSettings> {
    const seriesObjects = values.seriesObjects || {};
    const seriesOrder = values.seriesOrder || [];
    const seriesModels = seriesOrder.map((id, i) =>
      QueryResultSeries.deserialize(seriesObjects[id], { seriesIndex: i }),
    );

    return SeriesSettings.create({
      seriesOrder,
      seriesObjects: Zen.ModelUtil.modelArrayToObject(seriesModels, 'id'),
    });
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

  updateSeries(
    seriesId: string,
    settingKey: string,
    settingValue: any,
  ): Zen.Model<SeriesSettings> {
    const newSeriesObjects = update(this._.seriesObjects(), {
      [seriesId]: {
        $apply: series => series[settingKey](settingValue),
      },
    });
    return this._.seriesObjects(newSeriesObjects);
  }

  moveSeriesToNewIndex(
    seriesId: string,
    newIndex: number,
  ): Zen.Model<SeriesSettings> {
    const currOrder = this._.seriesOrder();
    const currIndex = currOrder.findIndex(id => id === seriesId);

    // we do 2 splices: one to delete the current element,
    // another to insert at the new index
    return this._.seriesOrder(
      update(currOrder, { $splice: [[currIndex, 1], [newIndex, 0, seriesId]] }),
    );
  }

  addNewSeries(seriesId: string, label: string): Zen.Model<SeriesSettings> {
    const newSeries = QueryResultSeries.create({
      label,
      id: seriesId,
      color: indexToSeriesColor(this._.seriesOrder().length),
    });

    const newSeriesOrder = this._.seriesOrder().concat(seriesId);
    const newSeriesObjects = update(this._.seriesObjects(), {
      [seriesId]: { $set: newSeries },
    });
    return this.modelValues({
      seriesOrder: newSeriesOrder,
      seriesObjects: newSeriesObjects,
    });
  }

  removeSeries(seriesId: string): Zen.Model<SeriesSettings> {
    const idx = this._.seriesOrder().findIndex(s => s === seriesId);
    const newSeriesOrder = update(this._.seriesOrder(), {
      $splice: [[idx, 1]],
    });
    const newSeriesObjects = update(this._.seriesObjects(), {
      $unset: [seriesId],
    });
    return this.modelValues({
      seriesOrder: newSeriesOrder,
      seriesObjects: newSeriesObjects,
    });
  }

  serialize(): SerializedSeriesSettings {
    return {
      seriesObjects: Zen.serializeMap(this._.seriesObjects()),
      seriesOrder: this._.seriesOrder().slice(),
    };
  }

  updateSeriesFromEdit(
    seriesId: string,
    label: string,
  ): Zen.Model<SeriesSettings> {
    const seriesObjects = this._.seriesObjects();
    const series = seriesObjects[seriesId].label(label);

    const finalSeriesObjects = {
      ...seriesObjects,
      [seriesId]: series,
    };

    return this._.seriesObjects(finalSeriesObjects);
  }
}

export default ((SeriesSettings: any): Class<Zen.Model<SeriesSettings>>);
