// @flow
import Promise from 'bluebird';
import invariant from 'invariant';

import * as Zen from 'lib/Zen';
import Dimension from 'models/core/wip/Dimension';
import DimensionValue from 'models/core/wip/Dimension/DimensionValue';
import NotFilter from 'models/core/wip/QueryFilter/NotFilter';
import OrFilter from 'models/core/wip/QueryFilter/OrFilter';
import memoizeOne from 'decorators/memoizeOne';
import { uniqueId } from 'util/util';
import type { Customizable } from 'types/interfaces/Customizable';
import type { Displayable } from 'types/interfaces/Displayable';
import type { NamedItem } from 'models/ui/HierarchicalSelector/types';
import type { QueryFilter } from 'models/core/wip/QueryFilter/types';
import type { Serializable } from 'lib/Zen';

type RequiredValues = {
  // HACK(stephen): Right now, DimensionValueFilterItem stores an array of
  // dimension values to filter on. These dimension values all cover the same
  // dimension. This assumption likely will not hold in the future when complex
  // filters are supported.
  dimension: string,
  id: string,
};

type DefaultValues = {
  +dimensionValues: Zen.Array<DimensionValue>,
  +invert: boolean,
};

export type SerializedDimensionValueFilterItem = {
  dimension: string,
  dimensionValues: $ReadOnlyArray<Zen.Serialized<DimensionValue>>,
  id: string,
  invert: boolean,
};

class DimensionValueFilterItem
  extends Zen.BaseModel<DimensionValueFilterItem, RequiredValues, DefaultValues>
  implements
    Serializable<SerializedDimensionValueFilterItem>,
    Customizable<DimensionValueFilterItem>,
    Displayable,
    NamedItem {
  tag: 'DIMENSION_VALUE_FILTER_ITEM' = 'DIMENSION_VALUE_FILTER_ITEM';
  static defaultValues: DefaultValues = {
    dimensionValues: Zen.Array.create(),
    invert: false,
  };

  /**
   * Create a DimensionValueFilterItem from a series of dimension values.
   * All the dimension values must be of the same dimension.
   */
  static createFromDimensionValues(
    ...dimensionValues: $ReadOnlyArray<DimensionValue>
  ): Zen.Model<DimensionValueFilterItem> {
    const dimensions = Array.from(
      new Set(dimensionValues.map(v => v.dimension())),
    );
    invariant(
      dimensions.length === 1,
      'Unable to deduce single dimension from dimension values received.',
    );

    const dimension = dimensions[0];
    return DimensionValueFilterItem.create({
      dimension,
      dimensionValues: Zen.Array.create(dimensionValues),
      id: `${dimension}__${uniqueId()}`,
    });
  }

  static deserializeAsync(
    values: SerializedDimensionValueFilterItem,
  ): Promise<Zen.Model<DimensionValueFilterItem>> {
    const { dimension, id, invert } = values;
    return Promise.all(
      values.dimensionValues.map(DimensionValue.deserializeAsync),
    ).then(dimensionValues =>
      DimensionValueFilterItem.create({
        id,
        invert,
        dimension: Dimension.deserializeToString(dimension),
        dimensionValues: Zen.Array.create(dimensionValues),
      }),
    );
  }

  static UNSAFE_deserialize(
    values: SerializedDimensionValueFilterItem,
  ): Zen.Model<DimensionValueFilterItem> {
    const dimensionValues = values.dimensionValues.map(
      DimensionValue.UNSAFE_deserialize,
    );
    return DimensionValueFilterItem.create({
      dimension: Dimension.deserializeToString(values.dimension),
      dimensionValues: Zen.Array.create(dimensionValues),
      id: values.id,
      invert: values.invert,
    });
  }

  customize(): Zen.Model<DimensionValueFilterItem> {
    return this._.id(`${this._.id()}__${uniqueId()}`);
  }

  displayValue(): string {
    const dimensionValues = this._.dimensionValues();
    const count = dimensionValues.size();

    // TODO(stephen): Translate this.
    const base =
      count === 1 ? dimensionValues.get(0).displayValue() : `${count} selected`;
    if (this._.invert()) {
      // TODO(stephen, pablo): Translate this too.
      return `NOT ${base}`;
    }
    return base;
  }

  _buildFilter(): QueryFilter {
    const values = this._.dimensionValues();

    if (values.size() === 1) {
      return values.get(0).filter();
    }

    return OrFilter.create({
      fields: values.map(d => d.filter()),
    });
  }

  /**
   * Return the fully built filter, which wraps in a NotFilter if `invert` is
   * set
   */
  @memoizeOne
  getFullyBuiltFilter(): QueryFilter | void {
    if (this.isEmpty()) {
      return undefined;
    }

    const filter = this._buildFilter();
    if (this._.invert()) {
      return NotFilter.create({
        field: filter,
      });
    }
    return filter;
  }

  isSame(
    dimensionValueFilterItem: Zen.Model<DimensionValueFilterItem>,
  ): boolean {
    if (
      this._.dimensionValues().size() !==
      dimensionValueFilterItem.dimensionValues().size()
    ) {
      return false;
    }

    return this._.dimensionValues().every(
      (dimensionValue, index) =>
        dimensionValue.id() ===
        dimensionValueFilterItem
          .dimensionValues()
          .get(index)
          .id(),
      true,
    );
  }

  /**
   * Report if the current DimensionValueFilterItem has no values selected and
   * would produce an empty QueryFilter if added to a query.
   */
  isEmpty(): boolean {
    return this._.dimensionValues().isEmpty();
  }

  // This function is necessary to use this model in our AQT FilterSelector
  // without getting a type error
  name(): string {
    return this._.id();
  }

  serialize(): SerializedDimensionValueFilterItem {
    return {
      dimension: this._.dimension(),
      dimensionValues: Zen.serializeArray(this._.dimensionValues()),
      id: this._.id(),
      invert: this._.invert(),
    };
  }
}

export default ((DimensionValueFilterItem: $Cast): Class<
  Zen.Model<DimensionValueFilterItem>,
>);
