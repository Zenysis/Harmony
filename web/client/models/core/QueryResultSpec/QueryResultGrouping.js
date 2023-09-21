// @flow
import * as Zen from 'lib/Zen';
import GroupingDimension from 'models/core/wip/GroupingItem/GroupingDimension';
import GroupingGranularity from 'models/core/wip/GroupingItem/GroupingGranularity';
import isGeographyDimension from 'models/core/wip/Dimension/isGeographyDimension';
import { TOTAL_DIMENSION_VALUE } from 'models/visualizations/common/constants';
import {
  formatDateByGranularity,
  formatDatesByGranularity,
} from 'util/dateUtil';
import { getFullDimensionName } from 'models/core/wip/Dimension';
import type { GroupingItem } from 'models/core/wip/GroupingItem/types';
import type { Serializable } from 'lib/Zen';

type RequiredValues = {
  /**
   * The way we want to format the display values. E.g. if the type is 'DATE',
   * the displayValueFormat might be the granularity (e.g. day or month). If
   * the display value format is 'DEFAULT' then we just display the values as
   * we receive them from the backend.
   */
  displayValueFormat: string | 'DEFAULT',

  /** The id of this grouping. E.g. 'RegionName', 'timestamp' */
  id: string,

  /**
   * The label of this grouping. E.g. RegionName's label is 'Region'. This can
   * also be user-editable (e.g. in AQT). If the label is undefined, then we
   * default to a string from our translation file.
   */
  label: string | void,

  /** The type of this grouping. E.g. 'RegionName' is a 'STRING' type */
  type: 'STRING' | 'DATE',
};

type DefaultValues = {
  /**
   * The value to display when a `null` is encountered during formatting.
   */
  nullValueDisplay: string,
};

type DerivedValues = {
  /**
   * The display label of this grouping. This is derived from the `label`.
   * If the label is undefined, then we default to a string from our translation
   * files. If a translation does not exist, then we throw an error.
   * If the `label` is not undefined, then we just use it as is.
   */
  displayLabel: string,
};

type SerializedQueryResultGrouping = {
  displayValueFormat: string | 'DEFAULT',
  id: string,
  label: string | null,
  nullValueDisplay: string,
  type: 'STRING' | 'DATE',
};

export const TIMESTAMP_GROUPING_ID = 'timestamp';

const DEFAULT_NULL_VALUE_DISPLAY = 'null';

class QueryResultGrouping
  extends Zen.BaseModel<
    QueryResultGrouping,
    RequiredValues,
    DefaultValues,
    DerivedValues,
  >
  implements Serializable<SerializedQueryResultGrouping> {
  static defaultValues: DefaultValues = {
    nullValueDisplay: DEFAULT_NULL_VALUE_DISPLAY,
  };

  static derivedConfig: Zen.DerivedConfig<
    QueryResultGrouping,
    DerivedValues,
  > = {
    displayLabel: [
      Zen.hasChanged('label'),
      grouping => {
        if (grouping.label() === undefined) {
          const id = grouping.id();
          return getFullDimensionName(id);
        }
        return grouping.label();
      },
    ],
  };

  static createNationGrouping(): Zen.Model<QueryResultGrouping> {
    return QueryResultGrouping.create({
      displayValueFormat: 'DEFAULT',
      id: 'nation',
      label: undefined,
      type: 'STRING',
    });
  }

  static fromGroupingItem(
    groupingItem: GroupingItem,
  ): Zen.Model<QueryResultGrouping> {
    if (groupingItem instanceof GroupingDimension) {
      const groupingDimension = Zen.cast<GroupingDimension>(groupingItem);
      const dimensionId = groupingItem.dimension();
      return QueryResultGrouping.create({
        displayValueFormat: 'DEFAULT',
        id: dimensionId,
        label: groupingDimension.name(),
        type: 'STRING',
      });
    }

    if (groupingItem instanceof GroupingGranularity) {
      const granularity = Zen.cast<GroupingGranularity>(groupingItem);

      // all time granularities are given the same id because this is
      // what the backend uses as the id of date columns
      return QueryResultGrouping.create({
        displayValueFormat: granularity.id(),
        id: TIMESTAMP_GROUPING_ID,
        label: granularity.name(),
        type: 'DATE',
      });
    }

    throw new Error('[QueryResultGrouping] Invalid grouping item instance');
  }

  formatGroupingValues(
    values: $ReadOnlyArray<string | number>,
    useGraphDateFormat: boolean,
    displayEthiopianDatesIfEt: boolean = true,
    simplifyDates: boolean = false,
  ): Array<string> {
    // TODO: Is it possible for a visualization to support formatting
    // multiple dates at once AND having to deal with total values? I think the
    // visualizations where this is possible already don't allow total values to
    // be shown. If it is possible, handle TOTAL value case here too.
    if (this._.type() === 'DATE') {
      // We can't just use formatGroupingValue below as if simplifyDates is true
      // then the date formatting is dependent on the prior date.
      return formatDatesByGranularity(
        values.map(value => value.toString()),
        this._.displayValueFormat(),
        useGraphDateFormat,
        displayEthiopianDatesIfEt,
        simplifyDates,
      );
    }

    return values.map(value => this.formatGroupingValue(value));
  }

  formatGroupingValue(
    value: string | number | null,
    useGraphDateFormat: boolean = false,
    displayEthiopianDatesIfEt: boolean = true,
  ): string {
    if (value === null) {
      return this._.nullValueDisplay();
    }

    if (this._.type() === 'DEFAULT') {
      return value.toString();
    }

    // If the dimension type is a date, format the date in a clean way. If the
    // date value is the TOTAL, skip formatting and return the original value.
    if (this._.type() === 'DATE' && value !== TOTAL_DIMENSION_VALUE) {
      return formatDateByGranularity(
        value.toString(),
        this._.displayValueFormat(),
        useGraphDateFormat,
        displayEthiopianDatesIfEt,
      );
    }

    return value.toString();
  }

  static deserialize(
    values: SerializedQueryResultGrouping,
  ): Zen.Model<QueryResultGrouping> {
    const { displayValueFormat, id, label, nullValueDisplay, type } = values;
    return QueryResultGrouping.create({
      displayValueFormat,
      id,
      type,
      label: label === null ? undefined : label,
      nullValueDisplay: nullValueDisplay || DEFAULT_NULL_VALUE_DISPLAY,
    });
  }

  isGeographyGrouping(): boolean {
    return this._.type() === 'STRING' && isGeographyDimension(this._.id());
  }

  getDimensionId(): string {
    const type = this._.type();
    switch (type) {
      case 'STRING':
        return this._.id();
      case 'DATE':
        return TIMESTAMP_GROUPING_ID;
      default: {
        (type: empty);
        throw new Error(`Unexpected group type received '${type}'`);
      }
    }
  }

  serialize(): SerializedQueryResultGrouping {
    const label = this._.label();
    return {
      displayValueFormat: this._.displayValueFormat(),
      id: this._.id(),
      label: label === undefined ? null : label,
      nullValueDisplay: this._.nullValueDisplay(),
      type: this._.type(),
    };
  }
}

export default ((QueryResultGrouping: $Cast): Class<
  Zen.Model<QueryResultGrouping>,
>);
