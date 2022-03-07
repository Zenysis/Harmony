// @flow
import invariant from 'invariant';

import * as Zen from 'lib/Zen';
import { DEFAULT_SORT_ORDER } from 'components/QueryResult/graphUtil';
import type GroupBySettings from 'models/core/QueryResultSpec/GroupBySettings';
import type SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';
import type { IViewSpecificSettings } from 'models/visualizations/common/interfaces';
import type { Serializable } from 'lib/Zen';

// TODO(yitian): Remove showDataLabels, it has been moved to series settings.

export type BandBound =
  | { fieldId: string, type: 'field' }
  | {
      axis: 'y1Axis' | 'y2Axis',
      color: string | void,
      value: number,
      type: 'value',
    };

export type BandSetting = {
  areaColor: string | void,
  areaLabel: string,
  lower: BandBound | void,
  upper: BandBound | void,
};

type RequiredValues = {
  sortOn: string,
};

type DefaultValues = {
  bands: $ReadOnlyArray<BandSetting>,
  bucketMean: boolean,
  bucketType: string,
  logScaling: boolean,
  resultLimit: number,
  rotateLabels: boolean,
  showDataLabels: boolean,
  sortOrder: string,
  useEthiopianDates: boolean,
};

type SerializedLineGraphSettings = {|
  bands: $ReadOnlyArray<BandSetting>,
  bucketMean: boolean,
  bucketType: string,
  logScaling: boolean,
  resultLimit: number,
  rotateLabels: boolean,
  showDataLabels: boolean,
  sortOn: string,
  sortOrder: string,
  useEthiopianDates: boolean,
|};

const DEFAULT_GEO_LIMIT = 5;
const [DEFAULT_GRANULARITY, USE_ET_DATES] = (() => {
  // NOTE(stephen): Need to guard this property access since JSON_FROM_BACKEND
  // is not fully populated on all pages (like /login).
  // TODO(stephen): Figure out why the login page even loads viz code.
  const {
    timeseriesDefaultGranularity = '',
    timeseriesUseEtDates,
  } = window.__JSON_FROM_BACKEND;

  const defaultGranularity = timeseriesDefaultGranularity.toUpperCase();
  return [defaultGranularity, timeseriesUseEtDates];
})();

function isBandBoundFieldValid(
  bound: BandBound | void,
  seriesOrder: $ReadOnlyArray<string>,
): boolean {
  if (bound === undefined) {
    return true;
  }
  return (
    bound === undefined ||
    bound.type === 'value' ||
    seriesOrder.includes(bound.fieldId)
  );
}

class LineGraphSettings
  extends Zen.BaseModel<LineGraphSettings, RequiredValues, DefaultValues>
  implements
    Serializable<SerializedLineGraphSettings>,
    IViewSpecificSettings<LineGraphSettings> {
  static defaultValues: DefaultValues = {
    bands: [],
    bucketMean: false,
    bucketType: DEFAULT_GRANULARITY,
    logScaling: false,
    showDataLabels: false,
    rotateLabels: true,
    resultLimit: DEFAULT_GEO_LIMIT,
    sortOrder: DEFAULT_SORT_ORDER,
    useEthiopianDates: USE_ET_DATES,
  };

  static deserialize(
    values: SerializedLineGraphSettings,
  ): Zen.Model<LineGraphSettings> {
    return LineGraphSettings.create(values);
  }

  static fromFieldIds(
    fields: $ReadOnlyArray<string>,
  ): Zen.Model<LineGraphSettings> {
    invariant(fields.length > 0, 'LineGraphSettings requires at least 1 field');
    return LineGraphSettings.create({ sortOn: fields[0] });
  }

  serialize(): SerializedLineGraphSettings {
    return {
      bands: this._.bands(),
      bucketMean: this._.bucketMean(),
      bucketType: this._.bucketType(),
      logScaling: this._.logScaling(),
      resultLimit: this._.resultLimit(),
      rotateLabels: this._.rotateLabels(),
      showDataLabels: this._.showDataLabels(),
      sortOn: this._.sortOn(),
      sortOrder: this._.sortOrder(),
      useEthiopianDates: this._.useEthiopianDates(),
    };
  }

  updateFromNewGroupBySettings(
    // eslint-disable-next-line no-unused-vars
    newGroupBySettings: GroupBySettings,
  ): Zen.Model<LineGraphSettings> {
    return this._;
  }

  updateFromNewSeriesSettings(
    newSeriesSettings: SeriesSettings,
  ): Zen.Model<LineGraphSettings> {
    const seriesOrder = newSeriesSettings.seriesOrder();
    const defaultFieldId = seriesOrder[0];

    const bandsData = {
      bands: [],
      changed: false,
    };

    this._.bands().forEach(band => {
      const { lower, upper } = band;
      const lowerValid = isBandBoundFieldValid(lower, seriesOrder);
      const upperValid = isBandBoundFieldValid(upper, seriesOrder);
      // If the upper and lower bounds are valid, then we can preserve the band
      // as-is.
      if (lowerValid && upperValid) {
        bandsData.bands.push(band);
        return;
      }

      // If one is invalid, then we have to change the band data.
      bandsData.changed = true;

      // If the upper and lower bounds are *both* invalid, then we need to
      // remove this band setting. Also if there are no lower or upper settings
      // set then we can remove it as well.
      // NOTE(stephen): Removal just means not adding it to the new bands list.
      if (
        (!lowerValid && !upperValid) ||
        (lower === undefined && upper === undefined)
      ) {
        return;
      }

      bandsData.bands.push({
        ...band,
        lower: lowerValid ? lower : undefined,
        upper: upperValid ? upper : undefined,
      });
    });

    let output = this._;
    if (!seriesOrder.includes(this._.sortOn())) {
      output = output.sortOn(defaultFieldId);
    }
    if (bandsData.changed) {
      output = output.bands(bandsData.bands);
    }

    return output;
  }

  getTitleField(): void {
    return undefined;
  }

  changeToVisualizationType(): Zen.Model<LineGraphSettings> {
    return this._;
  }
}

export default ((LineGraphSettings: $Cast): Class<
  Zen.Model<LineGraphSettings>,
>);
